//
// Handles the intent to process repeating status
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    playgame.readCurrentHand(this.event.session.user.userId,
      (error, response, speech, reprompt, gameState) => {
      bjUtils.emitResponse(this.emit, error, response, speech, reprompt);
    });
  },
};
