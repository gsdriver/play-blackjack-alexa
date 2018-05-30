//
// Handles purchasing of premium content
//

'use strict';

const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');

    // We only offer Spanish 21 - let's see if they already have it
    if (this.event.request.intent.slots && this.event.request.intent.slots.Product
      && this.event.request.intent.slots.Product.value) {
      // They specified a product - we'll assume it's Spanish 21
      sendBuyResponse(this, 'spanish');
    } else if (this.attributes.paid && this.attributes.paid.spanish) {
      // We only offer Spanish 21, and they already have it
      bjUtils.emitResponse(this, null, null,
        res.strings.PURCHASE_ONLY_SPANISH, res.strings.PURCHASE_REPROMPT);
    } else {
      // Prompt them
      this.handler.state = 'CONFIRMPURCHASE';
      bjUtils.emitResponse(this, null, null,
        res.strings.PURCHASE_SPANISH, res.strings.PURCHASE_CONFIRM_REPROMPT);
    }
  },
  handleYesIntent: function() {
    // Great, let's do the purchase!
    sendBuyResponse(this, 'spanish');
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

// We need to hand-roll the buy response
function sendBuyResponse(context, productName) {
  const res = require('../' + context.event.request.locale + '/resources');
  let productId;
  context.attributes.inSkillProducts.forEach((product) => {
    if (product.referenceName == productName) {
      productId = product.productId;
    }
  });

  if (productId) {
    bjUtils.emitResponse(context, null, null, null, null, null, null, productId);
  } else {
    // Something went wrong
    bjUtils.emitResponse(context, null, null,
        res.strings.PURCHASE_PRODUCT_NOT_FOUND, res.strings.PURCHASE_REPROMPT);
  }
}
