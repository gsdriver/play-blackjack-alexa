//
// Handles "unhandled" intents - often because the user is trying to
// do an action that isn't allowed at this point in the flow
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    // Echo back the action that we heard, why this isn't valid at this time,
    // and what the possible actions are for them to say
    const res = require('../' + this.event.request.locale + '/resources');
    let speech = res.buildUnhandledResponse(this.event.request.intent, this.handler.state);
    const reprompt = playgame.getContextualHelp(this);

    speech += reprompt;
    bjUtils.emitResponse(this, null, null, speech, reprompt);
  },
};
