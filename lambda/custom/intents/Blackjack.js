'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    if ((game.possibleActions.indexOf('bet') === -1)
      && (request.type === 'IntentRequest')) {
      if (request.intent.name === 'BlackjackIntent') {
        return true;
      }
      if (request.intent.name === 'AMAZON.YesIntent') {
        return (game.possibleActions && (game.possibleActions.length == 1));
      }
    }

    return false;
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    const game = attributes[attributes.currentGame];
    const actionSlot = event.request.intent.slots.Action;
    let actionObj;
    let response;

    return new Promise((resolve, reject) => {
      if (game.possibleActions && (game.possibleActions.length == 1)) {
        // Play this action
        actionObj = {action: game.possibleActions[0]};
      } else if (!actionSlot) {
        response = handlerInput.responseBuilder
          .speak(res.strings.BLACKJACKINTENT_NO_ACTION)
          .reprompt(res.strings.ERROR_REPROMPT)
          .getResponse();
      } else if (!actionSlot.value) {
        response = handlerInput.responseBuilder
          .speak(res.strings.BLACKJACKINTENT_UNKNOWN_ACTION.replace('{0}', actionSlot.value))
          .reprompt(res.strings.ERROR_REPROMPT)
          .getResponse();
      } else {
        // Let's play this action
        actionObj = {action: res.getBlackjackAction(actionSlot)};
        if (!actionObj.action) {
          // What did they specify?
          console.log('NULL ACTION: ' + JSON.stringify(this.event.request));
          actionObj.action = actionSlot.value;
        }
      }

      if (response) {
        resolve(response);
      } else {
        playgame.playBlackjackAction(attributes, event.request.locale,
          event.session.user.userId, actionObj,
          (error, response, speech, reprompt) => {
          resolve(bjUtils.getResponse(handlerInput, error, response, speech, reprompt));
        });
      }
    });
  },
};
