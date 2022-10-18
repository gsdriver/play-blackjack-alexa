//
// Handles the intent to process help
//

'use strict';

const playgame = require('../PlayGame');
const tournament = require('../tournament');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const state = bjUtils.getState(attributes);

    return (((state === 'NEWGAME') || (state === 'INGAME') || (state === 'INSURANCEOFFERED'))
      && (request.type === 'IntentRequest')
      && (request.intent.name === 'AMAZON.HelpIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    return new Promise((resolve, reject) => {
      // Help is different for tournament play
      if (attributes.currentGame === 'tournament') {
        tournament.readHelp(handlerInput, (response) => {
          resolve(response);
        });
      } else {
        const game = attributes[attributes.currentGame];
        let speech = playgame.getContextualHelp(event, attributes,
          !(attributes.bot || (attributes.platform === 'google')));
        if (!speech) {
          speech = res.strings.HELP_GENERIC_HELP;
        }
        speech = res.strings.HELP_ACHIEVEMENT_POINTS + speech;
        speech = res.strings.HELP_SELECT_GAME + speech;

        let cardContent = '';
        if (game.progressive) {
          cardContent += res.strings.HELP_CARD_PROGRESSIVE_TEXT;
        }
        if (game.superBonus) {
          cardContent += res.strings.HELP_CARD_SUPERBONUS;
        }
        cardContent += res.strings.HELP_ACHIEVEMENT_CARD_TEXT;
        cardContent += res.strings.HELP_CARD_TEXT;

        const response = handlerInput.responseBuilder
          .speak(speech)
          .reprompt(speech)
          .withSimpleCard(res.strings.HELP_CARD_TITLE, cardContent)
          .getResponse();
        resolve(response);
      }
    });
  },
};
