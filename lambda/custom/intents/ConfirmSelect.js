//
// Handles the intent to pick a different game
//

'use strict';

const gameService = require('../GameService');
const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const speechUtils = require('alexa-speech-utils')();
const Repeat = require('./Repeat');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if (attributes.temp.selectingGame) {
      const handledIntents = ['ElementSelected', 'GameIntent', 'SelectIntent',
        'AMAZON.NextIntent', 'AMAZON.YesIntent', 'AMAZON.NoIntent'];

      if (request.type === 'IntentRequest') {
        return (handledIntents.indexOf(request.intent.name) > -1);
      }
    }

    return false;
  },
  handle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    if ((request.intent.name === 'ElementSelected') || (request.intent.name === 'GameIntent')
      || (request.intent.name === 'AMAZON.YesIntent')) {
      // Great, they picked a game
      attributes.temp.selectingGame = undefined;
      return selectedGame(handlerInput);
    } else {
      // OK, pop this choice and go to the next one - if no other choices, we'll go with the last one
      if (attributes.choices) {
        attributes.choices.shift();
        if (attributes.choices.length === 1) {
          // OK, we're going with this one
          attributes.temp.selectingGame = undefined;
          return selectedGame(handlerInput);
        } else {
          const res = require('../resources')(event.request.locale);
          const speech = res.strings.SELECT_REPROMPT.replace('{0}', res.sayGame(attributes.choices[0]));
          return handlerInput.responseBuilder
            .speak(speech)
            .reprompt(speech)
            .getResponse();
        }
      } else {
        // Um ... must have been in the upsell path
        attributes.temp.selectingGame = undefined;
        attributes.currentGame = 'standard';
        return Repeat.handle(handlerInput);
      }
    }
  },
};

function selectedGame(handlerInput) {
  const event = handlerInput.requestEnvelope;
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  const res = require('../resources')(event.request.locale);
  let launchInitialText = '';

  // First let's see if they selected an element via touch
  const index = getSelectedIndex(event);
  if ((index !== undefined) && (index >= 0) && (index < attributes.originalChoices.length)) {
    // Use this one instead
    attributes.currentGame = attributes.originalChoices[index];
  } else {
    attributes.currentGame = attributes.choices[0];
  }

  if (!attributes[attributes.currentGame]) {
    const launchInitialWelcome = JSON.parse(res.strings.LAUNCH_INITIAL_WELCOME);
    launchInitialText = launchInitialWelcome[attributes.currentGame];
    gameService.initializeGame(attributes.currentGame, attributes,
        event.session.user.userId);
  }
  attributes.choices = undefined;
  attributes.originalChoices = undefined;
  attributes.temp.drawBoard = true;

  const launchWelcome = JSON.parse(res.strings.LAUNCH_WELCOME);
  let launchSpeech = launchWelcome[attributes.currentGame];
  launchSpeech += launchInitialText;
  launchSpeech += res.strings.LAUNCH_START_GAME;
  const output = playgame.readCurrentHand(attributes, event.request.locale);
  return handlerInput.responseBuilder
    .speak(launchSpeech)
    .reprompt(output.reprompt)
    .getResponse();
}

function getSelectedIndex(event) {
  let index;

  if (event.request.token) {
    const games = event.request.token.split('.');
    if (games.length === 2) {
      index = games[1];
    }
  } else {
    // Look for an intent slot
    if (event.request.intent.slots && event.request.intent.slots.Number
      && event.request.intent.slots.Number.value) {
      index = parseInt(event.request.intent.slots.Number.value);

      if (isNaN(index)) {
        index = undefined;
      } else {
        // Turn into zero-based index
        index--;
      }
    }
  }

  return index;
}
