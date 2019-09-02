//
// Handles refund of premium content
//

'use strict';

const bjUtils = require('../BlackjackUtils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let canRefund = false;

    if ((request.type === 'IntentRequest') && (request.intent.name === 'RefundIntent') && attributes.paid) {
      // Let's see if anything is purchased to refund
      let product;

      for (product in attributes.paid) {
        if (product && attributes.paid[product] && (attributes.paid[product].state === 'PURCHASED')) {
          canRefund = true;
        }
      }
    }

    return canRefund;
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

    const product = bjUtils.mapProduct(handlerInput);
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
    } else {
      return handlerInput.responseBuilder
        .speak(res.strings.PURCHASE_NO_PURCHASE)
        .reprompt(res.strings.PURCHASE_REPROMPT)
        .getResponse();
    }
  },
};
