//
// Handles the intent to take or ignore a suggestion in training mode
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    if (game.suggestion) {
      if ((request.type === 'IntentRequest')
        && ((request.intent.name === 'AMAZON.YesIntent') ||
          (request.intent.name === 'AMAZON.NoIntent'))) {
        return true;
      } else {
        return (request.type === 'LaunchRequest');
      }
    }

    return false;
  },
  handle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    let action;

    if (!attributes.tookSuggestion) {
      attributes.tookSuggestion = {};
    }

    if (request.intent.name === 'AMAZON.YesIntent') {
      // OK, play what was suggested
      action = game.suggestion.suggestion;
      attributes.tookSuggestion.yes = (attributes.tookSuggestion.yes + 1) || 1;
    } else {
      action = game.suggestion.player;
      attributes.tookSuggestion.no = (attributes.tookSuggestion.no + 1) || 1;
    }

    return new Promise((resolve, reject) => {
      playgame.playBlackjackAction(attributes, event.request.locale,
        event.session.user.userId, {action: action},
        (error, response, speech, reprompt) => {
        resolve(bjUtils.getResponse(handlerInput, error, response, speech, reprompt));
      });
    });
  },
};
