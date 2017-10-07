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
    const game = this.attributes[this.attributes.currentGame];

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
        if (!error) {
          this.attributes['firsthand'] = undefined;
          if (game.timestamp) {
            const lastPlay = new Date(game.timestamp);
            const now = new Date(Date.now());
            game.firstDailyHand = (lastPlay.getDate() != now.getDate());
          } else {
            game.firstDailyHand = true;
          }
          game.timestamp = Date.now();
          game.hands = (game.hands) ? (game.hands + 1) : 1;
        }

        this.handler.state = bjUtils.getState(this.attributes);
        bjUtils.emitResponse(this.emit, this.event.request.locale,
          error, response, speech, reprompt);
      });
    }
  },
};
