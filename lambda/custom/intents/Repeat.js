//
// Handles the intent to process repeating status
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest')
      && ((request.intent.name === 'AMAZON.RepeatIntent')
        || (request.intent.name === 'AMAZON.FallbackIntent')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    const output = playgame.readCurrentHand(attributes, event.request.locale);
    const game = attributes[attributes.currentGame];
    const speech = res.strings.YOUR_BANKROLL_TEXT.replace('{0}', game.bankroll) + output.speech;

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(output.reprompt)
      .getResponse();
  },
};
