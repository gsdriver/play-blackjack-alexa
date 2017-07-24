//
// Handles the intent to process help
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    // Help is different for tournament play
    if (this.attributes.currentHand === 'tournament') {
      tournament.readHelp(this.emit, this.event.request.locale, this.attributes);
    } else {
      const res = require('../' + this.event.request.locale + '/resources');
      let speech = playgame.getContextualHelp(this.attributes, this.event.request.locale);
      if (!speech) {
        speech = res.strings.HELP_GENERIC_HELP;
      }

      this.emit(':askWithCard', speech, speech, res.strings.HELP_CARD_TITLE,
          res.strings.HELP_CARD_PROGRESSIVE_TEXT + res.strings.HELP_CARD_TEXT);
    }
  },
};
