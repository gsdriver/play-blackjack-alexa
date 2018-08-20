//
// Handles purchasing of premium content
//

'use strict';

const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    const res = require('../resources')(this.event.request.locale);

    if (this.event.request.intent.slots && this.event.request.intent.slots.Product
      && this.event.request.intent.slots.Product.value) {
      // They specified a product - we'll assume it's Spanish 21
      // since that's all we support for now
      bjUtils.sendBuyResponse(this, {name: 'Buy', id: 'spanish'});
    } else {
      // Prompt them
      this.handler.state = 'CONFIRMPURCHASE';
      bjUtils.emitResponse(this, null, null,
        res.strings.PURCHASE_SPANISH, res.strings.PURCHASE_CONFIRM_REPROMPT);
    }
  },
  handleYesIntent: function() {
    // Great, let's do the purchase!
    bjUtils.sendBuyResponse(this, {name: 'Buy', id: 'spanish'});
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
