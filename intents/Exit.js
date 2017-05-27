//
// Handles launching the skill
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    playgame.readCurrentHand(this.attributes['gameState'],
      this.event.request.locale,
      this.event.session.user.userId,
      (error, response, speech, reprompt, gameState) => {
      let exitSpeech = '';
      const res = require('../' + this.event.request.locale + '/resources');

      // Tell them how much money they are leaving with
      if (gameState) {
        exitSpeech = res.strings.EXIT_BANKROLL.replace('{0}', gameState.bankroll) + ' ';
      }
      exitSpeech += res.strings.EXIT_GOODBYE;
      this.emit(':tell', exitSpeech);
    });
  },
};
