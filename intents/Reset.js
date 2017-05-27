//
// Handles a reset, which can only be done if you are at a state to start a new hand
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    // We will ask them if they want to reset
    const res = require('../' + this.event.request.locale + '/resources');
    const speech = res.strings.RESET_CONFIRM;

    this.handler.state = 'CONFIRMRESET';
    this.emit(':ask', speech, speech);
  },
  handleYesReset: function() {
    // Confirmed - let's reset
    playgame.flushGame(this.event.session.user.userId, (error, result) => {
      // I don't care if this succeeds or not
      const res = require('../' + this.event.request.locale + '/resources');

      this.attributes['gameState'] = undefined;
      this.handler.state = 'NEWGAME';
      this.emit(':ask', res.strings.RESET_COMPLETED, res.strings.RESET_REPROMPT);
    });
  },
  handleNoReset: function() {
    // Nope, they are not going to reset - so go back to start a new game
    const res = require('../' + this.event.request.locale + '/resources');

    this.handler.state = 'NEWGAME';
    this.emit(':ask', res.strings.RESET_ABORTED, res.strings.RESET_REPROMPT);
  },
};
