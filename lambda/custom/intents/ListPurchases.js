//
// Handles listing the products you've purchased (Spanish 21 or nothing)
// If they don't have anything that they've bought - why not upsell them?
//

'use strict';

const upsell = require('../UpsellEngine');

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
    let speech;

    if (attributes.paid.spanish && (attributes.paid.spanish.state === 'PURCHASED')) {
      speech = res.strings.LISTPURCHASE_SPANISH;
    } else {
      const directive = upsell.getUpsell(attributes, 'listpurchases');
      if (directive) {
        directive.token = 'game.spanish.launch';
        return handlerInput.responseBuilder
          .addDirective(directive)
          .withShouldEndSession(true)
          .getResponse();
      } else {
        speech = res.strings.LISTPURCHASE_NONE;
      }
    }

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(res.strings.LISTPURCHASE_REPROMPT)
      .getResponse();
  },
};
