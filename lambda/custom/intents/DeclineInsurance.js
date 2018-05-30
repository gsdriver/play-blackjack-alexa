//
// Handles the intent to process a 'No' response
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    playgame.playBlackjackAction(this.attributes,
      this.event.request.locale,
      this.event.session.user.userId, {action: 'noinsurance'},
      (error, response, speech, reprompt) => {
      this.handler.state = bjUtils.getState(this.attributes);
      bjUtils.emitResponse(this, error, response, speech, reprompt);
    });
  },
};
