//
// Handles the betting intent
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    let amount = 0;

    if (this.event.request.intent.slots && this.event.request.intent.slots.Amount
      && this.event.request.intent.slots.Amount.value) {
      amount = this.event.request.intent.slots.Amount.value;
    }

    // If the bet is non-numeric, refuse it
    if (isNaN(amount)) {
      bjUtils.emitResponse(this.emit, 'Unable to place a bet for ' + amountSlot.value, null, null, null);
    } else {
      // Take the bet
      const action = {action: 'bet', amount: amount, firsthand: this.attributes['firsthand']};

      playgame.playBlackjackAction(this.event.session.user.userId, action,
        (error, response, speech, reprompt, gameState) => {
        this.attributes['firsthand'] = undefined;
        bjUtils.emitResponse(this.emit, error, response, speech, reprompt);
      });
    }
  },
};
