//
// Handles response from Product purchase, upsell, or refund
//

'use strict';

const gameService = require('../GameService');
const playgame = require('../PlayGame');
const request = require('request');
const Launch = require('./Launch');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (request.type === 'Connections.Response');
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    // Record that we got a purchase response
    if (event.request.payload) {
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
            return selectedGame(event, attributes, 'spanish');
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
          return selectedGame(event, attributes, 'spanish');
        }
        if (event.request.token == 'SELECTGAME') {
          // Kick them back into SelectGame mode
          console.log('Selecting game');
          attributes.temp.selectingGame = true;
          return Launch.handle(handlerInput);
        }
        break;
      case 'Cancel':
        // Don't delete their progress until the API tells us the refund was processed
        // Switch them instead to the standard game
        console.log('Cancel response');
        if (event.request.payload &&
            (event.request.payload.purchaseResult == 'ACCEPTED')) {
          attributes.paid.spanish.state = 'REFUND_PENDING';
          return selectedGame(event, attributes, 'standard');
        }
        break;
      default:
        // Unknown
        console.log('Unknown product response');
        break;
    }

    // And forward to Launch
    return Launch.handle(handlerInput);
  },
};

function selectedGame(event, attributes, gameToPlay) {
  const res = require('../resources')(event.request.locale);

  attributes.currentGame = gameToPlay;
  if (!attributes[attributes.currentGame]) {
    gameService.initializeGame(attributes.currentGame, attributes,
        event.session.user.userId);
  }

  const launchWelcome = JSON.parse(res.strings.LAUNCH_WELCOME);
  let launchSpeech = launchWelcome[attributes.currentGame];
  launchSpeech += res.strings.LAUNCH_START_GAME;
  const output = playgame.readCurrentHand(attributes, event.request.locale);
  return handlerInput.responseBuilder
    .speak(launchSpeech)
    .reprompt(output.reprompt)
    .getResponse();
}
