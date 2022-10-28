//
// Handles refund of premium content
//

'use strict';

const bjUtils = require('../BlackjackUtils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return (request.type === 'IntentRequest') && (request.intent.name === 'RefundIntent');
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    if (event.request.dialogState !== 'COMPLETED') {
      return handlerInput.responseBuilder
        .addDelegateDirective(event.request.intent)
        .getResponse();
    }

    // OK, let's see what needs to be refunded
    // Or let them know if there is nothing eligible for a refund at this time
    if (attributes.paid) {
      // Let's see if anything is purchased to refund
      let canRefund;
      let product;

      for (product in attributes.paid) {
        if (product && attributes.paid[product] && (attributes.paid[product].state === 'PURCHASED')) {
          canRefund = true;
        }
      }

      if (canRefund) {
        product = bjUtils.mapProduct(handlerInput);
        if (product) {
          return handlerInput.responseBuilder
            .addDirective({
              'type': 'Connections.SendRequest',
              'name': 'Cancel',
              'payload': {
                'InSkillProduct': {
                  'productId': attributes.paid[product].productId,
                },
              },
              'token': 'game.' + product + '.launch',
            })
            .withShouldEndSession(true)
            .getResponse();
        } 
      }
    }

    // If they bought a good, then we should direct them to Amazon to cancel the purchase
    if (attributes.purchasedGoods && Object.keys(attributes.purchasedGoods).length) {
      return handlerInput.responseBuilder
        .speak(res.strings.BUY_GOOD_CANCEL)
        .withShouldEndSession(true)
        .getResponse();
    }

    // Guess there's nothing to refund
    return handlerInput.responseBuilder
        .speak(res.strings.PURCHASE_NO_PURCHASE)
        .reprompt(res.strings.PURCHASE_REPROMPT)
        .getResponse();
  },
};
