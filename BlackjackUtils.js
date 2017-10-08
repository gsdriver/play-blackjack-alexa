//
// Set of utility functions
//

'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const speechUtils = require('alexa-speech-utils')();
const request = require('request');

// Global session ID
let globalEvent;

module.exports = {
  emitResponse: function(emit, locale, error, response, speech, reprompt, cardTitle, cardText) {
    const formData = {};

    // Async call to save state and logs if necessary
    if (process.env.SAVELOG) {
      const result = (error) ? error : ((response) ? response : speech);
      formData.savelog = JSON.stringify({
        event: globalEvent,
        result: result,
      });
    }
    if (response) {
      formData.savedb = JSON.stringify({
        userId: globalEvent.session.user.userId,
        attributes: globalEvent.session.attributes,
      });
    }

    if (formData.savelog || formData.savedb) {
      const params = {
        url: process.env.SERVICEURL + 'blackjack/saveState',
        formData: formData,
      };

      request.post(params, (err, res, body) => {
        if (err) {
          console.log(err);
        }
      });
    }

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
    } else {
      emit(':ask', speech, reprompt);
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
    const achievementScore = getAchievementScore(attributes.achievements);

    if (achievementScore) {
      text = res.strings.READ_BANKROLL_WITH_ACHIEVEMENT.replace('{0}', game.bankroll).replace('{1}', achievementScore);
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
  getHighScore(attributes, callback) {
    getTopScoresFromS3(attributes, 'bankroll', (err, scores) => {
      callback(err, (scores) ? scores[0] : undefined);
    });
  },
  readLeaderBoard: function(locale, attributes, callback) {
    const res = require('./' + locale + '/resources');
    const game = attributes[attributes.currentGame];
    const scoreType = (attributes.currentGame === 'tournament') ? 'bankroll' : 'achievementScore';
    const myScore = (scoreType === 'achievementScore') ?
            getAchievementScore(attributes.achievements) : game[scoreType];

    getTopScoresFromS3(attributes, scoreType, (err, scores) => {
      let speech = '';

      // OK, read up to five high scores
      if (!scores || (scores.length === 0)) {
        // No scores to read
        speech = res.strings.LEADER_NO_SCORES;
      } else {
        // What is your ranking - assuming you have achievements
        if (myScore > 0) {
          const ranking = scores.indexOf(myScore) + 1;

          speech += ((scoreType === 'bankroll') ? res.strings.LEADER_BANKROLL_RANKING : res.strings.LEADER_RANKING)
            .replace('{0}', myScore)
            .replace('{1}', ranking)
            .replace('{2}', scores.length);
        }

        // And what is the leader board?
        const toRead = (scores.length > 5) ? 5 : scores.length;
        let topScores = scores.slice(0, toRead);
        if (scoreType === 'bankroll') {
          topScores = topScores.map((x) => res.strings.LEADER_BANKROLL_FORMAT.replace('{0}', x));
        }

        speech += ((scoreType === 'bankroll') ? res.strings.LEADER_TOP_BANKROLLS : res.strings.LEADER_TOP_SCORES).replace('{0}', toRead);
        speech += speechUtils.and(topScores, {locale: locale, pause: '300ms'});
        if (scoreType === 'achievementScore') {
          speech += res.strings.LEADER_ACHIEVEMENT_HELP;
        }
      }

      callback(speech);
    });
  },
};

function getTopScoresFromS3(attributes, scoreType, callback) {
  const game = attributes[attributes.currentGame];

  // Read the S3 buckets that has everyone's scores
  s3.getObject({Bucket: 'garrett-alexa-usage', Key: 'BlackjackScores.txt'}, (err, data) => {
    if (err) {
      console.log(err, err.stack);
      callback(err, null);
    } else {
      // Yeah, I can do a binary search (this is sorted), but straight search for now
      const ranking = JSON.parse(data.Body.toString('ascii'));
      const scores = ranking.scores;
      const myScore = (scoreType === 'achievementScore') ?
              getAchievementScore(attributes.achievements) : game[scoreType];

      if (scores && scores[attributes.currentGame]) {
        const mappedScores = scores[attributes.currentGame].map((a) => a[scoreType]);

        // If their current achievement score isn't in the list, add it
        if (mappedScores.indexOf(myScore) < 0) {
          mappedScores.push(myScore);
        }

        callback(null, mappedScores.sort((a, b) => (b - a)));
      } else {
        console.log('No scores for ' + attributes.currentGame);
        callback('No scoreset', null);
      }
    }
  });
}

function getAchievementScore(achievements) {
  let achievementScore = 0;

  if (achievements) {
    if (achievements.trophy) {
      achievementScore += 100 * achievements.trophy;
    }
    if (achievements.daysPlayed) {
      achievementScore += 10 * achievements.daysPlayed;
    }
    if (achievements.naturals) {
      achievementScore += 5 * achievements.naturals;
    }
    if (achievements.streakScore) {
      achievementScore += achievements.streakScore;
    }
  }

  return achievementScore;
}
