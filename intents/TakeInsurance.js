//
// Handles the intent to process a 'Yes' response
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    playgame.playBlackjackAction(this.event.session.user.userId, {action: 'insurance'},
      (error, response, speech, reprompt, gameState) => {
      this.handler.state = bjUtils.getState(gameState);
      bjUtils.emitResponse(this.emit, error, response, speech, reprompt);
    });
  },
};
