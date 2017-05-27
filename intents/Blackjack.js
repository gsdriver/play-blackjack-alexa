'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    // First make sure we have an action
    const res = require('../' + this.event.request.locale + '/resources');
    const actionSlot = this.event.request.intent.slots.Action;

    if (!actionSlot) {
      this.emit(':ask', res.strings.BLACKJACKINTENT_NO_ACTION, res.strings.ERROR_REPROMPT);
    } else if (!actionSlot.value) {
      this.emit(':ask', res.strings.BLACKJACKINTENT_UNKNOWN_ACTION.replace('{0}', actionSlot.value), res.strings.ERROR_REPROMPT);
    } else {
      // Let's play this action
      playgame.playBlackjackAction(this.attributes['gameState'],
          this.event.request.locale,
          this.event.session.user.userId,
          {action: res.getBlackjackAction(actionSlot)},
          (error, response, speech, reprompt, gameState) => {
        this.attributes['gameState'] = gameState;
        if (gameState) {
          this.handler.state = bjUtils.getState(gameState);
        }
        bjUtils.emitResponse(this.emit, this.event.request.locale,
          error, response, speech, reprompt);
      });
    }
  },
};
