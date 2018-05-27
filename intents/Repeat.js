//
// Handles the intent to process repeating status
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    // Say the same thing we did last time
    if (this.attributes.temp.repeat) {
      const obj = this.attributes.temp.repeat;
      bjUtils.emitResponse(this, obj.error, obj.response, obj.speech, obj.reprompt, obj.cardTitle, obj.cardText);
      return;
    }

    playgame.readCurrentHand(this.attributes, this.event.request.locale, (hand, reprompt) => {
      const resources = require('../' + this.event.request.locale + '/resources');
      const game = this.attributes[this.attributes.currentGame];
      const speech = resources.strings.YOUR_BANKROLL_TEXT.replace('{0}', game.bankroll) + hand;
      bjUtils.emitResponse(this, null, null, speech, reprompt);
    });
  },
};
