//
// Handles the intent to process help
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    playgame.getContextualHelp(this.event.session.user.userId, (error, response) => {
      let cardText = '';
      let speech = response;

      if (!speech) {
        speech = 'You can play a game by saying Deal, or you can say exit<break time=\'300ms\'/>Now, what can I help you with?';
      }

      cardText += 'You can say BET to place a bet. If no amount is mentioned, the game will use the last amount bet./n';
      cardText += 'During a hand, ask WHAT SHOULD I DO to hear the Basic Strategy suggestion./n';
      cardText += 'Say READ THE RULES if you would like to hear the rules currently in play./n';
      cardText += 'CHANGE will change the rules in play.  You can change the following options:/n/n';
      cardText += ' - HIT SOFT SEVENTEEN: whether the dealer will hit a soft 17 total. Can be ON or OFF./n';
      cardText += ' - SURRENDER: whether surrender is offered as an option. Can be ON or OFF./n';
      cardText += ' - DOUBLE DOWN: whether double down is offered or not.  Can be ON or OFF./n';
      cardText += ' - DOUBLE AFTER SPLIT: whether you can double down after splitting a pair.  Can be ON or OFF./n';
      cardText += ' - RESPLIT ACES: wheter you can resplit Aces or not.  Can be ON or OFF./n';
      cardText += ' - NUMBER OF DECKS: the number of decks in play. Can be ONE, TWO, FOUR, SIX, or EIGHT./n';
      cardText += ' - NUMBER OF SPLIT HANDS: the maximum number of hands you can have from splitting. Can be ONE, TWO, THREE, or FOUR./n';
      cardText += '/nFor example, say "change number of decks to two" if you want to play with two decks./n';
      cardText += 'Note that the deck will be shuffled if you change the rules of the game';

      this.emit(':askWithCard', speech, speech, 'Play Blackjack', cardText);
    });
  },
};
