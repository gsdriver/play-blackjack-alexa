//
// Handles the intent to process help
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    playgame.getContextualHelp(this.attributes['gameState'],
      this.event.session.user.userId, (error, response) => {
      let cardText = '';
      let speech = response;

      if (!speech) {
        speech = 'You can play a game by saying Deal, or you can say exit<break time=\'300ms\'/>Now, what can I help you with?';
      }

      cardText += 'You can say BET to place a bet. If no amount is mentioned, the game will use the last amount bet.\n';
      cardText += 'During a hand, ask WHAT SHOULD I DO to hear the Basic Strategy suggestion.\n';
      cardText += 'Say READ THE RULES if you would like to hear the rules currently in play.\n';
      cardText += 'CHANGE will change the rules in play. ';
      cardText += bjUtils.getChangeCardText();

      this.emit(':askWithCard', speech, speech, 'Blackjack Commands', cardText);
    });
  },
};
