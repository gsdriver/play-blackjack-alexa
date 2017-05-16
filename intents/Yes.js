//
// Handles the intent to process a 'Yes' response
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    playgame.playBlackjackAction(this.event.session.user.userId, 'insurance', 0,
      (error, response, speech, reprompt, gameState) => {
      bjUtils.emitResponse(this.emit, error, response, speech, reprompt);
    });
  },
};
