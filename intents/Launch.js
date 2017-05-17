//
// Handles launching the skill
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    const speech = 'Welcome to the Blackjack player. You can start a blackjack game by saying Bet ... Now, what can I help you with?';
    const reprompt = 'What can I help you with?';

    // We start with a new game
    this.handler.state = 'NEWGAME';

    // If they opened the session, flush the previous state if any
    playgame.flushGame(this.event.session.user.userId, (error, result) => {
      // I don't care if this succeeds or not
      this.emit(':ask', speech, reprompt);
    });
  },
};
