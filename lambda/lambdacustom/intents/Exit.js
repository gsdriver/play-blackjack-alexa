//
// Handles launching the skill
//

'use strict';

const ads = require('../ads');
const tournament = require('../tournament');
const bjUtils = require('../BlackjackUtils');

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

    // Special case - if they made a purchase and launched the skill a-new
    // then we should direct them to Amazon to cancel the purchase
    if (handlerInput.requestEnvelope.session.new &&
      attributes.purchasedGoods && Object.keys(attributes.purchasedGoods).length) {
      return handlerInput.responseBuilder
        .speak(res.strings.BUY_GOOD_CANCEL)
        .withShouldEndSession(true)
        .getResponse();
    }

    // Tell them how much money they are leaving with
    exitSpeech = res.strings.EXIT_BANKROLL.replace('{0}', game.bankroll) + ' ';
    if (attributes.bot || (attributes.platform === 'google')) {
      return handlerInput.responseBuilder
        .speak(exitSpeech)
        .withShouldEndSession(true)
        .getResponse();
    } else {
      return new Promise((resolve, reject) => {
        const now = Date.now();
        let response;

        if (!attributes.tournament && (!attributes.prompts.reminder
          || (now - attributes.prompts.reminder > 4*24*60*60*1000))) {
          bjUtils.isReminderActive(handlerInput, (isActive) => {
            // Have we recently asked about setting a reminder?
            if (!isActive) {
              // We are going to go into reminder mode!
              attributes.prompts.reminder = now;
              attributes.temp.addingReminder = 'onexit';
              bjUtils.getLocalTournamentTime(handlerInput, (time, timezone) => {
                response = handlerInput.responseBuilder
                  .speak(res.strings.EXIT_REMINDER.replace('{Time}', time).replace('{Timezone}', timezone))
                  .reprompt(res.strings.EXIT_REMINDER_REPROMPT)
                  .getResponse();
                resolve(response);
              });
            } else {
              done();
            }
          });
        } else {
          done();
        }

        function done() {
          ads.getAd(attributes, 'blackjack', event.request.locale, (adText) => {
            exitSpeech += tournament.getReminderText(event.request.locale);
            exitSpeech += (adText + ' ' + res.strings.EXIT_GOODBYE);
            response = handlerInput.responseBuilder
              .speak(exitSpeech)
              .withShouldEndSession(true)
              .getResponse();
            resolve(response);
          });
        }
      });
    }
  },
};
