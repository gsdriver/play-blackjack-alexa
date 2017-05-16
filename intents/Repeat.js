//
// Handles the intent to process repeating status
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    playgame.readCurrentHand(this.event.session.user.userId,
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
