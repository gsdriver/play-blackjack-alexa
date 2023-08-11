//
// Handles listing the products you've purchased (Spanish 21 or nothing)
// If they don't have anything that they've bought - why not upsell them?
//

'use strict';

const upsell = require('../UpsellEngine');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return ((request.type === 'IntentRequest')
      && attributes.paid && (request.intent.name === 'ListPurchasesIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    const availableProducts = [];
    const purchasedProducts = [];

    const productMap = {
      'spanish': 'Spanish 21',
      'training': 'advanced training',
      'bankrollreset': 'reset bankroll',
    };

    let product;
    for (product in attributes.paid) {
      if (attributes.paid[product].state === 'PURCHASED') {
        purchasedProducts.push(productMap[product]);
      } else if (attributes.paid[product].state === 'AVAILABLE') {
        availableProducts.push(productMap[product]);
      }
    }

    if (purchasedProducts.length) {
      const speech = res.strings.LISTPURCHASE_LIST
        .replace('{Products}', speechUtils.and(purchasedProducts, {pause: '300ms', locale: event.request.locale}));

      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt(res.strings.LISTPURCHASE_REPROMPT)
        .getResponse();
    }

    if (availableProducts.length) {
      const directive = upsell.getUpsell(attributes, 'listpurchases');
      if (directive) {
        directive.token = 'game.' + directive.token + '.launch';
        return handlerInput.responseBuilder
          .addDirective(directive)
          .withShouldEndSession(true)
          .getResponse();
      }
    }

    return handlerInput.responseBuilder
      .speak(res.strings.LISTPURCHASE_NONE)
      .reprompt(res.strings.LISTPURCHASE_REPROMPT)
      .getResponse();
  },
};
