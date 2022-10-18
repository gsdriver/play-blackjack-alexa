//
// Saves attributes at the end of the session
//

'use strict';

const upsell = require('../UpsellEngine');

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (request.type === 'SessionEndedRequest');
  },
  handle: function(handlerInput) {
    console.log('End session - saving attributes');
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    // Clear and persist attributes
    return upsell.saveSession(handlerInput)
    .then(() => {
      attributes.temp = undefined;
      handlerInput.attributesManager.setPersistentAttributes(attributes);
      handlerInput.attributesManager.savePersistentAttributes();
    });
  },
};
