//
// Handles the intent to process help
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    playgame.getContextualHelp(this.attributes['gameState'],
      this.event.request.locale,
      this.event.session.user.userId, (error, response) => {
      let speech = response;
      const res = require('../' + this.event.request.locale + '/resources');

      if (!speech) {
        speech = res.strings.HELP_GENERIC_HELP;
      }

      this.emit(':askWithCard', speech, speech, res.strings.HELP_CARD_TITLE, res.strings.HELP_CARD_TEXT);
    });
  },
};
