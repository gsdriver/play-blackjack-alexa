//
// Handles a reset, which can only be done if you are at a state to start a new hand
//

'use strict';

const gameService = require('../GameService');
const bjUtils = require('../BlackjackUtils');
const playgame = require('../PlayGame');

module.exports = {
  handleIntent: function() {
    // We will ask them if they want to reset
    const res = require('../resources')(this.event.request.locale);
    let speech;
    let reprompt;
    const game = this.attributes[this.attributes.currentGame];

    if (game.canReset) {
      speech = res.strings.RESET_CONFIRM;
      reprompt = res.strings.RESET_CONFIRM;
      this.handler.state = 'CONFIRMRESET';
    } else {
      speech = res.strings.TOURNAMENT_NORESET;
      reprompt = res.strings.TOURNAMENT_INVALIDACTION_REPROMPT;
    }

    bjUtils.emitResponse(this, null, null, speech, reprompt);
  },
  handleYesReset: function() {
    const res = require('../resources')(this.event.request.locale);

    // Confirmed - let's reset but preserve the timestamp
    const timestamp = this.attributes[this.attributes.currentGame].timestamp;
    gameService.initializeGame(this.attributes, this.event.session.user.userId);
    this.attributes[this.attributes.currentGame].timestamp = timestamp;
    this.handler.state = 'NEWGAME';
    bjUtils.emitResponse(this, null, null,
            res.strings.RESET_COMPLETED, res.strings.RESET_REPROMPT);
  },
  handleNoReset: function() {
    // Nope, they are not going to reset - so go back to start a new game
    const res = require('../resources')(this.event.request.locale);

    this.handler.state = 'NEWGAME';
    bjUtils.emitResponse(this, null, null,
            res.strings.RESET_ABORTED, res.strings.RESET_REPROMPT);
  },
  handleRepeat: function() {
    // Just repeat the reset instruction
    const res = require('../resources')(this.event.request.locale);
    const reprompt = playgame.getContextualHelp(this);
    const speech = res.strings.RESET_CONFIRM + ' ' + reprompt;

    bjUtils.emitResponse(this, null, null, speech, reprompt);
  },
};
