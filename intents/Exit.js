//
// Handles launching the skill
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const ads = require('../ads');

module.exports = {
  handleIntent: function() {
    playgame.readCurrentHand(this.attributes['gameState'],
      this.event.request.locale,
      this.event.session.user.userId,
      (error, response, speech, reprompt, gameState) => {
      let exitSpeech = '';
      const res = require('../' + this.event.request.locale + '/resources');

      // Tell them how much money they are leaving with
      if (gameState) {
        exitSpeech = res.strings.EXIT_BANKROLL.replace('{0}', gameState.bankroll) + ' ';
      }

      ads.getAd(this.attributes, 'blackjack', this.event.request.locale, (adText) => {
        exitSpeech += (adText + ' ' + res.strings.EXIT_GOODBYE);
        bjUtils.prepareToSave(this.attributes, this.event.request.locale);
        this.emit(':tell', exitSpeech);
      });
    });
  },
};
