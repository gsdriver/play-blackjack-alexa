//
// Handles the betting intent
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    const amountSlot = this.event.request.intent.slots.Amount;
    const amount = (!amountSlot || !amountSlot.value) ? 0 : amountSlot.value;

    // Take the bet
    playgame.playBlackjackAction(this.event.session.user.userId, 'bet', amount,
      (error, response, speech, reprompt, gameState) => {
      if (gameState) {
        this.attributes['gameState'] = gameState;
      }

      if (error) {
        this.emit(':ask', error, 'What else can I help with?');
      } else if (response) {
        this.emit(':tell', response);
      } else {
        this.emit(':ask', speech, reprompt);
      }
    });
  },
};
