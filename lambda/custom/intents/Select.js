//
// Handles the intent to pick a different game
//

'use strict';

const gameService = require('../GameService');
const upsell = require('../UpsellEngine');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    return ((game.possibleActions.indexOf('bet') >= 0)
      && !attributes.temp.joinTournament
      && (request.type === 'IntentRequest')
      && (request.intent.name === 'SelectIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    const availableGames = gameService.getAvailableGames(attributes);
    let speech;
    let reprompt;

    // If they don't have Spanish 21, upsell
    if (!attributes.temp.noUpsellSelect &&
        (availableGames.indexOf('spanish') === -1)) {
      const directive = upsell.getUpsell(attributes, 'select');
      if (directive) {
        directive.token = 'game.spanish.select';
        return handlerInput.responseBuilder
          .addDirective(directive)
          .withShouldEndSession(true)
          .getResponse();
      }
    }

    if (availableGames.length < 2) {
      // Sorry, no games available to select
      speech = res.strings.SELECT_ONE_GAME;
      reprompt = res.strings.ERROR_REPROMPT;
    } else {
      // Sort these with current game last
      availableGames.push(attributes.currentGame);
      const i = availableGames.indexOf(attributes.currentGame);
      availableGames.splice(i, 1);

      attributes.choices = availableGames;
      attributes.originalChoices = availableGames;
      attributes.temp.selectingGame = true;

      speech = res.strings.SELECT_GAMES
        .replace('{0}', speechUtils.and(availableGames.map((x) => res.sayGame(x)),
            {locale: event.request.locale}));
      reprompt = res.strings.SELECT_REPROMPT.replace('{0}', res.sayGame(availableGames[0]));
      speech += reprompt;
    }

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
