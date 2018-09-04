//
// Handles a reset, which can only be done if you are at a state to start a new hand
//

'use strict';

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    return ((game.possibleActions.indexOf('bet') >= 0)
      && (request.type === 'IntentRequest')
      && (request.intent.name === 'ResetIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    let speech;
    let reprompt;
    const game = attributes[attributes.currentGame];

    if (game.canReset) {
      speech = res.strings.RESET_CONFIRM;
      reprompt = res.strings.RESET_CONFIRM;
      attributes.temp.confirmReset = true;
    } else {
      speech = res.strings.TOURNAMENT_NORESET;
      reprompt = res.strings.TOURNAMENT_INVALIDACTION_REPROMPT;
    }

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
