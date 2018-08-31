//
// Handles launching the skill
//

'use strict';

const gameService = require('../GameService');
const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    const res = require('../resources')(this.event.request.locale);
    let launchSpeech;

    // Since we aren't in a tournament, make sure current hand isn't set to one
    if (this.attributes.currentGame === 'tournament') {
      this.attributes.currentGame = 'standard';
    }
    const game = this.attributes[this.attributes.currentGame];

    // Try to keep it simple
    const launchWelcome = JSON.parse(res.strings.LAUNCH_WELCOME);
    launchSpeech = launchWelcome[this.attributes.currentGame];

    // First let's eee if a free trial is underway - or has ended
    let spanishState;
    if (this.attributes.paid && this.attributes.paid.spanish) {
      spanishState = this.attributes.paid.spanish.state;
    }

    if (process.env.SPANISHTRIAL && (this.attributes.platform !== 'google')) {
      // If they aren't a new user, then let them know a trial is underway
      if (!this.attributes.newUser && !this.attributes.spanish) {
        const availableGames = gameService.getAvailableGames(this.attributes);

        if (availableGames.indexOf('spanish') > -1) {
          launchSpeech += res.strings.LAUNCH_SPANISH_TRIAL;
        }
      }
    } else if (this.attributes.spanish && (spanishState == 'AVAILABLE')) {
      // They were playing Spanish 21 but the trial has ended
      this.attributes.spanish = undefined;
      this.attributes.currentGame = 'standard';
      launchSpeech = launchWelcome['standard'];
      launchSpeech += res.strings.LAUNCH_SPANISH_TRIAL_OVER;
    } else if (!this.attributes.newUser && (spanishState == 'AVAILABLE') &&
      (!this.attributes.prompts || !this.attributes.prompts.sellSpanish)) {
      launchSpeech += res.strings.LAUNCH_SELL_SPANISH;
      this.attributes.prompts.sellSpanish = true;
    }

    // Figure out what the current game state is - give them option to reset
    playgame.readCurrentHand(this.attributes, this.event.request.locale, (speech, reprompt) => {
      if (game.activePlayer === 'player') {
        // They are in the middle of a hand; remind them what they have
        launchSpeech += speech;
      } else {
        launchSpeech += res.strings.LAUNCH_START_GAME;
      }

      if (this.attributes.prependLaunch) {
        launchSpeech = this.attributes.prependLaunch + launchSpeech;
        this.attributes.prependLaunch = undefined;
      }
      this.handler.state = bjUtils.getState(this.attributes);
      bjUtils.emitResponse(this, null, null, launchSpeech, reprompt);
    });
  },
};
