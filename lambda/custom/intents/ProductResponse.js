//
// Handles response from Product purchase, upsell, or refund
//

'use strict';

const gameService = require('../GameService');
const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const request = require('request');

module.exports = {
  handleIntent: function() {
    // Record that we got a purchase response
    if (this.event.request.payload) {
      const params = {
        url: process.env.SERVICEURL + 'blackjack/purchaseResult',
        formData: {
          subject: 'Product response',
          body: this.event.request.name + ' was ' + this.event.request.payload.purchaseResult
              + ' by user ' + this.event.session.user.userId,
        },
      };
      request.post(params);
    }

    switch (this.event.request.name) {
      case 'Buy':
        console.log('Buy response');
        if (this.event.request.payload) {
          if (this.event.request.payload.purchaseResult == 'ACCEPTED') {
            // OK, flip them to Spanish 21
            selectedGame(this, 'spanish');
            return;
          } else if (this.event.request.payload.purchaseResult == 'ERROR') {
            if (this.attributes.prompts) {
              this.attributes.prompts.sellSpanish = undefined;
            }
          }
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
        // Don't delete their progress until the API tells us the refund was processed
        // Switch them instead to the standard game
        console.log('Cancel response');
        if (this.event.request.payload &&
            (this.event.request.payload.purchaseResult == 'ACCEPTED')) {
          this.attributes.paid.spanish.state = 'REFUND_PENDING';
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
  const res = require('../resources')(context.event.request.locale);
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
    context.handler.state = bjUtils.getState(context.attributes);
    bjUtils.emitResponse(context, null, null, launchSpeech, reprompt);
  });
}
