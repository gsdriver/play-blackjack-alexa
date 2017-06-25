//
// Handles a reset, which can only be done if you are at a state to start a new hand
//

'use strict';

const gameService = require('../GameService');

module.exports = {
  handleIntent: function() {
    // We will ask them if they want to reset
    const res = require('../' + this.event.request.locale + '/resources');
    const speech = res.strings.RESET_CONFIRM;

    this.handler.state = 'CONFIRMRESET';
    this.emit(':ask', speech, speech);
  },
  handleYesReset: function() {
    const res = require('../' + this.event.request.locale + '/resources');

    // Confirmed - let's reset
    gameService.initializeGame(this.attributes);
    this.handler.state = 'NEWGAME';
    this.emit(':ask', res.strings.RESET_COMPLETED, res.strings.RESET_REPROMPT);
  },
  handleNoReset: function() {
    // Nope, they are not going to reset - so go back to start a new game
    const res = require('../' + this.event.request.locale + '/resources');

    this.handler.state = 'NEWGAME';
    this.emit(':ask', res.strings.RESET_ABORTED, res.strings.RESET_REPROMPT);
  },
};
