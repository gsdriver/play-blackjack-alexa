//
// Handles the intent to provide a suggestion
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    playgame.playBlackjackAction(this.attributes,
      this.event.request.locale,
      this.event.session.user.userId, {action: 'suggest'},
      (error, response, speech, reprompt) => {
      bjUtils.emitResponse(this, error, response, speech, reprompt);
    });
  },
};
