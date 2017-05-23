//
// Handles the intent to provide a suggestion
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    playgame.playBlackjackAction(this.attributes['gameState'],
      this.event.session.user.userId, {action: 'suggest'},
      (error, response, speech, reprompt, gameState) => {
      bjUtils.emitResponse(this.emit, error, response, speech, reprompt);
    });
  },
};
