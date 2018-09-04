//
// Handles the intent to pick a different game
//

'use strict';

const gameService = require('../GameService');
const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  handleIntent: function() {
    const availableGames = gameService.getAvailableGames(this.attributes);
    const res = require('../resources')(this.event.request.locale);
    let speech;
    let reprompt;

    // If they don't have Spanish 21, upsell
    if (this.attributes.paid && this.attributes.paid.spanish &&
        (!this.attributes.temp.noUpsell &&
        (availableGames.indexOf('spanish') == -1))) {
      const directive = {
        name: 'Upsell',
        id: 'spanish',
        token: 'SELECTGAME',
        upsellMessage: res.strings.SELECT_SPANISH_UPSELL,
      };
      bjUtils.sendBuyResponse(this, directive);
    } else {
      if (availableGames.length < 2) {
        // Sorry, no games available to select
        speech = res.strings.SELECT_ONE_GAME;
        reprompt = res.strings.ERROR_REPROMPT;
        this.handler.state = bjUtils.getState(this.attributes);
      } else {
        // Sort these with current game last
        availableGames.push(this.attributes.currentGame);
        const i = availableGames.indexOf(this.attributes.currentGame);
        availableGames.splice(i, 1);

        this.attributes.choices = availableGames;
        this.attributes.originalChoices = availableGames;
        this.handler.state = 'SELECTGAME';

        speech = res.strings.SELECT_GAMES
          .replace('{0}', speechUtils.and(availableGames.map((x) => res.sayGame(x)),
              {locale: this.event.request.locale}));
        reprompt = res.strings.SELECT_REPROMPT.replace('{0}', res.sayGame(availableGames[0]));
        speech += reprompt;
      }

      bjUtils.emitResponse(this, null, null, speech, reprompt);
    }
  },
  handleYesIntent: function() {
    // Great, they picked a game
    this.handler.state = 'NEWGAME';
    selectedGame(this);
  },
  handleNoIntent: function() {
    // OK, pop this choice and go to the next one - if no other choices, we'll go with the last one
    if (this.attributes.choices) {
      this.attributes.choices.shift();
      if (this.attributes.choices.length === 1) {
        // OK, we're going with this one
        this.handler.state = 'NEWGAME';
        selectedGame(this);
      } else {
        const res = require('../resources')(this.event.request.locale);
        const speech = res.strings.SELECT_REPROMPT.replace('{0}', res.sayGame(this.attributes.choices[0]));

        bjUtils.emitResponse(this, null, null, speech, speech);
      }
    } else {
      // Um ... must have been in the upsell path
      this.handler.state = 'NEWGAME';
      this.attributes.currentGame = 'standard';
      this.emitWithState('AMAZON.RepeatIntent');
    }
  },
};

function selectedGame(context) {
  const res = require('../resources')(context.event.request.locale);
  const attributes = context.attributes;
  let launchInitialText = '';

  // First let's see if they selected an element via touch
  const index = getSelectedIndex(context);
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
        context.event.session.user.userId);
  }
  attributes.choices = undefined;
  attributes.originalChoices = undefined;

  const launchWelcome = JSON.parse(res.strings.LAUNCH_WELCOME);
  let launchSpeech = launchWelcome[context.attributes.currentGame];
  launchSpeech += launchInitialText;
  launchSpeech += res.strings.LAUNCH_START_GAME;
  const output = playgame.readCurrentHand(context.attributes, context.event.request.locale);
  bjUtils.emitResponse(context, null, null, launchSpeech, output.reprompt);
}

function getSelectedIndex(context) {
  let index;

  if (context.event.request.token) {
    const games = context.event.request.token.split('.');
    if (games.length === 2) {
      index = games[1];
    }
  } else {
    // Look for an intent slot
    if (context.event.request.intent.slots && context.event.request.intent.slots.Number
      && context.event.request.intent.slots.Number.value) {
      index = parseInt(context.event.request.intent.slots.Number.value);

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
