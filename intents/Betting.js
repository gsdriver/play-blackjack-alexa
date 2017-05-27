//
// Handles the betting intent
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    let amount = 0;
    const res = require('../' + this.event.request.locale + '/resources');

    if (this.event.request.intent.slots && this.event.request.intent.slots.Amount
      && this.event.request.intent.slots.Amount.value) {
      amount = this.event.request.intent.slots.Amount.value;
    }

    // If the bet is non-numeric, refuse it
    if (isNaN(amount)) {
      const betError = res.strings.BAD_BET_FORMAT.replace('{0}', amount);
      bjUtils.emitResponse(this.emit, this.event.request.locale, betError, null, null, null);
    } else {
      // Take the bet
      const action = {action: 'bet', amount: amount, firsthand: this.attributes['firsthand']};

      playgame.playBlackjackAction(this.attributes['gameState'], this.event.request.locale,
        this.event.session.user.userId, action,
        (error, response, speech, reprompt, gameState) => {
        this.attributes['gameState'] = gameState;
        if (gameState) {
          this.attributes['firsthand'] = undefined;
          this.handler.state = bjUtils.getState(gameState);
        }
        bjUtils.emitResponse(this.emit, this.event.request.locale,
          error, response, speech, reprompt);
      });
    }
  },
};
