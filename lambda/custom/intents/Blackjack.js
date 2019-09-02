'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const { AlexaGamesGameOnClient } = require('@amzn-gameon/alexa-sdk');

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
          console.log('NULL ACTION: ' + JSON.stringify(event.request));
          actionObj.action = actionSlot.value;
        }
      }

      if (response) {
        resolve(response);
      } else {
        const tournamentEligible = attributes.tournamentEligible;
        playgame.playBlackjackAction(attributes, event.request.locale,
          event.session.user.userId, actionObj,
          (error, response, speech, reprompt) => {
          // If they weren't eligible for the tournament and are now, let's enter them
          let promise;
          if (tournamentEligible !== attributes.tournamentEligible) {
            const client = new AlexaGamesGameOnClient();
            promise = client.enterTournamentForPlayer({
              tournamentId: process.env.GAMEON_TOURNAMENT_ID,
              player: attributes.GameOn,
            });
          } else {
            promise = Promise.resolve();
          }

          return promise.then(() => {
            resolve(bjUtils.getResponse(handlerInput, error, response, speech, reprompt));
          });
        });
      }
    });
  },
};
