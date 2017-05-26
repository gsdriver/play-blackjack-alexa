//
// Handles the intent to process a 'No' response
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    playgame.playBlackjackAction(this.attributes['gameState'],
      this.event.request.locale,
      this.event.session.user.userId, {action: 'noinsurance'},
      (error, response, speech, reprompt, gameState) => {
      this.attributes['gameState'] = gameState;
      if (gameState) {
        this.handler.state = bjUtils.getState(gameState);
      }
      bjUtils.emitResponse(this.emit, error, response, speech, reprompt);
    });
  },
};
