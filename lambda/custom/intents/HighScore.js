//
// Reads the top high scores
//

'use strict';

const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    const res = require('../resources')(this.event.request.locale);

    bjUtils.readLeaderBoard(this.event.request.locale,
      this.event.session.user.userId, this.attributes, (highScores) => {
      const speech = highScores + '. ' + res.strings.HIGHSCORE_REPROMPT;
      bjUtils.emitResponse(this, null, null, speech, res.strings.HIGHSCORE_REPROMPT);
    });
  },
};
