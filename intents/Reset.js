//
// Handles a reset, which can only be done if you are at a state to start a new hand
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    // We will ask them if they want to reset
    const speech = 'Would you like to reset the game? This will reset your bankroll and rules of the game.';
    this.handler.state = 'CONFIRMRESET';
    this.emit(':ask', speech, speech);
  },
  handleYesReset: function() {
    // Confirmed - let's reset
    playgame.flushGame(this.event.session.user.userId, (error, result) => {
      // I don't care if this succeeds or not
      this.attributes['gameState'] = undefined;
      this.handler.state = 'NEWGAME';
      this.emit(':ask', 'You have $5000. Say bet to start a new game.', 'Say bet to start a new game.');
    });
  },
  handleNoReset: function() {
    // Nope, they are not going to reset - so go back to start a new game
    this.handler.state = 'NEWGAME';
    this.emit(':ask', 'Game not reset. Say bet to start a new game.', 'Say bet to start a new game.');
  },
};
