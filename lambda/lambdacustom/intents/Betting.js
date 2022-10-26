//
// Handles the betting intent
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const upsell = require('../UpsellEngine');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    if ((game.possibleActions.indexOf('bet') >= 0)
      && !attributes.temp.joinTournament
      && !attributes.temp.selectingGame) {
      if ((request.type === 'IntentRequest')
        && ((request.intent.name === 'BettingIntent')
        || (request.intent.name === 'AMAZON.YesIntent'))) {
        return true;
      }

      // Also OK if this was a BlackjackIntent mapping to bet
      if ((request.type === 'IntentRequest')
        && (request.intent.name === 'BlackjackIntent')
        && request.intent.slots
        && request.intent.slots.Action
        && request.intent.slots.Action.value) {
        const res = require('../resources')(request.locale);
        return (res.getBlackjackAction(request.intent.slots.Action) === 'bet');
      }
    }

    return false;
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let amount = 0;
    const game = attributes[attributes.currentGame];
    let goodResponse = attributes.temp.goodResponse ? attributes.temp.goodResponse.slice() : undefined;

    attributes.temp.goodResponse = undefined;

    // If the last hand was a 5 card 21, upsell them to Spanish 21
    if (attributes.temp.long21) {
      attributes.temp.long21 = undefined;
      if (!attributes.temp.noUpsellBetting) {
        const directive = upsell.getUpsell(attributes, 'long21');
        if (directive) {
          directive.token = 'game.' + directive.token + '.betting';
          return handlerInput.responseBuilder
            .addDirective(directive)
            .withShouldEndSession(true)
            .getResponse();
        }
      }
    }

    // If the last hand was a hard hand and they played it wrong, upsell them
    if (game.hardSuggestion && (game.hardSuggestion !== 'none')) {
      if (!attributes.temp.noUpsellBetting) {
        const directive = upsell.getUpsell(attributes, 'hardhand');
        if (directive) {
          directive.token = 'game.' + directive.token + '.betting';
          return handlerInput.responseBuilder
            .addDirective(directive)
            .withShouldEndSession(true)
            .getResponse();
        }
      }
    }

    // If the last hand was played wrong, upsell them on our book
    if (attributes.temp.wrongPlayLoser) {
      attributes.temp.wrongPlayLoser = undefined;
      if (!attributes.temp.noUpsellBetting) {
        const good = upsell.getGood(handlerInput, 'badplay');
        if (good) {
          attributes.suggestGood = { good: good.good, asin: good.asin };
          return handlerInput.responseBuilder
            .speak(good.message)
            .reprompt(good.message)
            .getResponse();
        }
      }
    }

    // Check upsell opportunity
    if (!attributes.temp.noUpsellBetting) {
      const directive = upsell.getUpsell(attributes, 'play');
      if (directive) {
        directive.token = 'game.' + directive.token + '.betting';
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
      game.hardSuggestion = undefined;
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

        if (goodResponse) {
          if (error) {
            error = `${goodResponse} ${error}`;
          }
          if (response) {
            response = `${goodResponse} ${response}`;
          }
          if (speech) {
            speech = `${goodResponse} ${speech}`;
          }
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
