//
// Handles the intent to read the rules of the game
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');

    playgame.readRules(this.attributes, this.event.request.locale, (speech, reprompt) => {
      this.emit(':askWithCard', speech, reprompt, res.strings.RULES_CARD_TITLE, speech);
    });
  },
};
