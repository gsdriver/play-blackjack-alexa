//
// Reads the top high scores
//

'use strict';

const bjUtils = require('../BlackjackUtils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest')
      && (request.intent.name === 'HighScoreIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    return new Promise((resolve, reject) => {
      bjUtils.readLeaderBoard(event.request.locale,
        event.session.user.userId, attributes, (highScores) => {
        const speech = highScores + '. ' + res.strings.HIGHSCORE_REPROMPT;
        const response = handlerInput.responseBuilder
          .speak(speech)
          .reprompt(res.strings.HIGHSCORE_REPROMPT)
          .getResponse();
        resolve(response);
      });
    });
  },
};
