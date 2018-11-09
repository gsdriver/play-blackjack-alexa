//
// Handles the betting intent
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    return ((game.possibleActions.indexOf('bet') >= 0)
      && !attributes.temp.joinTournament
      && !attributes.temp.selectingGame
      && (request.type === 'IntentRequest')
      && ((request.intent.name === 'BettingIntent')
        || (request.intent.name === 'AMAZON.YesIntent')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let amount = 0;
    const game = attributes[attributes.currentGame];
    const now = Date.now();
    const res = require('../resources')(event.request.locale);

    // If the last hand was a 5 card 21, upsell them to Spanish 21
    if (attributes.temp.long21) {
      attributes.temp.long21 = undefined;
      if (attributes.paid && attributes.paid.spanish &&
      (attributes.paid.spanish.state == 'AVAILABLE') &&
      (!attributes.prompts.long21 || ((now - attributes.prompts.long21) > 2*24*60*60*1000))) {
        attributes.prompts.long21 = now;
        const directive = {
          'type': 'Connections.SendRequest',
          'name': 'Upsell',
          'payload': {
            'InSkillProduct': {
              productId: attributes.paid.spanish.productId,
            },
            'upsellMessage': res.strings.LONG21_SELL_SPANISH,
          },
          'token': 'game.spanish.betting',
        };

        return handlerInput.responseBuilder
          .addDirective(directive)
          .withShouldEndSession(true)
          .getResponse();
      }
    }

    // Take the bet
    return new Promise((resolve, reject) => {
      amount = getBet(event, attributes);
      const action = {action: 'bet', amount: amount, firsthand: attributes.temp.firsthand};
      playgame.playBlackjackAction(attributes, event.request.locale,
        event.session.user.userId, action,
        (error, response, speech, reprompt) => {
        if (!error) {
          attributes.temp.firsthand = undefined;
          if (game.timestamp) {
            const lastPlay = new Date(game.timestamp);
            const now = new Date(Date.now());
            game.firstDailyHand = (lastPlay.getDate() != now.getDate());
          } else {
            game.firstDailyHand = true;
          }
          game.timestamp = Date.now();
          game.hands = (game.hands) ? (game.hands + 1) : 1;
        }

        resolve(bjUtils.getResponse(handlerInput, error, response, speech, reprompt));
      });
    });
  },
};

function getBet(event, attributes) {
  // The bet amount is optional - if not present we will use
  // a default value of either the last bet amount or $100
  let amount;
  const DEFAULT_BET = 100;
  const game = attributes[attributes.currentGame];
  const amountSlot = (event.request.intent && event.request.intent.slots
      && event.request.intent.slots.Amount);

  if (amountSlot && amountSlot.value) {
    // If the bet amount isn't an integer, we'll use the default value (1 unit)
    amount = parseInt(amountSlot.value);
  } else if (game.lastBet) {
    amount = game.lastBet;
  } else {
    amount = DEFAULT_BET;
  }

  // Let's tweak the amount for them
  if (isNaN(amount) || (amount == 0)) {
    amount = (game.lastBet) ? game.lastBet : DEFAULT_BET;
  } else if (amount < game.rules.minBet) {
    amount = game.rules.minBet;
  } else if (amount > game.rules.maxBet) {
    amount = game.rules.maxBet;
  }
  if (amount > game.bankroll) {
    amount = game.bankroll;
  }

  return amount;
}
