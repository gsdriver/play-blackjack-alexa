//
// Set of utility functions
//

'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const speechUtils = require('alexa-speech-utils')();
const logger = require('alexa-logger');

// Global session ID
let globalEvent;

module.exports = {
  emitResponse: function(emit, locale, error, response, speech,
                        reprompt, cardTitle, cardText, linQ) {
    let numCalls = 0;

    // Save to S3 if environment variable is set
    if (process.env.SAVELOG) {
      const result = ((linQ) ? linQ : (error) ? error : ((response) ? response : speech));
      logger.saveLog(globalEvent, result,
        {bucket: 'garrett-alexa-logs', keyPrefix: 'blackjack/', fullLog: true},
        (err) => {
        if (err) {
          console.log(err, err.stack);
        }

        if (--numCalls === 0) {
          emitResult();
        }
      });
    }

    if (response) {
      // Save state
      numCalls++;
      const doc = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
      doc.put({TableName: 'PlayBlackjack',
          Item: {userId: globalEvent.session.user.userId,
                mapAttr: globalEvent.session.attributes}},
          (err, data) => {
        if (--numCalls === 0) {
          emitResult();
        }
      });
    }

    if (!numCalls) {
      emitResult();
    }

    function emitResult() {
      if (!process.env.NOLOG) {
        console.log(JSON.stringify(globalEvent));
      }

      if (error) {
        const res = require('./' + locale + '/resources');
        console.log('Speech error: ' + error);
        emit(':ask', error, res.ERROR_REPROMPT);
      } else if (response) {
        emit(':tell', response);
      } else if (cardTitle) {
        emit(':askWithCard', speech, reprompt, cardTitle, cardText);
      } else if (linQ) {
        emit(':askWithLinkAccountCard', linQ);
      } else {
        emit(':ask', speech, reprompt);
      }
    }
  },
  setEvent: function(event) {
    globalEvent = event;
  },
  // Figures out what state of the game we're in
  getState: function(attributes) {
    const game = attributes[attributes.currentGame];

    // New game - ready to start a new game
    if (game.possibleActions.indexOf('bet') >= 0) {
      return 'NEWGAME';
    } else if (game.possibleActions.indexOf('noinsurance') >= 0) {
      return 'INSURANCEOFFERED';
    } else {
      return 'INGAME';
    }
  },
  readBankroll: function(locale, attributes) {
    const res = require('./' + locale + '/resources');
    const game = attributes[attributes.currentGame];
    let text;

    if (attributes.trophy) {
      if (attributes.trophy > 1) {
        text = res.strings.READ_BANKROLL_WITH_TROPHIES.replace('{0}', game.bankroll).replace('{1}', attributes.trophy);
      } else {
        text = res.strings.READ_BANKROLL_WITH_TROPHY.replace('{0}', game.bankroll);
      }
    } else {
      text = res.strings.YOUR_BANKROLL_TEXT.replace('{0}', game.bankroll);
    }

    return text;
  },
  getProgressivePayout: function(attributes, callback) {
    // Read from Dynamodb
    const game = attributes[attributes.currentGame];

    if (game.progressive) {
      dynamodb.getItem({TableName: 'PlayBlackjack', Key: {userId: {S: 'game-' + attributes.currentGame}}},
              (err, data) => {
        if (err || (data.Item === undefined)) {
          console.log(err);
          callback((game.progressiveJackpot) ? game.progressiveJackpot : game.progressive.starting);
        } else {
          let hands;

          if (data.Item.hands && data.Item.hands.N) {
            hands = parseInt(data.Item.hands.N);
          } else {
            hands = 0;
          }

          callback(Math.floor(game.progressive.starting + (hands * game.progressive.jackpotRate)));
        }
      });
    } else {
      // No progressive jackpot
      callback(undefined);
    }
  },
  incrementProgressive: function(attributes) {
    const game = attributes[attributes.currentGame];

    if (game.progressive) {
      const params = {
          TableName: 'PlayBlackjack',
          Key: {userId: {S: 'game-' + attributes.currentGame}},
          AttributeUpdates: {hands: {
              Action: 'ADD',
              Value: {N: '1'}},
          }};

      dynamodb.updateItem(params, (err, data) => {
        if (err) {
          console.log(err);
        }
      });
    }
  },
  // Updates DynamoDB and S3 to note the jackpot win
  updateProgressiveJackpot: function(userId, game, jackpot, callback) {
    let callsToComplete = 3;

    // Write to the DB, and reset the hands played to 0
    dynamodb.putItem({TableName: 'PlayBlackjack',
        Item: {userId: {S: 'game-' + game}, hands: {N: '0'}}},
        (err, data) => {
      // We don't take a callback, but if there's an error log it
      if (err) {
        console.log(err);
      }
      complete();
    });

    // Update number of progressive wins while you're at it
    dynamodb.updateItem({TableName: 'PlayBlackjack',
        Key: {userId: {S: 'game-' + game}},
        AttributeUpdates: {jackpots: {
            Action: 'ADD',
            Value: {N: '1'}},
    }}, (err, data) => {
      // Again, don't care about the error
      if (err) {
        console.log(err);
      }
      complete();
    });

    // And write this jackpot out to S3
    const details = {userId: userId, amount: jackpot};
    const params = {Body: JSON.stringify(details),
      Bucket: 'garrett-alexa-usage',
      Key: 'jackpots/blackjack/' + game + '-' + Date.now() + '.txt'};

    s3.putObject(params, (err, data) => {
      if (err) {
        console.log(err, err.stack);
      }
      complete();
    });

    // This function keeps track of when we've completed all calls
    function complete() {
      callsToComplete--;
      if (callsToComplete === 0) {
        callback();
      }
    }
  },
  saveNewUser: function() {
    // Brand new player - let's log this in our DB (async call)
    const params = {
              TableName: 'PlayBlackjack',
              Key: {userId: {S: 'game'}},
              AttributeUpdates: {newUsers: {
                  Action: 'ADD',
                  Value: {N: '1'}},
              }};

    dynamodb.updateItem(params, (err, data) => {
      if (err) {
        console.log(err);
      }
    });
  },
  getHighScore(attributes, callback) {
    getTopScoresFromS3(attributes, (err, scores) => {
      callback(err, (scores) ? scores[0] : undefined);
    });
  },
  readLeaderBoard: function(locale, attributes, callback) {
    const res = require('./' + locale + '/resources');
    const game = attributes[attributes.currentGame];

    getTopScoresFromS3(attributes, (err, scores) => {
      let speech = '';

      // OK, read up to five high scores
      if (!scores || (scores.length === 0)) {
        // No scores to read
        speech = res.strings.LEADER_NO_SCORES;
      } else {
        // What is your ranking - assuming you've done a spin
        if (game.hands > 0) {
          const ranking = scores.indexOf(game.bankroll) + 1;

          speech += res.strings.LEADER_RANKING
            .replace('{0}', game.bankroll)
            .replace('{1}', ranking)
            .replace('{2}', scores.length);
        }

        // And what is the leader board?
        const toRead = (scores.length > 5) ? 5 : scores.length;
        const topScores = scores.slice(0, toRead).map((x) => res.strings.LEADER_FORMAT.replace('{0}', x));
        speech += res.strings.LEADER_TOP_SCORES.replace('{0}', toRead);
        speech += speechUtils.and(topScores, {locale: locale, pause: '300ms'});
      }

      callback(speech);
    });
  },
};


function getTopScoresFromS3(attributes, callback) {
  const game = attributes[attributes.currentGame];

  // Read the S3 buckets that has everyone's scores
  s3.getObject({Bucket: 'garrett-alexa-usage', Key: 'BlackjackScores2.txt'}, (err, data) => {
    if (err) {
      console.log(err, err.stack);
      callback(err, null);
    } else {
      // Yeah, I can do a binary search (this is sorted), but straight search for now
      const ranking = JSON.parse(data.Body.toString('ascii'));
      const scores = ranking.scores;

      if (scores && scores[attributes.currentGame]) {
        const bankrolls = scores[attributes.currentGame].map((a) => a.bankroll);

        // If their current bankroll isn't in the list, add it
        if (bankrolls.indexOf(game.bankroll) < 0) {
          bankrolls.push(game.bankroll);
        }

        callback(null, bankrolls.sort((a, b) => (b - a)));
      } else {
        console.log('No scores for ' + attributes.currentGame);
        callback('No scoreset', null);
      }
    }
  });
}
