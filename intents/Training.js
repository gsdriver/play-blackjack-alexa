//
// Handles the intent to enable or disable training mode
//

'use strict';

const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleEnableIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    const game = this.attributes[this.attributes.currentGame];

    game.training = true;
    bjUtils.emitResponse(this.emit, this.event.request.locale, null,
          null, res.strings.TRAINING_ON, res.strings.TRAINING_REPROMPT);
  },
  handleDisableIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    const game = this.attributes[this.attributes.currentGame];

    game.training = undefined;
    bjUtils.emitResponse(this.emit, this.event.request.locale, null,
          null, res.strings.TRAINING_OFF, res.strings.TRAINING_REPROMPT);
  },
};
