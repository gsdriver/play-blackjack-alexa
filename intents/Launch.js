//
// Handles launching the skill
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    let launchSpeech = 'Welcome to the Blackjack player. ';

    // Note that this is first hand (so we will say more on the first bet)
    this.attributes['firsthand'] = true;

    // Figure out what the current game state is - give them option to reset
    playgame.readCurrentHand(this.attributes['gameState'],
      this.event.session.user.userId,
      (error, response, speech, reprompt, gameState) => {
      // Tell them how much money they are leaving with
      this.attributes['gameState'] = gameState;
      if (gameState) {
        if (gameState.activePlayer === 'player') {
          launchSpeech += speech;
        } else {
          launchSpeech += 'You have $' + gameState.bankroll + '. Say bet to start a new game';
          if (!bjUtils.isDefaultGameState(gameState)) {
            launchSpeech += ' or reset game to reset to the default rules and bankroll';
          }
          launchSpeech += '. ... Now, what can I help you with?';
        }

        this.handler.state = bjUtils.getState(gameState);
      } else {
        launchSpeech += 'You can start a blackjack game by saying Bet ... Now, what can I help you with?';
      }
      bjUtils.emitResponse(this.emit, error, response, launchSpeech, reprompt);
    });
  },
};
