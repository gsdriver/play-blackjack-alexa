//
// Handles launching the skill
//

'use strict';

const ads = require('../ads');
const tournament = require('../tournament');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    const game = this.attributes[this.attributes.currentGame];
    let exitSpeech = '';

    // Tell them how much money they are leaving with
    exitSpeech = res.strings.EXIT_BANKROLL.replace('{0}', game.bankroll) + ' ';
    if (this.attributes.bot) {
      bjUtils.emitResponse(this, null, exitSpeech);
    } else {
      ads.getAd(this.attributes, 'blackjack', this.event.request.locale, (adText) => {
        exitSpeech += tournament.getReminderText(this.event.request.locale);
        exitSpeech += (adText + ' ' + res.strings.EXIT_GOODBYE);
        bjUtils.emitResponse(this, null, exitSpeech);
      });
    }
  },
};
