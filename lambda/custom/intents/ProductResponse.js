//
// Handles response from Product purchase, upsell, or refund
//

'use strict';

const gameService = require('../GameService');
const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    switch (this.event.request.name) {
      case 'Buy':
        console.log('Buy response');
        if (this.event.request.payload &&
            (this.event.request.payload.purchaseResult == 'ACCEPTED')) {
          // OK, flip them to Spanish 21
          selectedGame(this, 'spanish');
          return;
        }
        break;
      case 'Upsell':
        // If they didn't take the upsell offer, don't offer it again this session
        console.log('Upsell response');
        this.attributes.temp.noUpsell = true;
        if (this.event.request.payload &&
          ((this.event.request.payload.purchaseResult == 'ACCEPTED') ||
           (this.event.request.payload.purchaseResult == 'ALREADY_PURCHASED'))) {
          // They either purchased or already had this game, so drop them into it
          selectedGame(this, 'spanish');
          return;
        }
        if (this.event.request.token == 'SELECTGAME') {
          // Kick them back into SelectGame mode
          console.log('Selecting game');
          this.handler.state = 'SELECTGAME';
          this.emitWithState('LaunchRequest');
          return;
        }
        break;
      case 'Cancel':
        // If they accepted the cancel, delete their progress on spanish
        // It may take time for them to process the refund - don't check API
        // (this is undone with a new purchase)
        console.log('Cancel response');
        if (this.event.request.payload &&
            (this.event.request.payload.purchaseResult == 'ACCEPTED')) {
          this.attributes.spanish = undefined;
          selectedGame(this, 'standard');
          return;
        }
        break;
      default:
        // Unknown
        console.log('Unknown product response');
        break;
    }

    // And forward to Launch
    this.emit('LaunchRequest');
  },
};

function selectedGame(context, gameToPlay) {
  const res = require('../' + context.event.request.locale + '/resources');
  const attributes = context.attributes;

  attributes.currentGame = gameToPlay;
  if (!attributes[attributes.currentGame]) {
    gameService.initializeGame(attributes.currentGame, attributes,
        context.event.session.user.userId);
  }

  const launchWelcome = JSON.parse(res.strings.LAUNCH_WELCOME);
  let launchSpeech = launchWelcome[context.attributes.currentGame];
  launchSpeech += res.strings.LAUNCH_START_GAME;
  playgame.readCurrentHand(context.attributes, context.event.request.locale, (speech, reprompt) => {
    bjUtils.emitResponse(context, null, null, launchSpeech, reprompt);
  });
}
