//
// Handles launching the skill
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    let launchSpeech = res.strings.LAUNCH_WELCOME;

    // Note that this is first hand (so we will say more on the first bet)
    this.attributes['firsthand'] = true;

    // Figure out what the current game state is - give them option to reset
    playgame.readCurrentHand(undefined,
      this.event.request.locale,
      this.event.session.user.userId,
      (error, response, speech, reprompt, gameState) => {
      // Tell them how much money they are leaving with
      this.attributes['gameState'] = gameState;
      if (gameState) {
        if (gameState.activePlayer === 'player') {
          launchSpeech += speech;
        } else {
          launchSpeech += (bjUtils.isDefaultGameState(gameState) ? res.strings.LAUNCH_DEFAULTSTATE_TEXT : res.strings.LAUNCH_NONDEFAULTSTATE_TEXT).replace('{0}', gameState.bankroll);
        }

        this.handler.state = bjUtils.getState(gameState);
      } else {
        launchSpeech += res.strings.LAUNCH_STARTGAME;
      }
      bjUtils.emitResponse(this.emit, this.event.request.locale,
        error, response, launchSpeech, reprompt);
    });
  },
};
