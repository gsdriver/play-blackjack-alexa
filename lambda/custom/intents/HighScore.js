//
// Reads the top high scores
//

'use strict';

const bjUtils = require('../BlackjackUtils');
const speechUtils = require('alexa-speech-utils')();

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
    let speech = '';

    return new Promise((resolve, reject) => {
      return bjUtils.getUserName(handlerInput).then((name) => {
        if (name === false) {
          // Let them know they can provide a name
          speech += res.strings.HIGHSCORE_GIVENAME;
          handlerInput.responseBuilder
            .withAskForPermissionsConsentCard(['alexa::profile:given_name:read']);
        } else if (name) {
          speech += name + '<break time="200ms"/>';
        }
        return;
      }).then(() => {
        bjUtils.readLeaderBoard(event.request.locale,
          event.session.user.userId, attributes, (highScores) => {
          const scoreType = (attributes.currentGame === 'tournament') ? 'bankroll' : 'achievement';

          if (!highScores) {
            // No scores to read
            speech = res.strings.LEADER_NO_SCORES;
          } else {
            if (!highScores.count || !highScores.top) {
              // Something went wrong
              speech = res.strings.LEADER_NO_SCORES;
            } else {
              if (highScores.rank) {
                speech += ((scoreType === 'bankroll') ? res.strings.LEADER_BANKROLL_RANKING : res.strings.LEADER_RANKING)
                  .replace('{0}', highScores.score)
                  .replace('{1}', highScores.rank)
                  .replace('{2}', roundPlayers(event.request.locale, highScores.count));
              }

              // And what is the leader board?
              let topScores = highScores.top;
              if (scoreType === 'bankroll') {
                topScores = topScores.map((x) => {
                  if (x.name) {
                    return res.strings.LEADER_BANKROLL_FORMAT_NAME
                      .replace('{0}', x.score)
                      .replace('{1}', x.name);
                  } else {
                    return res.strings.LEADER_BANKROLL_FORMAT
                      .replace('{0}', x.score);
                  }
                });
              } else {
                topScores = topScores.map((x) => {
                  if (x.name) {
                    return res.strings.LEADER_ACHIEVEMENT_FORMAT_NAME
                      .replace('{0}', x.score)
                      .replace('{1}', x.name);
                  } else {
                    return res.strings.LEADER_ACHIEVEMENT_FORMAT
                      .replace('{0}', x.score);
                  }
                });
              }

              speech += ((scoreType === 'bankroll') ? res.strings.LEADER_TOP_BANKROLLS
                  : res.strings.LEADER_TOP_SCORES).replace('{0}', topScores.length);
              speech += speechUtils.and(topScores, {locale: event.request.locale, pause: '300ms'});
            }
          }

          speech += '. ' + res.strings.HIGHSCORE_REPROMPT;
          const response = handlerInput.responseBuilder
            .speak(speech)
            .reprompt(res.strings.HIGHSCORE_REPROMPT)
            .getResponse();
          resolve(response);
        });
      });
    });
  },
};

function roundPlayers(locale, playerCount) {
  const res = require('../resources')(locale);

  if (playerCount < 200) {
    return playerCount;
  } else {
    // "Over" to the nearest hundred
    return res.strings.MORE_THAN_PLAYERS.replace('{0}', 100 * Math.floor(playerCount / 100));
  }
}
