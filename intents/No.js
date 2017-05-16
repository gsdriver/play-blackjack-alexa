//
// Handles the intent to process a 'No' response
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    playgame.playBlackjackAction(this.event.session.user.userId, 'noinsurance', 0,
      (error, response, speech, reprompt, gameState) => {
      if (gameState) {
        this.attributes['gameState'] = gameState;
      }

      if (error) {
        this.emit(':ask', error, 'What else can I help with?');
      } else if (response) {
        this.emit(':tell', response);
      } else {
        this.emit(':ask', speech, reprompt);
      }
    });
  },
};
