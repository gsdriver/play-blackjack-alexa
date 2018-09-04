//
// Handles "unhandled" intents - often because the user is trying to
// do an action that isn't allowed at this point in the flow
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  canHandle: function(handlerInput) {
    return true;
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    if (!event.request.intent) {
      // Something we really don't handle
      console.log('Error - Unhandled didn\'t get an intent');
      return handlerInput.responseBuilder
        .speak(res.strings.INTERNAL_ERROR)
        .reprompt(res.strings.ERROR_REPROMPT)
        .getResponse();
    } else {
      let speech = res.buildUnhandledResponse(event.request.intent, bjUtils.getState(attributes));
      const reprompt = playgame.getContextualHelp(event, attributes);

      speech += reprompt;
      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt(reprompt)
        .getResponse();
    }
  },
};
