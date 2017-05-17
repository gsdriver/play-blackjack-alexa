//
// Handles a reset, which can only be done if you are at a state to start a new hand
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    const intentObj = this.event.request.intent;
    if (intentObj.confirmationStatus !== 'CONFIRMED') {
      if (intentObj.confirmationStatus !== 'DENIED') {
        // Intent is not confirmed
        const speech = 'Would you like to reset the game? This will reset your bankroll and rules of the game.';
        this.emit(':confirmIntent', speech, speech);
      } else {
        // User denies the confirmation of intent
        this.emit(':ask', 'Game not reset. Say bet to start a new game.', 'Say bet to start a new game.');
      }
    } else {
      // Confirmed - let's reset
      playgame.flushGame(this.event.session.user.userId, (error, result) => {
        // I don't care if this succeeds or not
        this.handler.state = 'NEWGAME';
        this.emit(':ask', 'You have 5000 dollars. Say bet to start a new game.', 'Say bet to start a new game.');
      });
    }
  },
};
