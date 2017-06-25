//
// Handles launching the skill
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const ads = require('../ads');

module.exports = {
  handleIntent: function() {
    playgame.readCurrentHand(this.attributes, this.event.request.locale, (speech, reprompt) => {
      const res = require('../' + this.event.request.locale + '/resources');
      let exitSpeech = '';

      // Tell them how much money they are leaving with
      exitSpeech = res.strings.EXIT_BANKROLL.replace('{0}', this.attributes['gameState'].bankroll) + ' ';
      ads.getAd(this.attributes, 'blackjack', this.event.request.locale, (adText) => {
        exitSpeech += (adText + ' ' + res.strings.EXIT_GOODBYE);
        bjUtils.prepareToSave(this.attributes, this.event.request.locale);
        this.emit(':tell', exitSpeech);
      });
    });
  },
};
