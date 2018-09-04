//
// Handles purchasing of premium content
//

'use strict';

const bjUtils = require('../BlackjackUtils');
const Repeat = require('./Repeat');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if (attributes.temp.confirmReset) {
      const handledIntents = ['AMAZON.FallbackIntent', 'AMAZON.RepeatIntent',
        'AMAZON.HelpIntent', 'AMAZON.YesIntent', 'AMAZON.NoIntent'];

      if (request.type === 'IntentRequest') {
        return (handledIntents.indexOf(request.intent.name) > -1);
      } else {
        return (request.type === 'LaunchRequest');
      }
      attributes.temp.confirmReset = undefined;
    }

    return false;
  },
  handle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    if ((request.intent.name === 'PurchaseIntent')
      || (request.intent.name === 'AMAZON.YesIntent')) {
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
      // Get out of purchase flow and repeat
      attributes.temp.confirmPurchase = undefined;
      return Repeat.handle(handlerInput);
    }
  },
};
