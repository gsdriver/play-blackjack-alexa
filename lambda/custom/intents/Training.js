//
// Handles the intent to enable or disable training mode
//

'use strict';

const playgame = require('../PlayGame');
const ri = require('@jargon/alexa-skill-sdk').ri;

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest')
      && ((request.intent.name === 'EnableTrainingIntent')
        || (request.intent.name === 'DisableTrainingIntent')));
  },
  handle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    let format;
    const speechParams = {};

    return playgame.getContextualHelp(handlerInput)
    .then((reprompt) => {
      if (request.intent.name === 'EnableTrainingIntent') {
        format = 'TRAINING_ON';
        game.training = true;
      } else {
        format = 'TRAINING_OFF';
        game.training = undefined;
      }
      speechParams.Reprompt = reprompt;

      return handlerInput.jrm.render(ri(format, speechParams))
      .then((speech) => {
        return handlerInput.responseBuilder
          .speak(speech)
          .reprompt(reprompt)
          .getResponse();
      });
    });
  },
};
