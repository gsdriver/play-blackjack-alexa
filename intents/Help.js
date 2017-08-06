//
// Handles the intent to process help
//

'use strict';

const playgame = require('../PlayGame');
const tournament = require('../tournament');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    // Help is different for tournament play
    if (this.attributes.currentGame === 'tournament') {
      tournament.readHelp(this.emit, this.event.request.locale, this.attributes);
    } else {
      const res = require('../' + this.event.request.locale + '/resources');
      let speech = playgame.getContextualHelp(this.attributes, this.event.request.locale);
      if (!speech) {
        speech = res.strings.HELP_GENERIC_HELP;
      }

      bjUtils.emitResponse(this.emit, this.event.request.locale, null, null,
          speech, speech, res.strings.HELP_CARD_TITLE,
          res.strings.HELP_CARD_PROGRESSIVE_TEXT + res.strings.HELP_CARD_TEXT);
    }
  },
};
