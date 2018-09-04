//
// Handles a reset, which can only be done if you are at a state to start a new hand
//

'use strict';

const gameService = require('../GameService');
const playgame = require('../PlayGame');

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
    let speech;
    let reprompt;

    if ((request.type === 'LaunchRequest') ||
      (request.intent.name === 'AMAZON.NoIntent')) {
      // Not resetting
      attributes.temp.confirmReset = undefined;
      speech = res.strings.RESET_ABORTED;
      reprompt = res.strings.RESET_REPROMPT;
    } else if (request.type === 'AMAZON.YesIntent') {
      // Confirmed - let's reset but preserve the timestamp
      const timestamp = attributes[attributes.currentGame].timestamp;
      gameService.initializeGame(attributes, event.session.user.userId);
      attributes[attributes.currentGame].timestamp = timestamp;
      attributes.temp.confirmReset = undefined;
      speech = res.strings.RESET_COMPLETED;
      reprompt = res.strings.RESET_REPROMPT;
    } else {
      // Repeat the request
      reprompt = playgame.getContextualHelp(event, attributes);
      speech = res.strings.RESET_CONFIRM + ' ' + reprompt;
    }

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
