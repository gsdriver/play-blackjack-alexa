//
// Handles purchasing of a physical good from Amazon
//

'use strict';

const Betting = require('./Betting');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return (!!attributes.suggestGood && request.intent &&
      ((request.intent.name === 'AMAZON.YesIntent') || (request.intent.name === 'AMAZON.NoIntent')));
  },
  handle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    // Do they want to buy the good or not?
    if (request.intent.name === 'AMAZON.YesIntent') {
      const purchase = {
        type: 'Connections.StartConnection',
        uri: 'connection://AMAZON.BuyShoppingProducts/1',
        input: {
          products: [{
            asin: attributes.suggestGood.asin,
          }],
        },
        token: `buygood.${attributes.suggestGood.good}`,
      };
      if (process.env.ASSOCIATEID) {
        purchase.input.products[0].attribution = { associateId: process.env.ASSOCIATEID };
      }

      return handlerInput.responseBuilder
        .addDirective(purchase)
        .getResponse();
    } else {
      // We suggested it and they declined; don't suggest again
      // Since this suggestion only comes when you were in the process of betting (for now)
      // we will just continue and handle this as a bet
      attributes.suggestGood = undefined;
      attributes.temp.noUpsellBetting = true;
      return Betting.handle(handlerInput);
    }
  },
};
