//
// Set of utility functions
//

'use strict';

module.exports = {
  emitResponse: function(emit, locale, error, response, speech, reprompt) {
    if (error) {
      const res = require('./' + locale + '/resources');
      console.log('Speech error: ' + error);
      emit(':ask', error, res.ERROR_REPROMPT);
    } else if (response) {
      emit(':tell', response);
    } else {
      emit(':ask', speech, reprompt);
    }
  },
  // Figures out what state of the game we're in
  getState: function(gameState) {
    // New game - ready to start a new game
    if (gameState.possibleActions.indexOf('bet') >= 0) {
      return 'NEWGAME';
    } else if (gameState.possibleActions.indexOf('noinsurance') >= 0) {
      return 'INSURANCEOFFERED';
    } else {
      return 'INGAME';
    }
  },
  // Determines if this is the initial game state or not; somewhat of a hack because
  // I don't want to rev the server to tell me this (could be passed back in a future
  // version of the gameState variable)
  isDefaultGameState: function(gameState) {
    return ((gameState.activePlayer == 'none') && (gameState.bankroll == 5000) && (gameState.lastBet == 100)
      && (gameState.houseRules.hitSoft17 == false) && (gameState.houseRules.surrender == 'late')
      && (gameState.houseRules.double == 'any' && (gameState.houseRules.doubleaftersplit == true)
      && (gameState.houseRules.resplitAces == false) && (gameState.houseRules.blackjackBonus == 0.5)
      && (gameState.houseRules.numberOfDecks == 1)));
  },
};
