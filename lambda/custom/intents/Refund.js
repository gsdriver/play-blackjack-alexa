//
// Handles refund of premium content
//

'use strict';

const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    const res = require('../resources')(this.event.request.locale);

    // We only offer Spanish 21 so let's kick into that flow
    this.handler.state = 'CONFIRMREFUND';
    bjUtils.emitResponse(this, null, null, res.strings.REFUND_SPANISH,
      res.strings.REFUND_SPANISH_REPROMPT);
  },
  handleYesIntent: function() {
    // Great, let's do the purchase!
    bjUtils.sendBuyResponse(this, {name: 'Cancel', id: 'spanish'});
  },
  handleNoIntent: function() {
    // OK, put them back to where they were and repeat
    this.handler.state = bjUtils.getState(this.attributes);
    this.emit('AMAZON.RepeatIntent');
  },
  handleRepeatIntent: function() {
    // Kick them out of purchase flow and repeat
    this.handler.state = bjUtils.getState(this.attributes);
    this.emit('AMAZON.RepeatIntent');
  },
};
