//
// Handles whether to join (or pass) on a tounrmanet
//

'use strict';

const tournament = require('../tournament');
const gameService = require('../GameService');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    // Can only do while waiting to join a tournament
    return (attributes.temp.joinTournament &&
      !attributes.temp.confirmPurchase &&
      !attributes.temp.confirmRefund &&
      (request.type === 'IntentRequest') &&
      ((request.intent.name === 'AMAZON.YesIntent')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    const game = attributes['tournament'];
    let speech;
    const reprompt = res.strings.TOURNAMENT_WELCOME_REPROMPT;

    return new Promise((resolve, reject) => {
      attributes.temp.joinTournament = undefined;
      attributes.currentGame = 'tournament';
      if (!game) {
        // New player
        attributes.tournamentsPlayed = (attributes.tournamentsPlayed + 1) || 1;
        gameService.initializeGame('tournament', attributes, event.session.user.userId);
        speech = res.strings.TOURNAMENT_WELCOME_NEWPLAYER
              .replace('{0}', attributes['tournament'].bankroll)
              .replace('{1}', attributes['tournament'].maxHands);
        speech += reprompt;
        const response = handlerInput.responseBuilder
          .speak(speech)
          .reprompt(reprompt)
          .getResponse();
        resolve(response);
      } else {
        speech = res.strings.TOURNAMENT_WELCOME_BACK
          .replace('{0}', (game.hands) ? (game.maxHands - game.hands) : game.maxHands);
        tournament.readStanding(event.request.locale, attributes, (standing) => {
          if (standing) {
            speech += standing;
          }

          speech += reprompt;
          const response = handlerInput.responseBuilder
            .speak(speech)
            .reprompt(reprompt)
            .getResponse();
          resolve(response);
        });
      }
    });
  },
};
