//
// Handles the intent to read the rules of the game
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');

    playgame.readRules(this.attributes, this.event.request.locale, (speech, reprompt) => {
      bjUtils.emitResponse(this, null, null,
              speech, reprompt, res.strings.RULES_CARD_TITLE, speech);
    });
  },
};
