//
// Handles response from Product purchase, upsell, or refund
//

'use strict';

const gameService = require('../GameService');
const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const request = require('request');
const Launch = require('./Launch');
const Select = require('./Select');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (request.type === 'Connections.Response');
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return new Promise((resolve, reject) => {
      // Record that we got a purchase response
      if (event.request.payload && process.env.SERVICEURL) {
        const params = {
          url: process.env.SERVICEURL + 'blackjack/purchaseResult',
          formData: {
            subject: 'Product response',
            body: event.request.name + ' was ' + event.request.payload.purchaseResult
                + ' by user ' + event.session.user.userId,
          },
        };
        request.post(params);
      }

      switch (event.request.name) {
        case 'Buy':
          console.log('Buy response');
          if (event.request.payload) {
            if (event.request.payload.purchaseResult == 'ACCEPTED') {
              // OK, flip them to Spanish 21
              selectedGame(handlerInput, 'spanish', (response) => {
                resolve(response);
              });
            } else if (event.request.payload.purchaseResult == 'ERROR') {
              if (attributes.prompts) {
                attributes.prompts.sellSpanish = undefined;
              }
            }
          }
          break;
        case 'Upsell':
          // If they didn't take the upsell offer, don't offer it again this session
          console.log('Upsell response');
          attributes.temp.noUpsell = true;
          if (event.request.payload &&
            ((event.request.payload.purchaseResult == 'ACCEPTED') ||
             (event.request.payload.purchaseResult == 'ALREADY_PURCHASED'))) {
            // They either purchased or already had this game, so drop them into it
            selectedGame(handlerInput, 'spanish', (response) => {
              resolve(response);
            });
          }
          if (event.request.token == 'SELECTGAME') {
            // Kick them back into SelectGame mode
            console.log('Selecting game');
            return Select.handle(handlerInput);
          }
          break;
        case 'Cancel':
          // Don't delete their progress until the API tells us the refund was processed
          // Switch them instead to the standard game
          console.log('Cancel response');
          if (event.request.payload &&
              (event.request.payload.purchaseResult == 'ACCEPTED')) {
            attributes.paid.spanish.state = 'REFUND_PENDING';
            selectedGame(handlerInput, 'standard', (response) => {
              resolve(response);
            });
          }
          break;
        default:
          // Unknown
          console.log('Unknown product response');
          break;
      }

      // And forward to Launch
      Launch.handle(handlerInput)
      .then((response) => {
        resolve(response);
      });
    });
  },
};

function selectedGame(handlerInput, gameToPlay, callback) {
  const event = handlerInput.requestEnvelope;
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  const res = require('../resources')(event.request.locale);

  attributes.currentGame = gameToPlay;
  if (!attributes[attributes.currentGame]) {
    gameService.initializeGame(attributes.currentGame, attributes,
        event.session.user.userId);
  }

  const format = JSON.parse(res.strings.LAUNCH_WELCOME)[attributes.currentGame];
  bjUtils.getWelcome(event, attributes, format, (greeting) => {
    const launchSpeech = greeting + res.strings.LAUNCH_START_GAME;
    const output = playgame.readCurrentHand(attributes, event.request.locale);
    callback(handlerInput.responseBuilder
      .speak(launchSpeech)
      .reprompt(output.reprompt)
      .getResponse());
  });
}
