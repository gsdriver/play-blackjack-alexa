//
// Handles launching the skill
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const gameService = require('../GameService');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    let launchSpeech;
    let linQ;

    // Since we aren't in a tournament, make sure current hand isn't set to one
    if (this.attributes.currentGame === 'tournament') {
      this.attributes.currentGame = 'standard';
    }
    const game = this.attributes[this.attributes.currentGame];

    // Note that this is first hand (so we will say more on the first bet)
    if (this.attributes.firstName) {
      if (game.progressiveJackpot) {
        launchSpeech = res.strings.LAUNCH_WELCOME_NAME
            .replace('{0}', this.attributes.firstName)
            .replace('{1}', game.progressiveJackpot);
      } else {
        launchSpeech = res.strings.LAUNCH_WELCOME_NAME_NOJACKPOT
            .replace('{0}', this.attributes.firstName);
      }
    } else {
      if (game.progressiveJackpot) {
        launchSpeech = res.strings.LAUNCH_WELCOME.replace('{0}', game.progressiveJackpot);
      } else {
        launchSpeech = res.strings.LAUNCH_WELCOME_NOJACKPOT;
      }
    }
    this.attributes.readProgressive = true;

    if (this.attributes.tournamentResult) {
      launchSpeech = this.attributes.tournamentResult + launchSpeech;
      this.attributes.tournamentResult = undefined;
    }

    // Figure out what the current game state is - give them option to reset
    playgame.readCurrentHand(this.attributes, this.event.request.locale, (speech, reprompt) => {
      // Tell them how much money they are starting with
      if (game.activePlayer === 'player') {
        launchSpeech += speech;
      } else {
        const options = [res.strings.LAUNCH_START_GAME];

        if (game.possibleActions && (game.possibleActions.indexOf('sidebet') > 0)) {
          options.push(res.strings.LAUNCH_START_PLACE_SIDEBET);
        }
        if (game.possibleActions && (game.possibleActions.indexOf('nosidebet') > 0)) {
          options.push(res.strings.LAUNCH_START_REMOVE_SIDEBET);
        }
        if (!gameService.isDefaultGame(this.attributes)) {
          options.push(res.strings.LAUNCH_START_RESET);
        }
        options.push(res.strings.LAUNCH_START_HIGH_SCORES);

        launchSpeech += bjUtils.readBankroll(this.event.request.locale, this.attributes);
        launchSpeech += speechUtils.or(options, {pause: '300ms'});
      }

      // Finally if they aren't registered users, tell them about that option
      if (!this.event.session.user.accessToken) {
        launchSpeech += res.strings.LAUNCH_REGISTER;
        linQ = launchSpeech;
      }

      this.handler.state = bjUtils.getState(this.attributes);
      if (linQ) {
        bjUtils.emitResponse(this.emit, this.event.request.locale, null, null,
              null, null, null, null, linQ);
      } else {
        bjUtils.emitResponse(this.emit, this.event.request.locale, null, null,
              launchSpeech, reprompt);
      }
    });
  },
};
