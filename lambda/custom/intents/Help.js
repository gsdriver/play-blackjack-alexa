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
      tournament.readHelp(this, this.attributes);
    } else {
      const res = require('../' + this.event.request.locale + '/resources');
      const game = this.attributes[this.attributes.currentGame];
      let speech = playgame.getContextualHelp(this, !this.attributes.bot);
      if (!speech) {
        speech = res.strings.HELP_GENERIC_HELP;
      }
      speech = res.strings.HELP_ACHIEVEMENT_POINTS + speech;

      let cardContent = '';
      if (game.progressive) {
        cardContent += res.strings.HELP_CARD_PROGRESSIVE_TEXT;
      }
      if (game.superBonus) {
        cardContent += res.strings.HELP_CARD_SUPERBONUS;
      }
      cardContent += res.strings.HELP_ACHIEVEMENT_CARD_TEXT;
      cardContent += res.strings.HELP_CARD_TEXT;
      bjUtils.emitResponse(this, null, null,
          speech, speech, res.strings.HELP_CARD_TITLE,
          cardContent);
    }
  },
};
