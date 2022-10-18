//
// Reminder intent
//

'use strict';

const bjUtils = require('../BlackjackUtils');
const ads = require('../ads');
const tournament = require('../tournament');

module.exports = {
  canHandle: function(handlerInput) {
    // We can handle if this is a yes or no and they were
    // being prompted to add a reminder
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if ((request.type === 'IntentRequest') && (request.intent.name === 'ReminderIntent')) {
      return true;
    }
    if ((request.type === 'IntentRequest') && attributes.temp.addingReminder
      && ((request.intent.name === 'AMAZON.YesIntent')
        || (request.intent.name === 'AMAZON.NoIntent'))) {
      return true;
    }

    // Never mind, cancel the request for a reminder
    attributes.temp.addingReminder = undefined;
    return false;
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const endSession = (attributes.temp.addingReminder === 'onexit');
    const res = require('../resources')(event.request.locale);
    let response;

    return new Promise((resolve, reject) => {
      attributes.temp.addingReminder = undefined;
      if (event.request.intent.name === 'ReminderIntent') {
        bjUtils.isReminderActive(handlerInput, (isActive) => {
          if (!isActive) {
            attributes.temp.addingReminder = 'explicit';
            bjUtils.getLocalTournamentTime(handlerInput, (time, timezone) => {
              response = handlerInput.responseBuilder
                .speak(res.strings.REMINDER_SET_REMINDER.replace('{Time}', time).replace('{Timezone}', timezone))
                .reprompt(res.strings.REMINDER_SET_REPROMPT)
                .getResponse();
              resolve(response);
            });
          } else {
            response = handlerInput.responseBuilder
              .speak(res.strings.REMINDER_ALREADY_SET)
              .reprompt(res.strings.REMINDER_ALREADY_SET_REPROMPT)
              .getResponse();
            resolve(response);
          }
        });
      } else if (event.request.intent.name === 'AMAZON.YesIntent') {
        // Let's see if we can add a reminder
        bjUtils.setTournamentReminder(handlerInput, (result) => {
          if (result && (typeof result !== 'string')) {
            attributes.setReminder = true;
            let speech;
            if (endSession) {
              speech = res.strings.REMINDER_SET
                .replace('{Time}', result.time)
                .replace('{Timezone}', result.timezone);
              response = handlerInput.responseBuilder
                .speak(speech)
                .withShouldEndSession(true)
                .getResponse();
            } else {
              speech = res.strings.REMINDER_SET_EXPLICIT
                .replace('{Time}', result.time)
                .replace('{Timezone}', result.timezone);
              response = handlerInput.responseBuilder
                .speak(speech)
                .reprompt(res.strings.REMINDER_REPROMPT)
                .getResponse();
            }
          } else if (result === 'UNAUTHORIZED') {
            // Get their permission to show a reminder
            response = handlerInput.responseBuilder
              .speak(res.strings.REMINDER_GRANT_PERMISSION)
              .withAskForPermissionsConsentCard(['alexa::alerts:reminders:skill:readwrite'])
              .withShouldEndSession(true)
              .getResponse();
          } else {
            // Some other problem not auth-related
            if (endSession) {
              response = handlerInput.responseBuilder
                .speak(res.strings.REMINDER_ERROR)
                .withShouldEndSession(true)
                .getResponse();
            } else {
              response = handlerInput.responseBuilder
                .speak(res.strings.REMINDER_ERROR_EXPLICIT)
                .reprompt(res.strings.REMINDER_REPROMPT)
                .getResponse();
            }
          }
          resolve(response);
        });
      } else {
        // They were exiting anyway - let's leave
        const game = attributes[attributes.currentGame];
        let exitSpeech = res.strings.EXIT_BANKROLL.replace('{0}', game.bankroll) + ' ';
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
  },
};
