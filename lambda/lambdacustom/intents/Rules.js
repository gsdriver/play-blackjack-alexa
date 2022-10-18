//
// Handles the intent to read the rules of the game
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest')
      && (request.intent.name === 'RulesIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    const output = playgame.readRules(attributes, event.request.locale);
    return handlerInput.responseBuilder
      .speak(output.speech)
      .reprompt(output.reprompt)
      .withSimpleCard(res.strings.RULES_CARD_TITLE, output.speech)
      .getResponse();
  },
};
