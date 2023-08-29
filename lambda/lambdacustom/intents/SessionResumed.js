//
// Handles response from Product purchase, upsell, or refund
//

'use strict';

const Betting = require('./Betting');
const Launch = require('./Launch');

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
    let nextAction = 'bet';

    console.log(`[Shopping response] ${JSON.stringify(request)}`);
    if (request.cause) {
      const token = request.cause.token;

      if (token) {
        const options = token.split('.');
        if (options.length > 2) {
          nextAction = options[2];
        }

        if (token.startsWith('buygood.')) {
          const good = options[1];
          message = res.strings.BUY_GOOD_FAILURE;
          if ((request.cause.status.code === '200') && !request.cause.result) {
            // How do we tell the difference between someone who bought the book
            // and someone that declines the purchase?
            attributes.purchasedGoods[good] = Date.now();
            message = res.strings.BUY_GOOD_SUCCESS;
          }
        }
      }
    }

    // We're just going to resume
    attributes.suggestGood = undefined;
    attributes.temp.noUpsellBetting = true;
    attributes.temp.goodResponse = message;

    if (nextAction === 'launch') {
      return Launch.handle(handlerInput);
    } else {
      return Betting.handle(handlerInput);
    }
  },
};
