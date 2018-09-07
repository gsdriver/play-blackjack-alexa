//
// Handles launching the skill
//

'use strict';

const ads = require('../ads');
const tournament = require('../tournament');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    if (request.type === 'IntentRequest') {
      if ((request.intent.name === 'AMAZON.StopIntent') ||
        (request.intent.name === 'AMAZON.CancelIntent')) {
        return true;
      }

      if ((game.possibleActions.indexOf('bet') >= 0)
        && (request.intent.name === 'AMAZON.NoIntent')) {
        return true;
      }
    }

    return false;
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    const game = attributes[attributes.currentGame];
    let exitSpeech = '';

    // Tell them how much money they are leaving with
    exitSpeech = res.strings.EXIT_BANKROLL.replace('{0}', game.bankroll) + ' ';
    if (attributes.bot || (attributes.platform === 'google')) {
      return handlerInput.responseBuilder
        .speak(exitSpeech)
        .withShouldEndSession(true)
        .getResponse();
    } else {
      return new Promise((resolve, reject) => {
        ads.getAd(attributes, 'blackjack', event.request.locale, (adText) => {
          exitSpeech += tournament.getReminderText(event.request.locale);
          exitSpeech += (adText + ' ' + res.strings.EXIT_GOODBYE);
          const response = handlerInput.responseBuilder
            .speak(exitSpeech)
            .withShouldEndSession(true)
            .getResponse();
          resolve(response);
        });
      });
    }
  },
};
