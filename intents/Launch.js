//
// Handles launching the skill
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    const speech = 'Welcome to the Blackjack player. You can start a blackjack game by saying Deal or Bet ... Now, what can I help you with?';

    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const reprompt = 'For instructions on what you can say, please say help me.';

    // If they opened the session, flush the previous state if any
    playgame.flushGame(this.event.session.user.userId, (error, result) => {
      // I don't care if this succeeds or not
      this.emit(':ask', speech, reprompt);
    });
  },
};
