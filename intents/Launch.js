//
// Handles launching the skill
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const gameService = require('../GameService');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    const game = this.attributes[this.attributes.currentGame];
    let launchSpeech;

    // Note that this is first hand (so we will say more on the first bet)
    this.attributes['firsthand'] = true;

    // Read in the progressive jackpot amount
    bjUtils.getProgressivePayout(this.attributes, (jackpot) => {
      launchSpeech = res.strings.LAUNCH_WELCOME.replace('{0}', jackpot);
      game.progressiveJackpot = jackpot;

      // Figure out what the current game state is - give them option to reset
      playgame.readCurrentHand(this.attributes, this.event.request.locale, (speech, reprompt) => {
        // Tell them how much money they are starting with
        if (game.activePlayer === 'player') {
          launchSpeech += speech;
        } else {
          launchSpeech += (gameService.isDefaultGame(this.attributes)
                ? res.strings.LAUNCH_DEFAULTSTATE_TEXT
                : res.strings.LAUNCH_NONDEFAULTSTATE_TEXT).replace('{0}', game.bankroll);
        }

        this.handler.state = bjUtils.getState(this.attributes);
        bjUtils.emitResponse(this.emit, this.event.request.locale,
              null, null, launchSpeech, reprompt);
      });
    });
  },
};
