//
// Set of utility functions
//

'use strict';

module.exports = {
  emitResponse: function(emit, error, response, speech, reprompt) {
    if (error) {
      emit(':ask', error, 'What else can I help with?');
    } else if (response) {
      emit(':tell', response);
    } else {
      emit(':ask', speech, reprompt);
    }
  },
  getChangeCardText: function() {
    let cardText = '';

    cardText += 'You can change the following options:/n/n';
    cardText += ' - HIT SOFT SEVENTEEN: whether the dealer will hit a soft 17 total. Can be ON or OFF./n';
    cardText += ' - SURRENDER: whether surrender is offered as an option. Can be ON or OFF./n';
    cardText += ' - DOUBLE DOWN: whether double down is offered or not.  Can be ON or OFF./n';
    cardText += ' - DOUBLE AFTER SPLIT: whether you can double down after splitting a pair.  Can be ON or OFF./n';
    cardText += ' - RESPLIT ACES: wheter you can resplit Aces or not.  Can be ON or OFF./n';
    cardText += ' - NUMBER OF DECKS: the number of decks in play. Can be ONE, TWO, FOUR, SIX, or EIGHT./n';
    cardText += ' - NUMBER OF SPLIT HANDS: the maximum number of hands you can have from splitting. Can be ONE, TWO, THREE, or FOUR./n';
    cardText += '/nFor example, say "change number of decks to two" if you want to play with two decks./n';
    cardText += 'Note that the deck will be shuffled if you change the rules of the game';

    return cardText;
  },
};
