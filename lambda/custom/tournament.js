//
// All things tournament related go into this file
//
// Tournaments are controlled by a global setting (whether a tournament is active)
//

'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const bjUtils = require('./BlackjackUtils');
const moment = require('moment-timezone');

module.exports = {
  getTournamentComplete: function(locale, attributes) {
    // If the user is in a tournament, we check to see if that tournament
    // is complete.  If so, we set certain attributes and return a result
    // string via the callback for the user
    const res = require('./resources')(locale);
    const game = attributes['tournament'];

    if (game) {
      // You are in a tournament - let's see if it's completed
      return s3.getObject({Bucket: 'garrett-alexa-usage', Key: 'BlackjackTournamentResults.txt'}).promise()
      .then((data) => {
        // Yeah, I can do a binary search (this is sorted), but straight search for now
        const results = JSON.parse(data.Body.toString('ascii'));
        let i;
        let result;
        let speech = '';

        // Go through the results and find one that closed AFTER our last play
        for (i = 0; i < (results ? results.length : 0); i++) {
          if (results[i].timestamp > game.timestamp) {
            // This is the one
            result = results[i];
            break;
          }
        }

        if (result) {
          if (game.bankroll >= result.highScore) {
            // Congratulations, you won!
            if (!attributes.achievements) {
              attributes.achievements = {trophy: 1};
            } else {
              attributes.achievements.trophy = (attributes.achievements.trophy)
                  ? (attributes.achievements.trophy + 1) : 1;
            }
            speech = res.strings.TOURNAMENT_WINNER.replace('{0}', game.bankroll);
          } else {
            speech = res.strings.TOURNAMENT_LOSER.replace('{0}', result.highScore).replace('{1}', game.bankroll);
          }
          attributes.currentGame = 'standard';
          attributes['tournament'] = undefined;
        }

        return speech;
      }).catch((err) => {
        // Nothing to report
        console.log(err, err.stack);
        return '';
      });
    } else {
      // No-op, you weren't playing
      return Promise.resolve('');
    }
  },
  canEnterTournament: function(attributes) {
    // You can enter a tournament if one is active and you haven't ended one
    const game = attributes['tournament'];

    return (isTournamentActive() &&
          !(game && ((game.bankroll === 0) || game.finished)));
  },
  getReminderText: function(locale) {
    const res = require('./resources')(locale);
    let reminder = '';

    if (!isTournamentActive() && process.env.TOURNAMENT && process.env.TOURNAMENT_REMINDER) {
      reminder = res.strings.TOURNAMENT_REMINDER;
    }

    return reminder;
  },
  promptToEnter: function(event, attributes, callback) {
    // If there is an active tournament, we need to either inform them
    // or if they are participating in the tournament, allow them to leave
    const res = require('./resources')(event.request.locale);
    let reprompt;

    let format;
    if (attributes['tournament']) {
      format = res.strings.TOURNAMENT_LAUNCH_WELCOMEBACK;
      reprompt = res.strings.TOURNAMENT_LAUNCH_WELCOMEBACK_REPROMPT;
    } else {
      format = res.strings.TOURNAMENT_LAUNCH_INFORM;
      reprompt = res.strings.TOURNAMENT_LAUNCH_INFORM_REPROMPT;
    }

    bjUtils.getWelcome(event, attributes, format, (speech) => {
      callback(speech, reprompt);
    });
  },
  outOfMoney: function(locale, attributes, speech) {
    const res = require('./resources')(locale);
    let response = speech;

    response += res.strings.TOURNAMENT_BANKRUPT;
    attributes['tournament'].finished = true;
    return response;
  },
  outOfHands: function(locale, attributes, speech, callback) {
    const res = require('./resources')(locale);
    let response = speech;

    response += res.strings.TOURNAMENT_OUTOFHANDS;
    attributes['tournament'].finished = true;
    return response;
  },
  readHelp: function(handlerInput, callback) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);
    const locale = event.request.locale;
    let speech;
    const game = attributes['tournament'];
    const reprompt = res.strings.ERROR_REPROMPT;

    speech = res.strings.TOURNAMENT_HELP;
    speech += res.strings.TOURNAMENT_BANKROLL.replace('{0}', game.bankroll).replace('{1}', game.maxHands - (game.hands ? game.hands : 0));
    module.exports.readStanding(locale, attributes, (standing) => {
      speech += standing;
      speech += reprompt;
      callback(handlerInput.responseBuilder
         .speak(speech)
         .reprompt(speech)
         .withSimpleCard(res.strings.HELP_CARD_TITLE,
            res.strings.TOURNAMENT_HELP_CARD_TEXT.replace('{0}', game.maxHands))
         .getResponse());
    });
  },
  readStanding: function(locale, attributes, callback) {
    const res = require('./resources')(locale);
    const game = attributes['tournament'];

    if (!game.hands) {
      // No need to say anything
      callback('');
    } else {
      bjUtils.getHighScore(attributes, (err, high) => {
        // Let them know the current high score
        let speech = '';

        if (high) {
          if (game.bankroll >= high) {
            speech = res.strings.TOURNAMENT_STANDING_FIRST;
          } else {
            speech = res.strings.TOURNAMENT_STANDING_TOGO.replace('{0}', high);
          }
        }

        callback(speech);
      });
    }
  },
};

//
// Internal functions
//
function isTournamentActive() {
  let active = false;

  if (process.env.TOURNAMENT) {
    // Active on Tuesdays PST (Day=2)
    // We actually start the tournament at 9 PM Monday PST
    // for our East Coast friends
    const tzOffset = moment.tz.zone('America/Los_Angeles').utcOffset(Date.now());
    const d = new Date();
    d.setMinutes(d.getMinutes() - tzOffset);

    active = (((d.getDay() == 1) && (d.getHours() >= 21))
            || (d.getDay() == 2));
  }

  return active;
}

