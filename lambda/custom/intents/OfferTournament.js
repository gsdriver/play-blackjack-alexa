//
// Handles whether to join (or pass) on a tounrmanet
//

'use strict';

const tournament = require('../tournament');

module.exports = {
  canHandle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return (handlerInput.requestEnvelope.session.new &&
      tournament.canEnterTournament(attributes));
  },
  handle: function(handlerInput) {
    return new Promise((resolve, reject) => {
      attributes.temp.joinTournament = true;
      tournament.promptToEnter(event.request.locale,
          attributes, (speech, reprompt) => {
        const response = handlerInput.responseBuilder
          .speak(attributes.prependLaunch + speech)
          .reprompt(reprompt)
          .getResponse();
        resolve(response);
      });
    });
  },
};
