//
// Handles purchasing of premium content
//

'use strict';

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return (request.type === 'IntentRequest')
      && attributes.paid && ((request.intent.name === 'EnterTestIntent') || (request.intent.name === 'ExitTestIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    const enterTest = (event.request.intent.name === 'EnterTestIntent');
    const testCase = (event.request.intent && event.request.intent.slots
      && event.request.intent.slots.TestCase) ? parseInt(event.request.intent.slots.TestCase.value) : undefined;
    let speechTemplate = 'UNKNOWN_TEST_CASE';

    // Test Cases
    // 6: Dealer always gets a blackjack
    if (testCase === 6) {
      attributes.temp.alwaysDealerBlackjack = enterTest;
      speechTemplate = enterTest ? 'ENABLE_DEALER_BLACKJACK' : 'DISABLE_DEALER_BLACKJACK';
    }

    return handlerInput.responseBuilder
      .speak(res.strings[speechTemplate])
      .reprompt(res.strings.TEST_CASE_REPROMPT)
      .getResponse();
  },
};
