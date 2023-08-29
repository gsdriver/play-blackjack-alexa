//
// Handles response from Product purchase, upsell, or refund
//

'use strict';

const gameService = require('../GameService');
const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const Launch = require('./Launch');
const Select = require('./Select');
const Betting = require('./Betting');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const SNS = new AWS.SNS();
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (request.type === 'Connections.Response');
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let promise;

    // First write out to S3
    const summary = {
      token: event.request.token,
      action: event.request.name,
      userId: event.session.user.userId,
      response: event.request.payload.purchaseResult,
    };
    if (attributes.upsellSelection) {
      summary.selection = attributes.upsellSelection;
    }
    const params = {
      Body: JSON.stringify(summary),
      Bucket: 'garrett-alexa-usage',
      Key: 'blackjack-upsell/' + Date.now() + '.txt',
    };

    if (process.env.SNSTOPIC) {
      promise = s3.putObject(params).promise().then(() => {
        // Publish to SNS if the action was accepted so we know something happened
        if (event.request.payload.purchaseResult === 'ACCEPTED') {
          let message;

          // This message is sent internally so no worries about localizing
          message = 'For token ' + event.request.token + ', ';
          if (event.request.payload.message) {
            message += event.request.payload.message;
          } else {
            message += event.request.name + ' was accepted';
          }
          message += ' by user ' + event.session.user.userId;
          if (attributes.upsellSelection) {
            message += '\nUpsell variant ' + attributes.upsellSelection + ' was presented. ';
          }

          return SNS.publish({
            Message: message,
            TopicArn: process.env.SNSTOPIC,
            Subject: 'Blackjack Game New Purchase',
          }).promise();
        } else {
          return;
        }
      });
    } else {
      promise = Promise.resolve();
    }

    return promise.then(() => {
      const options = event.request.token.split('.');
      const game = options[1];
      const nextAction = options[2];

      attributes.upsellSelection = undefined;
      switch (event.request.name) {
        case 'Buy':
        case 'Upsell':
          if (options[0] === 'game' && event.request.payload &&
            ((event.request.payload.purchaseResult == 'ACCEPTED') ||
             (event.request.payload.purchaseResult == 'ALREADY_PURCHASED'))) {
            // OK, flip them to this game
            return selectedGame(handlerInput, game);
          }
          break;
        case 'Cancel':
          if (options[0] === 'game' && event.request.payload &&
              (event.request.payload.purchaseResult == 'ACCEPTED')) {
            attributes[game] = undefined;
            return selectedGame(handlerInput, 'standard');
          }
          break;
        default:
          // Unknown
          console.log('Unknown product response');
          break;
      }

      // And forward to the appropriate next action
      if (nextAction === 'select') {
        attributes.temp.noUpsellSelect = true;
        return Select.handle(handlerInput);
      } else if (nextAction === 'betting') {
        attributes.temp.noUpsellBetting = true;
        return Betting.handle(handlerInput);
      } else {
        attributes.temp.noUpsellLaunch = true;
        return Launch.handle(handlerInput);
      }
    });
  },
};

function selectedGame(handlerInput, gameToPlay) {
  const event = handlerInput.requestEnvelope;
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  const res = require('../resources')(event.request.locale);

  attributes.currentGame = gameToPlay;
  if (!attributes[attributes.currentGame]) {
    gameService.initializeGame(attributes.currentGame, attributes,
        event.session.user.userId);
  }

  return new Promise((resolve, reject) => {
    const format = JSON.parse(res.strings.LAUNCH_WELCOME)[attributes.currentGame];
    bjUtils.getWelcome(handlerInput, format, (greeting) => {
      const launchSpeech = greeting + res.strings.LAUNCH_START_GAME;
      const output = playgame.readCurrentHand(attributes, event.request.locale);
      resolve(handlerInput.responseBuilder
        .speak(launchSpeech)
        .reprompt(output.reprompt)
        .getResponse());
    });
  });
}
