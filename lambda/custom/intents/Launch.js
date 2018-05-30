//
// Handles launching the skill
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    let launchSpeech;

    // Since we aren't in a tournament, make sure current hand isn't set to one
    if (this.attributes.currentGame === 'tournament') {
      this.attributes.currentGame = 'standard';
    }
    const game = this.attributes[this.attributes.currentGame];

    // Try to keep it simple
    const launchWelcome = JSON.parse(res.strings.LAUNCH_WELCOME);
    launchSpeech = launchWelcome[this.attributes.currentGame];
    if (this.attributes.tournamentResult) {
      launchSpeech = this.attributes.tournamentResult + launchSpeech;
      this.attributes.tournamentResult = undefined;
    }

    // Figure out what the current game state is - give them option to reset
    playgame.readCurrentHand(this.attributes, this.event.request.locale, (speech, reprompt) => {
      if (game.activePlayer === 'player') {
        // They are in the middle of a hand; remind them what they have
        launchSpeech += speech;
      } else {
        launchSpeech += res.strings.LAUNCH_START_GAME;
      }

      this.handler.state = bjUtils.getState(this.attributes);
      bjUtils.emitResponse(this, null, null, launchSpeech, reprompt);
    });
  },
};
