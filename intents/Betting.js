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

    // Curious what language is betting...
    console.log('Bet invoked for ' + this.event.request.locale);

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

      playgame.playBlackjackAction(this.attributes, this.event.request.locale,
        this.event.session.user.userId, action,
        (error, response, speech, reprompt) => {
        const game = this.attributes[this.attributes.currentGame];

        this.attributes['firsthand'] = undefined;
        game.hands = (game.hands) ? (game.hands + 1) : 1;
        this.handler.state = bjUtils.getState(this.attributes);
        bjUtils.emitResponse(this.emit, this.event.request.locale,
          error, response, speech, reprompt);
      });
    }
  },
};
