//
// Handles the betting intent
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    const amountSlot = this.event.request.intent.slots.Amount;
    const amount = (!amountSlot || !amountSlot.value) ? 0 : amountSlot.value;

    // If the bet is non-numeric, refuse it
    if (isNaN(amount)) {
      bjUtils.emitResponse(this.emit, 'Unable to place a bet for ' + amountSlot.value, null, null, null);
    } else {
      // Take the bet
      playgame.playBlackjackAction(this.event.session.user.userId, 'bet', amount,
        (error, response, speech, reprompt, gameState) => {
        bjUtils.emitResponse(this.emit, error, response, speech, reprompt);
      });
    }
  },
};
