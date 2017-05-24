//
// Set of utility functions
//

'use strict';

module.exports = {
  emitResponse: function(emit, error, response, speech, reprompt) {
    if (error) {
      console.log('Speech error: ' + error);
      emit(':ask', error, 'What else can I help with?');
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
  getChangeCardText: function() {
    let cardText = '';

    cardText += 'You can change the following options:\n\n';
    cardText += ' - HIT SOFT SEVENTEEN: whether the dealer will hit a soft 17 total. Can be ON or OFF.\n';
    cardText += ' - SURRENDER: whether surrender is offered as an option. Can be ON or OFF.\n';
    cardText += ' - DOUBLE DOWN: whether double down is offered or not.  Can be ON or OFF.\n';
    cardText += ' - DOUBLE AFTER SPLIT: whether you can double down after splitting a pair.  Can be ON or OFF.\n';
    cardText += ' - RESPLIT ACES: wheter you can resplit Aces or not.  Can be ON or OFF.\n';
    cardText += ' - NUMBER OF DECKS: the number of decks in play. Can be ONE, TWO, FOUR, SIX, or EIGHT.\n';
    cardText += ' - NUMBER OF SPLIT HANDS: the maximum number of hands you can have from splitting. Can be ONE, TWO, THREE, or FOUR.\n\n';
    cardText += 'For example, say "change number of decks to two" if you want to play with two decks.\n';
    cardText += 'Note that the deck will be shuffled if you change the rules of the game';

    return cardText;
  },
};
