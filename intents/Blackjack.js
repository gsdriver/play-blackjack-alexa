'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    // First make sure we have an action
    const res = require('../' + this.event.request.locale + '/resources');
    const actionSlot = this.event.request.intent.slots.Action;

    if (!actionSlot) {
      bjUtils.emitResponse(this.emit, this.event.request.locale, null, null,
              res.strings.BLACKJACKINTENT_NO_ACTION, res.strings.ERROR_REPROMPT);
    } else if (!actionSlot.value) {
      bjUtils.emitResponse(this.emit, this.event.request.locale, null, null,
              res.strings.BLACKJACKINTENT_UNKNOWN_ACTION.replace('{0}', actionSlot.value),
              res.strings.ERROR_REPROMPT);
    } else {
      // Let's play this action
      const actionObj = {action: res.getBlackjackAction(actionSlot)};

      if (!actionObj.action) {
        // What did they specify?
        console.log('NULL ACTION: ' + JSON.stringify(this.event.request));
        actionObj.action = actionSlot.value;
      }

      playgame.playBlackjackAction(this.attributes,
          this.event.request.locale,
          this.event.session.user.userId,
          actionObj, (error, response, speech, reprompt) => {
          this.handler.state = bjUtils.getState(this.attributes);
        bjUtils.emitResponse(this.emit, this.event.request.locale,
          error, response, speech, reprompt);
      });
    }
  },
};
