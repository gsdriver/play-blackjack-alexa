'use strict';

const Alexa = require('ask-sdk');
const CanFulfill = require('./intents/CanFulfill');
const Launch = require('./intents/Launch');
const OfferTournament = require('./intents/OfferTournament');
const TournamentJoin = require('./intents/TournamentJoin');
const SessionEnd = require('./intents/SessionEnd');
const Blackjack = require('./intents/Blackjack');
const Betting = require('./intents/Betting');
const SideBet = require('./intents/SideBet');
const Suggest = require('./intents/Suggest');
const TakeSuggestion = require('./intents/TakeSuggestion');
const Rules = require('./intents/Rules');
const ChangeRules = require('./intents/ChangeRules');
const Insurance = require('./intents/Insurance');
const Repeat = require('./intents/Repeat');
const HighScore = require('./intents/HighScore');
const Help = require('./intents/Help');
const Exit = require('./intents/Exit');
const Reset = require('./intents/Reset');
const Reminder = require('./intents/Reminder');
const ConfirmReset = require('./intents/ConfirmReset');
const ConfirmSelect = require('./intents/ConfirmSelect');
const Select = require('./intents/Select');
const Training = require('./intents/Training');
const BuyGood = require('./intents/BuyGood');
const Unhandled = require('./intents/Unhandled');
const ListPurchases = require('./intents/ListPurchases');
const Purchase = require('./intents/Purchase');
const Refund = require('./intents/Refund');
const ProductResponse = require('./intents/ProductResponse');
const SessionResumed = require('./intents/SessionResumed');
const TestCase = require('./intents/TestCase');
const gameService = require('./GameService');
const bjUtils = require('./BlackjackUtils');
const tournament = require('./tournament');
const playgame = require('./PlayGame');
const upsell = require('./UpsellEngine');
const request = require('request');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

function initialize(event, attributes) {
  const locale = event.request.locale;
  const userId = event.session.user.userId;

  // Some initialization
  attributes.playerLocale = locale;
  attributes.numRounds = (attributes.numRounds + 1) || 1;
  if (!attributes.temp) {
    attributes.temp = {};
  }
  attributes.temp.firsthand = true;
  if (!attributes.prompts) {
    attributes.prompts = {};
  }

  // Special case - the "see next day" flag persists
  if (attributes.seeNextDay) {
    attributes.temp.seeNextDay = true;
    attributes.seeNextDay = undefined;
  }

  return new Promise((resolve, reject) => {
    attributes.userId = event.session.user.userId;
    bjUtils.readSuggestions(attributes, () => {
      // If they don't have a game, create one
      gameService.updateGames(attributes);
      if (!attributes.currentGame) {
        gameService.initializeGame('standard', attributes, userId);
        attributes.newUser = true;
        request.post({url: process.env.SERVICEURL + 'blackjack/newUser'}, (err, res, body) => {
        });

        // Now read the progressive jackpot amount
        bjUtils.getProgressivePayout(attributes, (jackpot) => {
          attributes[attributes.currentGame].progressiveJackpot = jackpot;
          resolve();
        });
      } else {
        // Standard should have progressive; some customers will have this game
        // without progressive, so set it for them
        const game = attributes[attributes.currentGame];
        if (attributes.currentGame === 'standard') {
          if (!game.progressive) {
            game.progressive = {bet: 5, starting: 2500, jackpotRate: 1.25};

            // Also stuff sidebet in as a possible action if bet is there
            if (game.possibleActions &&
              (game.possibleActions.indexOf('bet') >= 0) &&
              (game.possibleActions.indexOf('sidebet') < 0)) {
              game.possibleActions.push('sidebet');
            }
          }

          // You should also be able to reset the standard game
          game.canReset = true;
          game.canChangeRules = true;
        }
        game.bankroll = Math.floor(game.bankroll);

        // It's possible you are stuck in shuffle state if you ran out of cards
        // and money at the same time - if so, let's fix that here
        if (attributes && attributes.standard && attributes.standard.possibleActions
          && (attributes.standard.possibleActions.indexOf('shuffle') > -1)) {
          console.log('Player stuck in shuffle state!');
          playgame.playBlackjackAction(attributes, locale, userId, {action: 'shuffle'}, () => {
            getProgressive();
          });
        } else {
          getProgressive();
        }

        function getProgressive() {
          // Now read the progressive jackpot amount
          if (game.progressive) {
            bjUtils.getProgressivePayout(attributes, (jackpot) => {
              game.progressiveJackpot = jackpot;
              resolve();
            });
          } else {
            resolve();
          }
        }
      }
    });
  });
}

const requestInterceptor = {
  process(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const event = handlerInput.requestEnvelope;
    let attributes;

    if ((Object.keys(sessionAttributes).length === 0) ||
      ((Object.keys(sessionAttributes).length === 1)
        && sessionAttributes.platform)) {
      // No session attributes - so get the persistent ones
      return attributesManager.getPersistentAttributes()
        .then((attr) => {
          attributes = attr;
          return initialize(event, attributes);
        }).then(() => {
          const ms = handlerInput.serviceClientFactory.getMonetizationServiceClient();
          return ms.getInSkillProducts(event.request.locale)
          .then((inSkillProductInfo) => {
            attributes.temp.inSkillProductInfo = inSkillProductInfo;
          })
          .catch((error) => {
            // Ignore errors
            console.log('ISP Error: ' + JSON.stringify(error));
          });
        }).then(() => {
          if (attributes.temp.inSkillProductInfo) {
            attributes.paid = {};
            attributes.temp.inSkillProductInfo.inSkillProducts.forEach((product) => {
              let state;
              if (product.entitled === 'ENTITLED') {
                state = 'PURCHASED';
              } else if (product.purchasable == 'PURCHASABLE') {
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

              if (state) {
                attributes.paid[product.referenceName] = {
                  productId: product.productId,
                  state: state,
                };
              }
            });
            attributes.temp.inSkillProductInfo = undefined;
            upsell.initUpsell(attributes);
          }

          return tournament.getTournamentComplete(event.request.locale, attributes);
        }).then((result) => {
          attributes.prependLaunch = result;
          attributesManager.setSessionAttributes(attributes);
        });
    } else {
      return Promise.resolve();
    }
  },
};

const saveResponseInterceptor = {
  process(handlerInput) {
    return new Promise((resolve, reject) => {
      const response = handlerInput.responseBuilder.getResponse();

      if (response) {
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        bjUtils.drawTable(handlerInput, () => {
          if (response.shouldEndSession) {
            // We are meant to end the session
            SessionEnd.handle(handlerInput);
          } else {
            // Save the response and reprompt for repeat
            if (response.outputSpeech && response.outputSpeech.ssml) {
              let lastResponse = response.outputSpeech.ssml;
              lastResponse = lastResponse.replace('<speak>', '');
              lastResponse = lastResponse.replace('</speak>', '');
              attributes.temp.lastResponse = lastResponse;
            }
            if (response.reprompt && response.reprompt.outputSpeech
              && response.reprompt.outputSpeech.ssml) {
              let lastReprompt = response.reprompt.outputSpeech.ssml;
              lastReprompt = lastReprompt.replace('<speak>', '');
              lastReprompt = lastReprompt.replace('</speak>', '');
              attributes.temp.lastReprompt = lastReprompt;
            }
          }
          if (!process.env.NOLOG) {
            console.log(JSON.stringify(response));
          }
          bjUtils.findQuestionableResponse(handlerInput, () => {
            resolve();
          });
        });
      } else {
        resolve();
      }
    });
  },
};

const ErrorHandler = {
  canHandle(handlerInput, error) {
    return error.name.startsWith('AskSdk');
  },
  handle(handlerInput, error) {
    console.log(error.stack);
    return handlerInput.responseBuilder
      .speak('An error was encountered while handling your request. Try again later')
      .getResponse();
  },
};

if (process.env.DASHBOTKEY) {
  const dashbot = require('dashbot')(process.env.DASHBOTKEY).alexa;
  exports.handler = dashbot.handler(runGame);
} else {
  exports.handler = runGame;
}

function runGame(event, context, callback) {
  const skillBuilder = Alexa.SkillBuilders.custom();

  if (!process.env.NOLOG) {
    console.log(JSON.stringify(event));
  }

  // If this is a CanFulfill, handle this separately
  if (event.request && (event.request.type == 'CanFulfillIntentRequest')) {
    callback(null, CanFulfill.check(event));
    return;
  }

  const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
  const dbAdapter = new DynamoDbPersistenceAdapter({
    tableName: 'PlayBlackjack',
    partitionKeyName: 'userId',
    attributesName: 'mapAttr',
  });
  const skillFunction = skillBuilder.addRequestHandlers(
      ProductResponse,
      SessionResumed,
      BuyGood,
      OfferTournament,
      TournamentJoin,
      Launch,
      Reminder,
      ListPurchases,
      Purchase,
      Refund,
      ConfirmReset,
      ConfirmSelect,
      TakeSuggestion,
      Help,
      Exit,
      Reset,
      Suggest,
      Select,
      Rules,
      ChangeRules,
      Training,
      Betting,
      SideBet,
      Insurance,
      Blackjack,
      Repeat,
      HighScore,
      TestCase,
      SessionEnd,
      Unhandled
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(requestInterceptor)
    .addResponseInterceptors(saveResponseInterceptor)
    .withPersistenceAdapter(dbAdapter)
    .withApiClient(new Alexa.DefaultApiClient())
    .withSkillId('amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce')
    .lambda();

  if (process.env.VOICEHEROKEY) {
    const voicehero = require('voicehero-sdk')(process.env.VOICEHEROKEY).alexa;
    voicehero.handler(skillFunction)(event, context, (err, response) => {
      callback(err, response);
    });
  } else {
    skillFunction(event, context, (err, response) => {
      callback(err, response);
    });
  }
}
