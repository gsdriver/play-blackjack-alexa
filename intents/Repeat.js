//
// Handles the intent to process repeating status
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    playgame.readCurrentHand(this.attributes['gameState'],
      this.event.request.locale,
      this.event.session.user.userId,
      (error, response, speech, reprompt, gameState) => {
      bjUtils.emitResponse(this.emit, this.event.request.locale, error, response, speech, reprompt);
    });
  },
};
