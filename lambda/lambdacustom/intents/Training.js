//
// Handles the intent to enable or disable training mode
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest')
      && ((request.intent.name === 'EnableTrainingIntent')
        || (request.intent.name === 'DisableTrainingIntent')));
  },
  handle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    const game = attributes[attributes.currentGame];
    const reprompt = playgame.getContextualHelp(event, attributes);
    let speech;

    if (request.intent.name === 'EnableTrainingIntent') {
      speech = res.strings.TRAINING_ON + reprompt;
      game.training = true;
    } else {
      speech = res.strings.TRAINING_OFF + reprompt;
      game.training = undefined;
    }

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
