'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    // First make sure we have an action
    const res = require('../resources')(this.event.request.locale);
    const actionSlot = this.event.request.intent.slots.Action;

    if (!actionSlot) {
      bjUtils.emitResponse(this, null, null,
              res.strings.BLACKJACKINTENT_NO_ACTION, res.strings.ERROR_REPROMPT);
    } else if (!actionSlot.value) {
      bjUtils.emitResponse(this, null, null,
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
        bjUtils.emitResponse(this, error, response, speech, reprompt);
      });
    }
  },
  handleYesIntent: function() {
    // Valid if there is only one option - otherwise, repeat and ask for clarification
    const game = this.attributes[this.attributes.currentGame];

    if (game.possibleActions && (game.possibleActions.length == 1)) {
      // Play this action
      const actionObj = {action: game.possibleActions[0]};
      playgame.playBlackjackAction(this.attributes,
          this.event.request.locale,
          this.event.session.user.userId,
          actionObj, (error, response, speech, reprompt) => {
          this.handler.state = bjUtils.getState(this.attributes);
        bjUtils.emitResponse(this, error, response, speech, reprompt);
      });
    } else {
      // Ambiguous - punt to unhandled
      this.emit('Unhandled');
    }
  },
};
