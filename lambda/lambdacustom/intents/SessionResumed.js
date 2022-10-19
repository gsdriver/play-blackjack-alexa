//
// Handles response from Product purchase, upsell, or refund
//

'use strict';

const Betting = require('./Betting');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (request.type === 'SessionResumedRequest');
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;
    const event = handlerInput.requestEnvelope;
    const res = require('../resources')(event.request.locale);
    let message;

    console.log(`[Shopping response] ${JSON.stringify(request)}`);
    if (request.cause) {
      const token = request.cause.token;

      if (token && token.startsWith('buygood.')) {
        const good = token.split('.')[1];
        message = res.strings.BUY_GOOD_FAILURE;
        if ((request.cause.status.code === '200') && !request.cause.result) {
          // How do we tell the difference between someone who bought the book
          // and someone that declines the purchase?
          attributes.purchasedGoods[good] = Date.now();
          message = res.strings.BUY_GOOD_SUCCESS;
        }
      }
    }

    // We're just going to resume
    // For now, this is only surfaced at the Bet prompt, so we can just drop them there
    // In the future, perhaps we should look at the token to see what's going on
    attributes.suggestGood = undefined;
    attributes.temp.noUpsellBetting = true;
    attributes.temp.goodResponse = message;
    return Betting.handle(handlerInput);
  },
};
