//
// Handles the intent to enable or disable training mode
//

'use strict';

const bjUtils = require('../BlackjackUtils');
const playgame = require('../PlayGame');

module.exports = {
  handleEnableIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    const reprompt = playgame.getContextualHelp(this.attributes, this.event.request.locale);
    const speech = res.strings.TRAINING_ON + reprompt;
    const game = this.attributes[this.attributes.currentGame];

    game.training = true;
    bjUtils.emitResponse(this.emit, this.event.request.locale, null,
          null, speech, reprompt);
  },
  handleDisableIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    const reprompt = playgame.getContextualHelp(this.attributes, this.event.request.locale);
    const speech = res.strings.TRAINING_OFF + reprompt;
    const game = this.attributes[this.attributes.currentGame];

    game.training = undefined;
    bjUtils.emitResponse(this.emit, this.event.request.locale, null,
          null, speech, reprompt);
  },
};
