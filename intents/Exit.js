//
// Handles launching the skill
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

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

      // Ad if they haven't (ignore if NOADS environment variable is set)
      if (!process.env.NOADS && !this.attributes['adStamp']) {
        // Keep track of when we played the ad
        this.attributes['adStamp'] = Date.now();
        exitSpeech += res.strings.EXIT_AD;
      }
      exitSpeech += res.strings.EXIT_GOODBYE;

      // Get ready to save
      bjUtils.prepareToSave(this.attributes, this.event.request.locale);
      this.emit(':tell', exitSpeech);
    });
  },
};
