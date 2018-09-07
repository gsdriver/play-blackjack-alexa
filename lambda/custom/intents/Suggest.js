//
// Handles the intent to provide a suggestion
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    return ((game.possibleActions.indexOf('bet') === -1)
      && (request.type === 'IntentRequest')
      && (request.intent.name === 'SuggestIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    attributes.suggestRequests = (attributes.suggestRequests + 1) || 1;
    return new Promise((resolve, reject) => {
      playgame.playBlackjackAction(attributes, event.request.locale,
        event.session.user.userId, {action: 'suggest'},
        (error, response, speech, reprompt) => {
        resolve(bjUtils.getResponse(handlerInput, error, response, speech, reprompt));
      });
    });
  },
};
