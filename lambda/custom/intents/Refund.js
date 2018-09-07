//
// Handles refund of premium content
//

'use strict';

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return ((request.type === 'IntentRequest')
      && !attributes.temp.confirmRefund
      && (request.intent.name === 'RefundIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    // We only offer Spanish 21 so let's kick into that flow
    attributes.temp.confirmRefund = true;
    return handlerInput.responseBuilder
      .speak(res.strings.REFUND_SPANISH)
      .reprompt(res.strings.REFUND_SPANISH_REPROMPT)
      .getResponse();
  },
};
