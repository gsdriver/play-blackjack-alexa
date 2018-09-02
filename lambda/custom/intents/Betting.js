//
// Handles the betting intent
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    let amount = 0;
    const game = this.attributes[this.attributes.currentGame];

    // Take the bet
    amount = getBet(this.event, this.attributes);
    const action = {action: 'bet', amount: amount, firsthand: this.attributes.temp.firsthand};
    playgame.playBlackjackAction(this.attributes, this.event.request.locale,
      this.event.session.user.userId, action,
      (error, response, speech, reprompt) => {
      if (!error) {
        this.attributes.temp.firsthand = undefined;
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
      bjUtils.emitResponse(this, error, response, speech, reprompt);
    });
  },
};

function getBet(event, attributes) {
  // The bet amount is optional - if not present we will use
  // a default value of either the last bet amount or $100
  let amount;
  const DEFAULT_BET = 100;
  const game = attributes[attributes.currentGame];
  const amountSlot = (event.request.intent && event.request.intent.slots
      && event.request.intent.slots.Amount);

  if (amountSlot && amountSlot.value) {
    // If the bet amount isn't an integer, we'll use the default value (1 unit)
    amount = parseInt(amountSlot.value);
  } else if (game.lastBet) {
    amount = game.lastBet;
  } else {
    amount = DEFAULT_BET;
  }

  // Let's tweak the amount for them
  if (isNaN(amount) || (amount == 0)) {
    amount = (game.lastBet) ? game.lastBet : DEFAULT_BET;
  } else if (amount < game.rules.minBet) {
    amount = game.rules.minBet;
  } else if (amount > game.rules.maxBet) {
    amount = game.rules.maxBet;
  }
  if (amount > game.bankroll) {
    amount = game.bankroll;
  }

  return amount;
}
