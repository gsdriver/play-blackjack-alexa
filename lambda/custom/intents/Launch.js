//
// Handles launching the skill
//

'use strict';

const gameService = require('../GameService');
const playgame = require('../PlayGame');

module.exports = {
  canHandle: function(handlerInput) {
    // Intents that will drop to Launch
    const request = handlerInput.requestEnvelope.request;
    const intents = ['SuggestIntent', 'ChangeRulesIntent', 'AMAZON.YesIntent', 'AMAZON.NoIntent'];

    return ((request.type === 'LaunchRequest')
      || (handlerInput.requestEnvelope.session.new
        && (request.type === 'IntentRequest')
        && (intents.indexOf(request.intent.name) > -1)));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    let launchSpeech;

    // Since we aren't in a tournament, make sure current hand isn't set to one
    if (attributes.currentGame === 'tournament') {
      attributes.currentGame = 'standard';
    }
    const game = attributes[attributes.currentGame];

    // Try to keep it simple
    const launchWelcome = JSON.parse(res.strings.LAUNCH_WELCOME);
    launchSpeech = launchWelcome[attributes.currentGame];

    // First let's eee if a free trial is underway - or has ended
    let spanishState;
    if (attributes.paid && attributes.paid.spanish) {
      spanishState = attributes.paid.spanish.state;
    }

    if (process.env.SPANISHTRIAL && (attributes.platform !== 'google')) {
      // If they aren't a new user, then let them know a trial is underway
      if (!attributes.newUser && !attributes.spanish) {
        const availableGames = gameService.getAvailableGames(attributes);

        if (availableGames.indexOf('spanish') > -1) {
          launchSpeech += res.strings.LAUNCH_SPANISH_TRIAL;
        }
      }
    } else if (attributes.spanish && (spanishState == 'AVAILABLE')) {
      // They were playing Spanish 21 but the trial has ended
      attributes.spanish = undefined;
      attributes.currentGame = 'standard';
      launchSpeech = launchWelcome['standard'];
      launchSpeech += res.strings.LAUNCH_SPANISH_TRIAL_OVER;
    } else if (!attributes.newUser && (spanishState == 'AVAILABLE') &&
      (!attributes.prompts || !attributes.prompts.sellSpanish)) {
      launchSpeech += res.strings.LAUNCH_SELL_SPANISH;
      attributes.prompts.sellSpanish = true;
    }

    // Figure out what the current game state is - give them option to reset
    const output = playgame.readCurrentHand(attributes, event.request.locale);
    if (game.activePlayer === 'player') {
      // They are in the middle of a hand; remind them what they have
      launchSpeech += output.speech;
    } else {
      launchSpeech += res.strings.LAUNCH_START_GAME;
    }

    if (attributes.prependLaunch) {
      launchSpeech = attributes.prependLaunch + launchSpeech;
      attributes.prependLaunch = undefined;
    }

    return handlerInput.responseBuilder
      .speak(launchSpeech)
      .reprompt(output.reprompt)
      .getResponse();
  },
};
