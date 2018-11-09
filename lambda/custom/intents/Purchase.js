//
// Handles purchasing of premium content
//

'use strict';

const bjUtils = require('../BlackjackUtils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if ((request.type === 'IntentRequest')
      && ((attributes.paid && (request.intent.name === 'PurchaseIntent'))
      || (attributes.temp.purchasing &&
        ((request.intent.name === 'AMAZON.NoIntent') ||
          (request.intent.name === 'AMAZON.YesIntent'))))) {
      return true;
    }

    attributes.temp.purchasing = undefined;
    return false;

    return ((request.type === 'IntentRequest')
      && !attributes.temp.confirmPurchase
      && (request.intent.name === 'PurchaseIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    if (attributes.temp.purchasing && (event.request.intent.name === 'AMAZON.NoIntent')) {
      return handlerInput.responseBuilder
        .speak(res.strings.PURCHASE_NO_PURCHASE)
        .reprompt(res.strings.PURCHASE_NO_PURCHASE)
        .getResponse();
    } else {
      if ((event.request.intent.name === 'AMAZON.YesIntent') ||
        (event.request.intent.slots && event.request.intent.slots.Product
        && event.request.intent.slots.Product.value)) {
        // They specified a product - we'll assume it's Spanish 21
        // since that's all we support for now
        const purchase = {
          'type': 'Connections.SendRequest',
          'name': 'Buy',
          'payload': {
            'InSkillProduct': {
              'productId': attributes.paid.spanish.productId,
            },
          },
          'token': 'game.spanish.launch',
        };

        return handlerInput.responseBuilder
          .addDirective(purchase)
          .withShouldEndSession(true)
          .getResponse();
      } else {
        // Prompt them
        attributes.temp.purchasing = true;
        return handlerInput.responseBuilder
          .speak(res.strings.PURCHASE_SPANISH)
          .reprompt(res.strings.PURCHASE_CONFIRM_REPROMPT)
          .getResponse();
      }
    }
  },
};
