//
// Handles the intent to read the rules of the game
//

'use strict';

const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');

    playgame.readRules(this.attributes['gameState'],
      this.event.request.locale,
      this.event.session.user.userId,
      (error, response, speech, reprompt, gameState) => {
      if (error) {
        this.emit(':ask', error, res.strings.ERROR_REPROMPT);
      } else if (response) {
        this.emit(':tellWithCard', response, res.strings.RULES_CARD_TITLE, response);
      } else {
        this.emit(':askWithCard', speech, reprompt, res.strings.RULES_CARD_TITLE, speech);
      }
    });
  },
};
