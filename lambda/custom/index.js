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
const ConfirmReset = require('./intents/ConfirmReset');
const ConfirmPurchase = require('./intents/ConfirmPurchase');
const ConfirmRefund = require('./intents/ConfirmRefund');
const ConfirmSelect = require('./intents/ConfirmSelect');
const Select = require('./intents/Select');
const Training = require('./intents/Training');
const Unhandled = require('./intents/Unhandled');
const Purchase = require('./intents/Purchase');
const Refund = require('./intents/Refund');
const ProductResponse = require('./intents/ProductResponse');
const gameService = require('./GameService');
const bjUtils = require('./BlackjackUtils');
const tournament = require('./tournament');
const playgame = require('./PlayGame');
const request = require('request');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

function initialize(event, attributes, callback) {
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

  attributes.userId = event.session.user.userId;
  bjUtils.readSuggestions(attributes, () => {
    // Load purchased products
    bjUtils.getPurchasedProducts(event, attributes, () => {
      // If they don't have a game, create one
      if (!attributes.currentGame) {
        gameService.initializeGame('standard', attributes, userId);
        attributes.newUser = true;
        request.post({url: process.env.SERVICEURL + 'blackjack/newUser'}, (err, res, body) => {
        });

        // Now read the progressive jackpot amount
        bjUtils.getProgressivePayout(attributes, (jackpot) => {
          attributes[attributes.currentGame].progressiveJackpot = jackpot;
          callback();
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
              callback();
            });
          } else {
            callback();
          }
        }
      }
    });
  });
}

const requestInterceptor = {
  process(handlerInput) {
    return new Promise((resolve, reject) => {
      const attributesManager = handlerInput.attributesManager;
      const sessionAttributes = attributesManager.getSessionAttributes();
      const event = handlerInput.requestEnvelope;

      if ((Object.keys(sessionAttributes).length === 0) ||
        ((Object.keys(sessionAttributes).length === 1)
          && sessionAttributes.platform)) {
        // No session attributes - so get the persistent ones
        attributesManager.getPersistentAttributes()
          .then((attributes) => {
            initialize(event, attributes, () => {
              tournament.getTournamentComplete(event.request.locale, attributes, (result) => {
                attributes.prependLaunch = result;
                attributesManager.setSessionAttributes(attributes);
                resolve();
              });
            });
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        resolve();
      }
    });
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
              attributes.temp.lastResponse = response.outputSpeech.ssml;
            }
            if (response.reprompt && response.reprompt.outputSpeech
              && response.reprompt.outputSpeech.ssml) {
              attributes.temp.lastReprompt = response.reprompt.outputSpeech.ssml;
            }
          }
          resolve();
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
  const skillBuilder = Alexa.SkillBuilders.standard();

  if (!process.env.NOLOG) {
    console.log(JSON.stringify(event));
  }

  // If this is a CanFulfill, handle this separately
  if (event.request && (event.request.type == 'CanFulfillIntentRequest')) {
    callback(null, CanFulfill.check(event));
    return;
  }

  const skillFunction = skillBuilder.addRequestHandlers(
      OfferTournament,
      TournamentJoin,
      Launch,
      ProductResponse,
      ConfirmReset,
      ConfirmPurchase,
      ConfirmRefund,
      ConfirmSelect,
      TakeSuggestion,
      Help,
      Exit,
      Reset,
      Purchase,
      Refund,
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
      Unhandled
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(requestInterceptor)
    .addResponseInterceptors(saveResponseInterceptor)
    .withTableName('PlayBlackjack')
    .withAutoCreateTable(true)
    .withSkillId('amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce')
    .lambda();
  skillFunction(event, context, (err, response) => {
    callback(err, response);
  });
}
