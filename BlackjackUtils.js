//
// Set of utility functions
//

'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const speechUtils = require('alexa-speech-utils')();
const querystring = require('querystring');
const request = require('request');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

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
      if (attributes.newUser) {
        return 'FIRSTTIMEPLAYER';
      }
      return 'NEWGAME';
    } else if (game.suggestion) {
      return 'SUGGESTION';
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
    const leaderURL = process.env.SERVICEURL + 'blackjack/leaders?count=1&game=' + attributes.currentGame;

    request(
      {
        uri: leaderURL,
        method: 'GET',
        timeout: 1000,
      }, (err, response, body) => {
      if (err) {
        callback(err);
      } else {
        const leaders = JSON.parse(body);

        callback(null, (leaders.top) ? leaders.top[0] : undefined);
      }
    });
  },
  readLeaderBoard: function(locale, userId, attributes, callback) {
    const res = require('./' + locale + '/resources');
    const game = attributes[attributes.currentGame];
    const scoreType = (attributes.currentGame === 'tournament') ? 'bankroll' : 'achievement';
    let leaderURL = process.env.SERVICEURL + 'blackjack/leaders';
    const myScore = (scoreType === 'achievement') ?
            getAchievementScore(attributes.achievements) : game[scoreType];
    let speech = '';
    const params = {};

    if (myScore > 0) {
      params.userId = userId;
      params.score = myScore;
    }
    if (scoreType === 'bankroll') {
      params.game = attributes.currentGame;
    }
    const paramText = querystring.stringify(params);
    if (paramText.length) {
      leaderURL += '?' + paramText;
    }

    request(
      {
        uri: leaderURL,
        method: 'GET',
        timeout: 1000,
      }, (err, response, body) => {
      if (err) {
        // No scores to read
        speech = res.strings.LEADER_NO_SCORES;
      } else {
        const leaders = JSON.parse(body);

        if (!leaders.count || !leaders.top) {
          // Something went wrong
          speech = res.strings.LEADER_NO_SCORES;
        } else {
          if (leaders.rank) {
            speech += ((scoreType === 'bankroll') ? res.strings.LEADER_BANKROLL_RANKING : res.strings.LEADER_RANKING)
              .replace('{0}', myScore)
              .replace('{1}', leaders.rank)
              .replace('{2}', leaders.count);
          }

          // And what is the leader board?
          let topScores = leaders.top;
          if (scoreType === 'bankroll') {
            topScores = topScores.map((x) => res.strings.LEADER_BANKROLL_FORMAT.replace('{0}', x));
          }

          speech += ((scoreType === 'bankroll') ? res.strings.LEADER_TOP_BANKROLLS
              : res.strings.LEADER_TOP_SCORES).replace('{0}', topScores.length);
          speech += speechUtils.and(topScores, {locale: locale, pause: '300ms'});
          if (scoreType === 'achievement') {
            speech += res.strings.LEADER_ACHIEVEMENT_HELP;
          }
        }
      }

      callback(speech);
    });
  },
  readSuggestions(attributes, callback) {
    // If it's already been read, don't read it again
    if (attributes.analysis) {
      callback();
      return;
    }

    // In the date range, so download from S3
    s3.getObject({Bucket: 'garrett-alexa-analysis', Key: 'suggestions.txt'}, (err, data) => {
      if (data) {
        const suggestions = JSON.parse(data.Body.toString('ascii'));

        if (suggestions && suggestions[attributes.userId]) {
          // Great, save these suggestions
          attributes.analysis = suggestions[attributes.userId];
        } else {
          // Make note that we've already read this and found no suggestion
          attributes.analysis = {none: 1};
        }
      }

      callback();
    });
  },
};

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
