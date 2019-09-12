//
// Handles purchasing of premium content
//

'use strict';

const bjUtils = require('../BlackjackUtils');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return (request.type === 'IntentRequest')
      && attributes.paid && (request.intent.name === 'PurchaseIntent');
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
    console.log(product);
    console.log(attributes.paid);
      if (!attributes.paid || !attributes.paid[product]) {
        // That really shouldn't happen
        return handlerInput.responseBuilder
          .speak(res.strings.ERROR_SPEECH)
          .reprompt(res.strings.ERROR_REPROMPT)
          .getResponse();
      }

      const purchase = {
        'type': 'Connections.SendRequest',
        'name': 'Buy',
        'payload': {
          'InSkillProduct': {
            'productId': attributes.paid[product].productId,
          },
        },
        'token': 'game.' + product + '.launch',
      };

      return handlerInput.responseBuilder
        .addDirective(purchase)
        .withShouldEndSession(true)
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(res.strings.REFUND_REPROMPT)
        .reprompt(res.strings.REFUND_REPROMPT)
        .getResponse();
    }
  },
};
