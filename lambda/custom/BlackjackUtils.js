//
// Set of utility functions
//

'use strict';

const AWS = require('aws-sdk');
const Alexa = require('alexa-sdk');
// utility methods for creating Image and TextField objects
const makePlainText = Alexa.utils.TextUtils.makePlainText;
const makeRichText = Alexa.utils.TextUtils.makeRichText;
const makeImage = Alexa.utils.ImageUtils.makeImage;
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const speechUtils = require('alexa-speech-utils')();
const querystring = require('querystring');
const request = require('request');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const https = require('https');

module.exports = {
  emitResponse: function(context, error, response, speech, reprompt, cardTitle, cardText) {
    const formData = {};

    // Async call to save state and logs if necessary
    if (process.env.SAVELOG) {
      const result = (error) ? error : ((response) ? response : speech);
      formData.savelog = JSON.stringify({
        event: context.event,
        result: result,
      });
    }

    if (response) {
      formData.savedb = JSON.stringify({
        userId: context.event.session.user.userId,
        attributes: context.event.session.attributes,
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

    if (error) {
      const res = require('./resources')(context.event.request.locale);
      console.log('Speech error: ' + error);
      context.response.speak(error)
        .listen(res.strings.ERROR_REPROMPT);
    } else if (response) {
      context.response.speak(response);
    } else if (cardTitle) {
      context.response.speak(speech)
        .listen(reprompt)
        .cardRenderer(cardTitle, cardText);
    } else {
      context.response.speak(speech)
        .listen(reprompt);
    }

    displayTable(context, () => {
      context.emit(':responseReady');
    });
  },
  // We need to hand-roll the buy response
  sendBuyResponse: function(context, product) {
    const res = require('./resources')(context.event.request.locale);
    let productId;

    if (context.attributes.paid && context.attributes.paid[product.id]) {
      productId = context.attributes.paid[product.id].productId;
    }

    if (productId) {
      // Set the state for this node - either purchase or refund pending
      let state;
      if (product.name == 'Cancel') {
        // Will get set to REFUND_PENDING if they confirm they want a refund
        state = context.attributes.paid[product.id].state;
      } else if (context.attributes.paid[product.id].state == 'REFUND_PENDING') {
        state = 'REFUND_PENDING';
      } else {
        state = 'PURCHASE_PENDING';
      }
      context.attributes.paid[product.id].state = state;

      // First save state
      const formData = {};
      formData.savedb = JSON.stringify({
        userId: context.event.session.user.userId,
        attributes: context.event.session.attributes,
      });
      const params = {
        url: process.env.SERVICEURL + 'blackjack/saveState',
        formData: formData,
      };
      request.post(params, (err, res, body) => {
        if (err) {
          console.log(err);
        }
      });

      // Add a SendRequest directive
      console.log('Purchase directive!');
      context.response.shouldEndSession(true);
      context.response._addDirective({
        'type': 'Connections.SendRequest',
        'name': product.name,
        'payload': {
          'InSkillProduct': {
            'productId': productId,
          },
          'upsellMessage': product.upsellMessage,
        },
        'token': (product.token ? product.token : product.name),
      });
      context.emit(':responseReady');
    } else {
      // Something went wrong
      module.exports.emitResponse(context, res.strings.INTERNAL_ERROR);
    }
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
  getPurchasedProducts: function(context, callback) {
    // First check whether we can use cached data
    const availableProducts = ['spanish'];
    let check;

    // Purchased products is only for US Alexa customers
    if (context.attributes.bot || (context.attributes.platform === 'google') ||
      (context.event.request.locale !== 'en-US')) {
      check = false;
      context.attributes.paid = undefined;
    } else if (context.attributes.paid) {
      // Do they have all products accounted for?
      availableProducts.forEach((product) => {
        if (!context.attributes.paid[product]) {
          // New product, need to check
          check = true;
        } else {
          if ((context.attributes.paid[product].state == 'PURCHASE_PENDING') ||
            (context.attributes.paid[product].state == 'REFUND_PENDING')) {
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
      const token = 'bearer ' + context.event.context.System.apiAccessToken;
      const language = context.event.request.locale;
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
              if (!context.attributes.paid) {
                context.attributes.paid = {};
              }

              inSkillProductInfo.inSkillProducts.forEach((product) => {
                let state;

                if ((product.type == 'ENTITLEMENT') && (product.entitled == 'ENTITLED')) {
                  // State is purchased unless a refund was in progress
                  state = (context.attributes.paid[product.referenceName] &&
                      (context.attributes.paid[product.referenceName].state == 'REFUND_PENDING'))
                      ? 'REFUND_PENDING' : 'PURCHASED';
                } else {
                  // Just in case, we should clear the spanish game if it's not purchased
                  // Skip this though if a trial is underway
                  state = 'AVAILABLE';
                  if (!process.env.SPANISHTRIAL) {
                    context.attributes.spanish = undefined;
                    if (context.attributes.currentGame == 'spanish') {
                      context.attributes.currentGame = 'standard';
                    }
                  }
                }

                context.attributes.paid[product.referenceName] = {
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
};

function displayTable(context, callback) {
  const res = require('./resources')(context.event.request.locale);

  if (context.event.context && context.event.context.System &&
      context.event.context.System.device &&
      context.event.context.System.device.supportedInterfaces &&
      context.event.context.System.device.supportedInterfaces.Display) {
    if ((context.attributes.temp && context.attributes.temp.drawBoard)
        || !(context.attributes.temp && context.attributes.temp.imageUrl)) {
      if (!context.attributes.temp) {
        context.attributes.temp = {};
      }
      context.attributes.temp.drawBoard = false;
      context.attributes.display = true;

      if (context.attributes.originalChoices) {
        const listItemBuilder = new Alexa.templateBuilders.ListItemBuilder();
        const listTemplateBuilder = new Alexa.templateBuilders.ListTemplate1Builder();
        let i = 0;

        context.attributes.originalChoices.forEach((choice) => {
          listItemBuilder.addItem(null, 'game.' + i++,
            makeRichText('<font size="7">' + res.sayGame(choice) + '</font>'));
        });

        const listItems = listItemBuilder.build();
        const listTemplate = listTemplateBuilder
          .setToken('listToken')
          .setTitle(res.strings.SELECT_GAME_TITLE)
          .setListItems(listItems)
          .setBackButtonBehavior('HIDDEN')
          .setBackgroundImage(makeImage('http://garrettvargas.com/img/blackjack-background.png'))
          .build();

        context.response.renderTemplate(listTemplate);
        callback();
      } else {
        const start = Date.now();
        const game = context.attributes[context.attributes.currentGame];
        const playerCards = game.playerHands.map((x) => x.cards);
        const formData = {
          dealer: JSON.stringify(game.dealerHand.cards),
          player: JSON.stringify(playerCards),
          nextCards: JSON.stringify(game.deck.cards.slice(0, 4)),
          table: context.attributes.currentGame,
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
            context.attributes.temp.imageUrl = JSON.parse(body).file;
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
      // Use this as the background image
      const builder = new Alexa.templateBuilders.BodyTemplate6Builder();
      const template = builder.setTitle('')
                  .setBackgroundImage(makeImage(context.attributes.temp.imageUrl))
                  .setTextContent(makePlainText(''))
                  .setBackButtonBehavior('HIDDEN')
                  .build();

      context.response.renderTemplate(template);
      callback();
    }
  } else {
    // Not a display device
    callback();
  }
}

function roundPlayers(locale, playerCount) {
  const res = require('./resources')(locale);

  if (playerCount < 200) {
    return playerCount;
  } else {
    // "Over" to the nearest hundred
    return res.strings.MORE_THAN_PLAYERS.replace('{0}', 100 * Math.floor(playerCount / 100));
  }
}
