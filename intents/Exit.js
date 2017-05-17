//
// Handles launching the skill
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    playgame.readCurrentHand(this.event.session.user.userId,
      (error, response, speech, reprompt, gameState) => {
      let exitSpeech = '';

      // Tell them how much money they are leaving with
      if (gameState) {
        exitSpeech = 'You are leaving with $' + gameState.bankroll + '. ';
      }
      exitSpeech += 'Goodbye.';
      this.emit(':tell', exitSpeech);
    });
  },
};
