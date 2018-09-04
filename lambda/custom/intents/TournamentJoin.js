//
// Handles whether to join (or pass) on a tounrmanet
//

'use strict';

const tournament = require('../tournament');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    // Can only do while waiting to join a tournament
    return (attributes.temp.joinTournament &&
      (request.type === 'IntentRequest') &&
      ((request.intent.name === 'AMAZON.YesIntent')));
  },
  handle: function(handlerInput) {
    return new Promise((resolve, reject) => {
      tournament.joinTournament(handlerInput, (speech, reprompt) => {
        const response = handlerInput.responseBuilder
          .speak(speech)
          .reprompt(reprompt)
          .getResponse();
        resolve(response);
      });
    });
  },
};
