'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    // First make sure we have an action
    const actionSlot = this.event.request.intent.slots.Action;
    let error;

    if (!actionSlot) {
      error = 'I\'m sorry, I didn\'t catch that action. Please say what you want to do on this hand like hit or stand. What else can I help with?';
      this.emit(':ask', error, 'What else can I help with?');
    } else if (!actionSlot.value) {
      error = 'I\'m sorry, I don\'t understand how to ' + actionSlot.value + '. Please provide an action like hit or stand. What else can I help with?';
      this.emit(':ask', error, 'What else can I help with?');
    } else {
      // Let's play this action
      playgame.playBlackjackAction(this.event.session.user.userId,
          getBlackjackAction(actionSlot), 0,
          (error, response, speech, reprompt, gameState) => {
        bjUtils.emitResponse(this.emit, error, response, speech, reprompt);
      });
    }
  },
};

//
// Maps what the user said to an internal action
//

function getBlackjackAction(actionSlot) {
  const actionMapping = {'hit': 'hit', 'take a hit': 'hit', 'hit me': 'hit', 'take one': 'hit',
    'stand': 'stand', 'stay': 'stand', 'done': 'stand',
    'surrender': 'surrender', 'give up': 'surrender',
    'double': 'double', 'double down': 'double',
    'split': 'split',
    'shuffle': 'shuffle', 'shuffle deck': 'shuffle',
    'reset': 'resetbankroll', 'reset bankroll': 'resetbankroll',
    'bet': 'bet', 'deal': 'bet'};
  const action = actionMapping[actionSlot.value.toLowerCase()];

  // Look it up in lowercase
  return (action == undefined) ? null : action;
}
