//
// Handles the intent to take or ignore a suggestion in training mode
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleYesIntent: function() {
    // OK, play what was suggested
    const game = this.attributes[this.attributes.currentGame];
    const actionObj = {action: game.suggestion.suggestion};

    // Keep track of how often they took a suggestion
    if (!this.attributes.tookSuggestion) {
      this.attributes.tookSuggestion = {};
    }
    this.attributes.tookSuggestion.yes = (this.attributes.tookSuggestion.yes + 1) || 1;

    playgame.playBlackjackAction(this.attributes,
      this.event.request.locale,
      this.event.session.user.userId,
      actionObj, (error, response, speech, reprompt) => {
        this.handler.state = bjUtils.getState(this.attributes);
        bjUtils.emitResponse(this, error, response, speech, reprompt);
    });
  },
  handleNoIntent: function() {
    // Fine, ignore what I said
    const game = this.attributes[this.attributes.currentGame];
    const actionObj = {action: game.suggestion.player};

    // Keep track of how often they didn't take a suggestion
    if (!this.attributes.tookSuggestion) {
      this.attributes.tookSuggestion = {};
    }
    this.attributes.tookSuggestion.no = (this.attributes.tookSuggestion.no + 1) || 1;

    playgame.playBlackjackAction(this.attributes,
      this.event.request.locale,
      this.event.session.user.userId,
      actionObj, (error, response, speech, reprompt) => {
        this.handler.state = bjUtils.getState(this.attributes);
        bjUtils.emitResponse(this, error, response, speech, reprompt);
    });
  },
};
