//
// Handles purchasing of premium content
//

'use strict';

const bjUtils = require('../BlackjackUtils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return ((request.type === 'IntentRequest')
      && !attributes.temp.confirmPurchase
      && (request.intent.name === 'PurchaseIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    if (event.request.intent.slots && event.request.intent.slots.Product
      && event.request.intent.slots.Product.value) {
      // They specified a product - we'll assume it's Spanish 21
      // since that's all we support for now
      const purchase = bjUtils.getPurchaseDirective(event, attributes, {name: 'Buy', id: 'spanish'});
      if (purchase) {
        return handlerInput.responseBuilder
          .addDirective(purchase)
          .withShouldEndSession(true)
          .getResponse();
      } else {
        // Something went wrong
        return handlerInput.responseBuilder
          .speak(res.strings.INTERNAL_ERROR)
          .reprompt(res.strings.ERROR_REPROMPT)
          .getResponse();
      }
    } else {
      // Prompt them
      attributes.temp.confirmPurchase = true;
      return handlerInput.responseBuilder
        .speak(res.strings.PURCHASE_SPANISH)
        .reprompt(res.strings.PURCHASE_CONFIRM_REPROMPT)
        .getResponse();
    }
  },
};
