//
// Set of utility functions
//

'use strict';

const AWS = require('aws-sdk');
const Alexa = require('ask-sdk');
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const speechUtils = require('alexa-speech-utils')();
const querystring = require('querystring');
const request = require('request');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const https = require('https');
const moment = require('moment-timezone');
const seedrandom = require('seedrandom');

module.exports = {
  getWelcome: function(event, attributes, format, callback) {
    const res = require('./resources')(event.request.locale);
    let greeting = '';

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
      callback(options[j].replace('{0}', greeting));
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
  // We need to hand-roll the buy response
  getPurchaseDirective: function(event, attributes, product) {
    let productId;

    if (attributes.paid && attributes.paid[product.id]) {
      productId = attributes.paid[product.id].productId;
    }

    if (productId) {
      // Set the state for this node - either purchase or refund pending
      let state;
      if (product.name == 'Cancel') {
        // Will get set to REFUND_PENDING if they confirm they want a refund
        state = attributes.paid[product.id].state;
      } else if (attributes.paid[product.id].state == 'REFUND_PENDING') {
        state = 'REFUND_PENDING';
      } else {
        state = 'PURCHASE_PENDING';
      }
      attributes.paid[product.id].state = state;

      // Add a SendRequest directive
      console.log('Purchase directive!');
      return {
        'type': 'Connections.SendRequest',
        'name': product.name,
        'payload': {
          'InSkillProduct': {
            'productId': productId,
          },
          'upsellMessage': product.upsellMessage,
        },
        'token': (product.token ? product.token : product.name),
      };
    } else {
      // Something went wrong
      return undefined;
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
    const res = require('./resources')(locale);
    const game = attributes[attributes.currentGame];
    const scoreType = (attributes.currentGame === 'tournament') ? 'bankroll' : 'achievement';
    let leaderURL = process.env.SERVICEURL + 'blackjack/leaders';
    const myScore = (scoreType === 'achievement') ?
            module.exports.getAchievementScore(attributes.achievements) : game[scoreType];
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
              .replace('{2}', roundPlayers(locale, leaders.count));
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
  getPurchasedProducts: function(event, attributes, callback) {
    // First check whether we can use cached data
    const availableProducts = ['spanish'];
    let check;

    // Purchased products is only for US Alexa customers
    if (attributes.bot || (attributes.platform === 'google') ||
      (event.request.locale !== 'en-US')) {
      check = false;
      attributes.paid = undefined;
    } else if (attributes.paid) {
      // Do they have all products accounted for?
      availableProducts.forEach((product) => {
        if (!attributes.paid[product]) {
          // New product, need to check
          check = true;
        } else {
          if ((attributes.paid[product].state == 'PURCHASE_PENDING') ||
            (attributes.paid[product].state == 'REFUND_PENDING')) {
            // Purchase or refund in progress - need to check
            check = true;
          }
        }
      });
    } else {
      // Nothing here, so check the API
      check = true;
    }

    if (check) {
      // Invoke the entitlement API to load products
      const apiEndpoint = 'api.amazonalexa.com';
      const token = 'bearer ' + event.context.System.apiAccessToken;
      const language = event.request.locale;
      const apiPath = '/v1/users/~current/skills/~current/inSkillProducts';
      const options = {
        host: apiEndpoint,
        path: apiPath,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': language,
          'Authorization': token,
        },
      };

      // Call the API
      const req = https.get(options, (res) => {
        let returnData = '';
        res.setEncoding('utf8');
        if (res.statusCode != 200) {
          console.log('inSkillProducts returned status code ' + res.statusCode);
          callback(res.statusCode);
        } else {
          res.on('data', (chunk) => {
            returnData += chunk;
          });

          res.on('end', () => {
            const inSkillProductInfo = JSON.parse(returnData);
            if (Array.isArray(inSkillProductInfo.inSkillProducts)) {
              // Let's see what they paid for
              if (!attributes.paid) {
                attributes.paid = {};
              }

              inSkillProductInfo.inSkillProducts.forEach((product) => {
                let state;

                if ((product.type == 'ENTITLEMENT') && (product.entitled == 'ENTITLED')) {
                  // State is purchased unless a refund was in progress
                  state = (attributes.paid[product.referenceName] &&
                      (attributes.paid[product.referenceName].state == 'REFUND_PENDING'))
                      ? 'REFUND_PENDING' : 'PURCHASED';
                } else {
                  // Just in case, we should clear the spanish game if it's not purchased
                  // Skip this though if a trial is underway
                  state = 'AVAILABLE';
                  if (!process.env.SPANISHTRIAL) {
                    attributes.spanish = undefined;
                    if (attributes.currentGame == 'spanish') {
                      attributes.currentGame = 'standard';
                    }
                  }
                }

                attributes.paid[product.referenceName] = {
                  productId: product.productId,
                  state: state,
                };
              });
            }

            callback();
          });
        }
      });

      req.on('error', (err) => {
        console.log('Error calling inSkillProducts API: ' + err.message);
        callback(err);
      });
    } else {
      // No need to check - can just return without error
      callback();
    }
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

function roundPlayers(locale, playerCount) {
  const res = require('./resources')(locale);

  if (playerCount < 200) {
    return playerCount;
  } else {
    // "Over" to the nearest hundred
    return res.strings.MORE_THAN_PLAYERS.replace('{0}', 100 * Math.floor(playerCount / 100));
  }
}

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
