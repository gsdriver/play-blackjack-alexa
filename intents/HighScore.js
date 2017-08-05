//
// Reads the top high scores
//

'use strict';

const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');

    bjUtils.readLeaderBoard(this.event.request.locale, this.attributes, (highScores) => {
      const speech = highScores + '. ' + res.strings.HIGHSCORE_REPROMPT;
      bjUtils.emitResponse(this.emit, this.event.request.locale, null,
          null, speech, res.strings.HIGHSCORE_REPROMPT);
    });
  },
};