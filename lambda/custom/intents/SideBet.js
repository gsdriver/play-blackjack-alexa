//
// Handles the side bet
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handlePlaceIntent: function() {
    playgame.playBlackjackAction(this.attributes, this.event.request.locale,
      this.event.session.user.userId, {action: 'sidebet'},
      (error, response, speech, reprompt) => {
      bjUtils.emitResponse(this, error, response, speech, reprompt);
    });
  },
  handleRemoveIntent: function() {
    playgame.playBlackjackAction(this.attributes, this.event.request.locale,
      this.event.session.user.userId, {action: 'nosidebet'},
      (error, response, speech, reprompt) => {
      bjUtils.emitResponse(this, error, response, speech, reprompt);
    });
  },
};
