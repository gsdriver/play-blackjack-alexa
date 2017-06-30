//
// Handles the betting intent
//

'use strict';

const bjUtils = require('../BlackjackUtils');

const SIDEBET_AMOUNT = 1;

module.exports = {
  handlePlaceIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    const game = this.attributes[this.attributes.currentGame];
    let speech;
    let reprompt;

    // Side bet is always for 1 unit and can only be placed if you can bet
    // Can't place side bet if bankroll is at minimum bet
    if (!game.possibleActions
          || (game.possibleActions.indexOf('bet') < 0)) {
      speech = res.strings.SIDEBET_INVALID;
      reprompt = res.strings.ERROR_REPROMPT;
    } else if ((game.bankroll - SIDEBET_AMOUNT) < game.rules.minBet) {
      speech = res.strings.SIDEBET_MINIMUM;
      reprompt = res.strings.SIDEBET_REPROMPT;
    } else {
      game.sideBet = SIDEBET_AMOUNT;
      speech = res.strings.SIDEBET_PLACED.replace('{0}', SIDEBET_AMOUNT);
      reprompt = res.strings.SIDEBET_REPROMPT;
    }

    speech += reprompt;
    bjUtils.emitResponse(this.emit, this.event.request.locale, null, null, speech, reprompt);
  },
  handleRemoveIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    const game = this.attributes[this.attributes.currentGame];
    let speech;
    let reprompt;

    // Side bet can only be removed if you can bet
    if (!game.possibleActions
          || (game.possibleActions.indexOf('bet') < 0)) {
      speech = res.strings.SIDEBET_INVALID;
      reprompt = res.strings.ERROR_REPROMPT;
    } else {
      // OK, remove it
      speech = (game.sideBet) ? res.strings.SIDEBET_REMOVED : res.strings.SIDEBET_NOBET;
      reprompt = res.strings.SIDEBET_REPROMPT;
      game.sideBet = undefined;
    }

    speech += reprompt;
    bjUtils.emitResponse(this.emit, this.event.request.locale, null, null, speech, reprompt);
  },
};
