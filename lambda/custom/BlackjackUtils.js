//
// Set of utility functions
//

'use strict';

const AWS = require('aws-sdk');
const Alexa = require('ask-sdk');
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const querystring = require('querystring');
const request = require('request');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const https = require('https');
const moment = require('moment-timezone');
const seedrandom = require('seedrandom');

module.exports = {
  getWelcome: function(handlerInput, format, callback) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('./resources')(event.request.locale);
    let greeting = '';

    module.exports.getUserName(handlerInput).then((name) => {
      const givenName = name ? name : '';
      getUserTimezone(event, (timezone) => {
        if (timezone) {
          const hour = moment.tz(Date.now(), timezone).format('H');
          if ((hour > 5) && (hour < 12)) {
            greeting = res.strings.GOOD_MORNING;
          } else if ((hour >= 12) && (hour < 18)) {
            greeting = res.strings.GOOD_AFTERNOON;
          } else {
            greeting = res.strings.GOOD_EVENING;
          }
        }

        const game = attributes[attributes.currentGame];
        const options = format.split('|');
        const randomValue = seedrandom(game.userID + (game.timestamp ? game.timestamp : ''))();
        let j = Math.floor(randomValue * options.length);
        if (j == options.length) {
          j--;
        }
        callback(options[j].replace('{0}', greeting.replace('{Name}', givenName)));
      });
    });
  },
  findQuestionableResponse: function(handlerInput, callback) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    // If the request is "questionable" then we will log it
    if (process.env.SERVICEURL && attributes.temp && attributes.temp.lastResponse) {
      // Post to check for questionable content
      const formData = {
        response: attributes.temp.lastResponse,
      };
      const params = {
        url: process.env.SERVICEURL + 'blackjack/checkResponse',
        method: 'POST',
        formData: formData,
      };
      request(params, (err, response, body) => {
        callback();
      });
    } else {
      return callback();
    }
  },
  getUserName: function(handlerInput) {
    const usc = handlerInput.serviceClientFactory.getUpsServiceClient();
    const attributes = handlerInput.attributesManager.getSessionAttributes();
     if (attributes.given_name) {
      return Promise.resolve(attributes.given_name);
    }
     return usc.getProfileGivenName()
    .then((givenName) => {
      attributes.given_name = givenName;
      return givenName;
    })
    .catch((err) => {
      // If we need permissions, return false - otherwise, return undefined
      return (err.statusCode === 403) ? false : undefined;
    });
  },
  getLocalTournamentTime: function(handlerInput, callback) {
    const event = handlerInput.requestEnvelope;
    const res = require('./resources')(event.request.locale);

    getUserTimezone(event, (timezone) => {
      const tz = (timezone) ? timezone : 'America/Los_Angeles';
      const time = getTournamentTime(tz);
      if (time) {
        // Get the user timezone
        moment.locale(event.request.locale);
        const useDefaultTimezone = (timezone === undefined);
        const result = moment(time).format('dddd h a');
        callback(result,
          (useDefaultTimezone ? res.strings.TOURNAMENT_DEFAULT_TIMEZONE : ''));
      } else {
        callback();
      }
    });
  },
  setTournamentReminder: function(handlerInput, callback) {
    const alert = {};
    const event = handlerInput.requestEnvelope;
    const res = require('./resources')(event.request.locale);
    let timezone;

    getUserTimezone(event, (tz) => {
      // Let's see whether to set a reminder at 9 AM or 5 PM
      // based on what will give the user the most time in
      // their timezone
      timezone = (tz) ? tz : 'America/Los_Angeles';
      const tourney = getTournamentTime(timezone);

      if (tourney) {
        // Lop off trailing Z from string
        let start = JSON.stringify(tourney);
        start = start.substring(1, start.length - 1);
        if (start.substring(start.length - 1) === 'Z') {
          start = start.substring(0, start.length - 1);
        }

        moment.locale('en');
        alert.requestTime = start;
        alert.trigger = {
          type: 'SCHEDULED_ABSOLUTE',
          scheduledTime: start,
          timeZoneId: timezone,
          recurrence: {
            freq: 'WEEKLY',
            byDay: [moment(tourney).format('dd').toUpperCase()],
          },
        };
        alert.alertInfo = {
          spokenInfo: {
            content: [{
              locale: event.request.locale,
              text: res.strings.REMINDER_TEXT,
            }],
          },
        };
        alert.pushNotification = {
          status: 'ENABLED',
        };
        const params = {
          url: event.context.System.apiEndpoint + '/v1/alerts/reminders',
          method: 'POST',
          headers: {
            'Authorization': 'bearer ' + event.context.System.apiAccessToken,
          },
          json: alert,
        };
        console.log('SetReminder alert: ' + JSON.stringify(alert));

        // Post the reminder
        request(params, (err, response, body) => {
          if (body && body.code && (body.code !== 'OK')) {
            console.log('SetReminder error ' + body.code);
            callback(body.code);
          } else {
            // OK, return the time and timezone
            module.exports.getLocalTournamentTime(handlerInput, (time, timezone) => {
              callback({time: time, timezone: timezone});
            });
          }
        });
      } else {
        callback();
      }
    });
  },
  isReminderActive: function(handlerInput, callback) {
    // Invoke the reminders API to load active reminders
    const event = handlerInput.requestEnvelope;
    const params = {
      uri: event.context.System.apiEndpoint + '/v1/alerts/reminders',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': event.request.locale,
        'Authorization': 'bearer ' + event.context.System.apiAccessToken,
      },
    };

    request(params, (err, response, body) => {
      // Return the local tournament time
      let isActive = false;
      if (body) {
        console.log('isReminderActive ' + body);
        const alerts = JSON.parse(body);
        if (alerts && alerts.alerts) {
          alerts.alerts.forEach((alert) => {
            if (alert.status === 'ON') {
              isActive = true;
            }
          });
        }
      } else {
        console.log('isReminderActive error ' + err.error);
        console.log('isReminderActive request: ' + JSON.stringify(options));
      }
      callback(isActive);
    });
  },
  getResponse: function(handlerInput, error, response, speech, reprompt) {
    if (error) {
      const event = handlerInput.requestEnvelope;
      const res = require('./resources')(event.request.locale);

      return handlerInput.responseBuilder
        .speak(error)
        .reprompt(res.strings.ERROR_REPROMPT)
        .getResponse();
    } else if (response) {
      return handlerInput.responseBuilder
        .speak(response)
        .withShouldEndSession(true)
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt(reprompt)
        .getResponse();
    }
  },
  // Figures out what state of the game we're in
  getState: function(attributes) {
    const game = attributes[attributes.currentGame];

    // New game - ready to start a new game
    if (attributes.temp.joinTournament) {
      return 'JOINTOURNAMENT';
    } else if (attributes.temp.selectingGame) {
      return 'SELECTGAME';
    } else if (attributes.temp.confirmReset) {
      return 'CONFIRMRESET';
    } else if (attributes.temp.confirmPurchase) {
      return 'CONFIRMPURCHASE';
    } else if (attributes.temp.confirmRefund) {
      return 'CONFIRMREFUND';
    } else if (game.possibleActions.indexOf('bet') >= 0) {
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
    const res = require('./resources')(locale);
    const game = attributes[attributes.currentGame];
    let text;
    const achievementScore = module.exports.getAchievementScore(attributes.achievements);

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
    let leaderURL = process.env.SERVICEURL + 'blackjack/leadersWithNames';
    const scoreType = (attributes.currentGame === 'tournament') ? 'bankroll' : 'achievement';
    const game = attributes[attributes.currentGame];
    const myScore = (scoreType === 'achievement') ?
            module.exports.getAchievementScore(attributes.achievements) : game[scoreType];
    const params = {};

    if (myScore > 0) {
      params.userName = attributes.given_name;
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
      let leaders;
      if (!err) {
        leaders = JSON.parse(body);
        leaders.score = myScore;
      }
      callback(leaders);
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
  getAchievementScore: function(achievements) {
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
  },
  drawTable: function(handlerInput, callback) {
    const response = handlerInput.responseBuilder;
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('./resources')(event.request.locale);
    let image;

    if (event.context && event.context.System &&
        event.context.System.device &&
        event.context.System.device.supportedInterfaces &&
        event.context.System.device.supportedInterfaces.Display) {
      if ((attributes.temp && attributes.temp.drawBoard)
          || attributes.originalChoices
          || !(attributes.temp && attributes.temp.imageUrl)) {
        if (!attributes.temp) {
          attributes.temp = {};
        }
        attributes.temp.drawBoard = false;
        attributes.display = true;

        if (attributes.originalChoices) {
          let i = 0;
          const listItems = [];

          attributes.originalChoices.forEach((choice) => {
            listItems.push({
              'token': 'game.' + i++,
              'textContent': {
                'primaryText': {
                  'type': 'RichText',
                  'text': '<font size=\"7\">' + res.sayGame(choice) + '</font>',
                },
              },
            });
          });

          image = new Alexa.ImageHelper()
            .addImageInstance('http://garrettvargas.com/img/blackjack-background.png')
            .getImage();
          response.addRenderTemplateDirective({
            type: 'ListTemplate1',
            token: 'listToken',
            backButton: 'HIDDEN',
            title: res.strings.SELECT_GAME_TITLE,
            backgroundImage: image,
            listItems: listItems,
          });
          callback();
        } else {
          const start = Date.now();
          const game = attributes[attributes.currentGame];
          const playerCards = game.playerHands.map((x) => x.cards);
          const formData = {
            dealer: JSON.stringify(game.dealerHand.cards),
            player: JSON.stringify(playerCards),
            nextCards: JSON.stringify(game.deck.cards.slice(0, 4)),
            table: attributes.currentGame,
          };
          if (game.activePlayer == 'none') {
            formData.showHoleCard = 'true';
          }

          const params = {
            url: process.env.SERVICEURL + 'blackjack/drawImage',
            formData: formData,
            timeout: 3000,
          };

          request.post(params, (err, res, body) => {
            if (err) {
              console.log(err);
              callback(err);
            } else {
              attributes.temp.imageUrl = JSON.parse(body).file;
              const end = Date.now();
              console.log('Drawing table took ' + (end - start) + ' ms');
              done();
            }
          });
        }
      } else {
        // Just re-use the image URL from last time
        done();
      }

      function done() {
        image = new Alexa.ImageHelper()
          .addImageInstance(attributes.temp.imageUrl)
          .getImage();
        response.addRenderTemplateDirective({
          type: 'BodyTemplate6',
          backButton: 'HIDDEN',
          title: '',
          backgroundImage: image,
        });
        callback();
      }
    } else {
      // Not a display device
      callback();
    }
  },
};

function getUserTimezone(event, callback) {
  if (event.context.System.apiAccessToken) {
    // Invoke the entitlement API to load timezone
    const options = {
      host: 'api.amazonalexa.com',
      path: '/v2/devices/' + event.context.System.device.deviceId + '/settings/System.timeZone',
      method: 'GET',
      timeout: 1000,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': event.request.locale,
        'Authorization': 'bearer ' + event.context.System.apiAccessToken,
      },
    };

    const req = https.get(options, (res) => {
      let returnData = '';
      res.setEncoding('utf8');
      if (res.statusCode != 200) {
        console.log('deviceTimezone returned status code ' + res.statusCode);
        callback();
      } else {
        res.on('data', (chunk) => {
          returnData += chunk;
        });

        res.on('end', () => {
          // Strip quotes
          const timezone = returnData.replace(/['"]+/g, '');
          callback(moment.tz.zone(timezone) ? timezone : undefined);
        });
      }
    });

    req.on('error', (err) => {
      console.log('Error calling user settings API: ' + err.message);
      callback();
    });
  } else {
    // No API token - no user timezone
    callback();
  }
}

function getTournamentTime(timezone) {
  let start;
  let tzOffset;

  if (process.env.TOURNAMENT) {
    // Tournament starts Monday 9 PM Pacific
    tzOffset = moment.tz.zone('America/Los_Angeles').utcOffset(Date.now());
    const d = new Date();
    d.setMinutes(d.getMinutes() - tzOffset);

    // Find the next tournament
    // First build off today's date
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    start.setHours(21);
    start.setMinutes(0);
    let offset = 1 - d.getDay();
    if (offset < 0) {
      offset += 7;
    }
    start.setDate(start.getDate() + offset);

    // Now convert to the user local timezone
    tzOffset -= moment.tz.zone(timezone).utcOffset(Date.now());
    start.setMinutes(start.getMinutes() + tzOffset);

    // Great - now massage this to be either a 9 AM or 5 PM reminder
    const hour = start.getHours();
    if (hour < 9) {
      start.setHours(9);
    } else if (hour < 17) {
      start.setHours(17);
    } else {
      start.setHours(9);
      start.setDate(start.getDate() + 1);
    }
  }

  return start;
}
