//
// Handles launching the skill
//

'use strict';

const playgame = require('../PlayGame');
const utils = require('alexa-speech-utils')();

module.exports = {
  handleIntent: function() {
    playgame.readCurrentHand(this.attributes['gameState'],
      this.event.request.locale,
      this.event.session.user.userId,
      (error, response, speech, reprompt, gameState) => {
      let exitSpeech = '';

      // Tell them how much money they are leaving with
      if (gameState) {
        exitSpeech = 'You are leaving with ' + utils.formatCurrency(gameState.bankroll, this.event.request.locale) + '. ';
      }
      exitSpeech += 'Goodbye.';
      this.emit(':tell', exitSpeech);
    });
  },
};
