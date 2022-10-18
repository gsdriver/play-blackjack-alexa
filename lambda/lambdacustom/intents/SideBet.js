//
// Handles the side bet
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    return ((game.possibleActions.indexOf('bet') >= 0)
      && (request.type === 'IntentRequest')
      && ((request.intent.name === 'PlaceSideBetIntent')
        || (request.intent.name === 'RemoveSideBetIntent')));
  },
  handle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const action = (request.intent.name === 'PlaceSideBetIntent') ? 'sidebet' : 'nosidebet';

    return new Promise((resolve, reject) => {
      playgame.playBlackjackAction(attributes, event.request.locale,
        event.session.user.userId, {action: action},
        (error, response, speech, reprompt) => {
        resolve(bjUtils.getResponse(handlerInput, error, response, speech, reprompt));
      });
    });
  },
};
