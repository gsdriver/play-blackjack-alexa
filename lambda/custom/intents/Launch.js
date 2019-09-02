//
// Handles launching the skill
//

'use strict';

const gameService = require('../GameService');
const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const upsell = require('../UpsellEngine');
const { AlexaGamesGameOnClient } = require('@amzn-gameon/alexa-sdk');

module.exports = {
  canHandle: function(handlerInput) {
    // Intents that will drop to Launch
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const intents = ['SuggestIntent', 'ChangeRulesIntent', 'AMAZON.YesIntent', 'AMAZON.NoIntent'];

    if ((request.type === 'LaunchRequest')
      || (handlerInput.requestEnvelope.session.new
        && (request.type === 'IntentRequest')
        && (intents.indexOf(request.intent.name) > -1))) {
      return true;
    }

    // If they declined to join the tournament, we also handle that
    if (attributes.temp.joinTournament && (request.type === 'IntentRequest')
      && (request.intent.name === 'AMAZON.NoIntent')) {
      attributes.temp.joinTournament = undefined;
      if (attributes.currentGame === 'tournament') {
        attributes.currentGame = 'standard';
      }
      return true;
    }

    return false;
  },
  handle: async function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    let launchSpeech;

    // Register with GameOn if not already registered
    if (!attributes.GameOn) {
      const client = new AlexaGamesGameOnClient();
      attributes.GameOn = await client.initializeNewPlayer({
        gameApiKey: process.env.GAMEON_PUBLIC_API_KEY,
        appBuildType: 'development',
      });
    } else {
      const date = Date.now();
      if (date > attributes.GameOn.sessionExpirationDate) {
        // Need to refresh the player
        const client = new AlexaGamesGameOnClient();
        attributes.GameOn = await client.refreshPlayerSession({
          gameApiKey: process.env.GAMEON_PUBLIC_API_KEY,
          appBuildType: 'development',
          player: attributes.GameOn,
        });
      }
    }

    // Since we aren't in a tournament, make sure current hand isn't set to one
    if (attributes.currentGame === 'tournament') {
      attributes.currentGame = 'standard';
    }
    const game = attributes[attributes.currentGame];

    // Try to keep it simple
    const format = JSON.parse(res.strings.LAUNCH_WELCOME)[attributes.currentGame];
    const greeting = await bjUtils.getWelcome(handlerInput, format);

    // First let's eee if a free trial is underway - or has ended
    launchSpeech = greeting;
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
    } else if (!attributes.temp.noUpsellLaunch) {
      const directive = upsell.getUpsell(attributes, 'launch');
      if (directive) {
        directive.token = 'game.spanish.launch';
        resolve(handlerInput.responseBuilder
          .addDirective(directive)
          .withShouldEndSession(true)
          .getResponse());
        return;
      }
    }

    // Figure out what the current game state is - give them option to reset
    const output = playgame.readCurrentHand(attributes, event.request.locale);
    if (game.activePlayer === 'player') {
      // They are in the middle of a hand; remind them what they have
      launchSpeech += output.speech;
    } else {
      launchSpeech += res.strings.LAUNCH_START_GAME;
      if (spanishState === 'PURCHASED') {
        // Let them know they can say select game to switch games
        launchSpeech += res.strings.LAUNCH_SELECT_GAME;
      }
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
