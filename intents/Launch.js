//
// Handles launching the skill
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const gameService = require('../GameService');
const speechUtils = require('alexa-speech-utils')();

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
          const options = [res.strings.LAUNCH_START_GAME];

          if (game.possibleActions && (game.possibleActions.indexOf('sidebet') > 0)) {
            options.push(res.strings.LAUNCH_START_PLACE_SIDEBET);
          }
          if (!gameService.isDefaultGame(this.attributes)) {
            options.push(res.strings.LAUNCH_START_RESET);
          }

          launchSpeech += res.strings.YOUR_BANKROLL_TEXT.replace('{0}', game.bankroll);
          launchSpeech += speechUtils.or(options, {pause: '300ms'});
        }

        this.handler.state = bjUtils.getState(this.attributes);
        bjUtils.emitResponse(this.emit, this.event.request.locale,
              null, null, launchSpeech, reprompt);
      });
    });
  },
};
