//
// Handles the intent to process repeating status
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    playgame.readCurrentHand(this.attributes, this.event.request.locale, (speech, reprompt) => {
      bjUtils.emitResponse(this.emit, this.event.request.locale, null, null, speech, reprompt);
    });
  },
};
