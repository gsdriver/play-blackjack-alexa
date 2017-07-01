//
// Handles translation of core playing of the game into speech output
//

'use strict';

const utils = require('alexa-speech-utils')();
const gameService = require('./GameService');

let resources;

module.exports = {
  // Plays a given action, returning either an error or a response string
  playBlackjackAction: function(attributes, locale, userID, action, callback) {
    // Special case if this is suggest
    resources = require('./' + locale + '/resources');
    const game = attributes[attributes.currentGame];

    if (action.action == 'suggest') {
      let speech;
      const suggestText = gameService.getRecommendedAction(game);

      if (suggestText === 'notplayerturn') {
        speech = resources.strings.SUGGEST_TURNOVER;
      } else if (resources.mapActionToSuggestion(suggestText)) {
        speech = resources.pickRandomOption('SUGGEST_OPTIONS').replace('{0}', resources.mapActionToSuggestion(suggestText));
      } else {
        speech = suggestText;
      }

      const reprompt = listValidActions(game, locale, 'full');
      speech += ('. ' + reprompt);
      callback(null, null, speech, reprompt, null);
    } else {
      // Get the game state so we can take action (the latest should be stored tied to this user ID)
      let speechError = null;
      let speechQuestion = '';
      let repromptQuestion = null;

      // Is this a valid option?
      if (!game.possibleActions
            || (game.possibleActions.indexOf(action.action) < 0)) {
        // Probably need a way to read out the game state better
        speechError = resources.strings.INVALID_ACTION.replace('{0}', resources.mapPlayOption(action.action));
        speechError += readHand(game, locale);
        speechError += ' ' + listValidActions(game, locale, 'full');
        sendUserCallback(attributes, speechError, null, null, null, callback);
      } else {
        // OK, let's post this action and get a new game state
        const betAmount = (action.amount ? action.amount : game.lastBet);
        const oldGame = JSON.parse(JSON.stringify(game));

        gameService.userAction(attributes, action.action, betAmount, (speechError) => {
          let error;

          if (speechError) {
            error = resources.mapServerError(speechError);
          } else {
            // Special case - give a full read-out if this is a natural blackjack
            const playerBlackjack = ((game.playerHands.length == 1)
              && (game.activePlayer == 'player')
              && (game.playerHands[0].cards.length == 2)
              && (game.playerHands[0].total == 21));

            // If this was the first hand, or they specified a value, tell them how much they bet
            if ((action.action === 'bet') && (action.firsthand || (action.amount > 0))) {
              speechQuestion += resources.strings.YOU_BET_TEXT.replace('{0}', betAmount);
            }

            // Pose this as a question whether it's the player or dealer's turn
            repromptQuestion = listValidActions(game, locale, 'full');
            speechQuestion += (tellResult(attributes, locale, action.action, oldGame) + ' '
              + listValidActions(game, locale, (playerBlackjack) ? 'full' : 'summary'));
          }

          sendUserCallback(attributes, error, null, speechQuestion, repromptQuestion, callback);
        });
      }
    }
  },
  // Reads back the rules in play
  readRules: function(attributes, locale, callback) {
    resources = require('./' + locale + '/resources');
    const game = attributes[attributes.currentGame];

    const reprompt = listValidActions(game, locale, 'full');
    const speech = rulesToText(locale, game.rules) + reprompt;

    callback(speech, reprompt);
  },
  // Reads back the current hand and game state
  readCurrentHand: function(attributes, locale, callback) {
    resources = require('./' + locale + '/resources');
    const game = attributes[attributes.currentGame];
    const reprompt = listValidActions(game, locale, 'full');
    const speech = resources.strings.YOUR_BANKROLL_TEXT.replace('{0}', game.bankroll)
              + readHand(game, locale) + ' ' + reprompt;

    callback(speech, reprompt);
  },
  // Gets contextual help based on the current state of the game
  getContextualHelp: function(attributes, locale, userID, callback) {
    resources = require('./' + locale + '/resources');
    const game = attributes[attributes.currentGame];
    let result = '';

    if (game.possibleActions) {
      // Special case - if there is insurance and noinsurance in the list, then pose as a yes/no
      if (game.possibleActions.indexOf('noinsurance') > -1) {
        // It's possible you can't take insurance because you don't have enough money
        if (game.possibleActions.indexOf('insurance') > -1) {
          result = resources.strings.HELP_TAKE_INSURANCE;
        } else {
          result = resources.strings.HELP_INSURANCE_INSUFFICIENT_BANKROLL;
        }
      } else {
        result = resources.strings.HELP_YOU_CAN_SAY.replace('{0}',
          utils.or(game.possibleActions.map((x) => resources.mapPlayOption(x)),
          {locale: locale}));
      }
    }

    result += resources.strings.HELP_MORE_OPTIONS;
    return result;
  },
  // Changes the rules in play
  changeRules: function(attributes, locale, rules, callback) {
    resources = require('./' + locale + '/resources');
    const game = attributes[attributes.currentGame];
    let speech = resources.strings.INTERNAL_ERROR;

    // OK, let's post the rule change and get a new game state
    gameService.userAction(attributes, 'setrules', rules, (error) => {
      if (!error) {
        // Read the new rules
        speech = rulesToText(locale, game.rules, rules);
      }

      // If this is shuffle, we'll do the shuffle for them
      const reprompt = resources.strings.CHANGERULES_REPROMPT;
      speech += resources.strings.CHANGERULES_CHECKAPP;
      sendUserCallback(attributes, error, null, speech, reprompt, callback);
    });
  },
};

//
// It's possible the game gets to a state where you have to reset the bankroll
// or shuffle the deck.  Let's do that automatically for the user
//
function sendUserCallback(attributes, error, response, speech, reprompt, callback) {
  const game = attributes[attributes.currentGame];

  // If this is shuffle, we'll do the shuffle for them
  if (game && game.possibleActions) {
    if (game.possibleActions.indexOf('shuffle') > -1) {
      // Simplify things and just shuffle for them
      gameService.userAction(attributes, 'shuffle', 0, (err) => {
        callback(error, response, speech, reprompt);
      });
      return;
    } else if (game.possibleActions.indexOf('resetbankroll') > -1) {
      // Simplify things and just shuffle for them if this is resetbankroll
      gameService.userAction(attributes, 'resetbankroll', 0, (err) => {
        callback(error, response, speech, reprompt);
      });
      return;
    }
  }

  // Nope, just do a regular callback
  callback(error, response, speech, reprompt);
}

/*
 * Internal functions
 */

//
// Lists what the user can do next - provided in the form of a question
// You can ask for either "full" or "summary" depending on the state
//
function listValidActions(game, locale, type) {
  let result = '';

  if (game.possibleActions) {
    // Special case - if there is insurance and noinsurance in the list, then ask a yes/no question
    if (game.possibleActions.indexOf('noinsurance') > -1) {
      // It's possible you can't take insurance because you don't have enough money
      if (game.possibleActions.indexOf('insurance') > -1) {
        result = resources.strings.ASK_TAKE_INSURANCE;
      } else {
        result = resources.strings.HELP_INSURANCE_INSUFFICIENT_BANKROLL;
      }
    } else if (type === 'full') {
      result = resources.strings.ASK_POSSIBLE_ACTIONS.replace('{0}',
        utils.or(game.possibleActions.map((x) => resources.mapPlayOption(x)),
        {locale: locale}));
    } else {
      // Provide a summary
      if (game.activePlayer == 'player') {
        result = resources.strings.ASK_WHAT_TO_DO;
      } else if (game.specialState === 'sidebet') {
        result = resources.strings.ASK_SAY_BET;
      } else {
        result = resources.strings.ASK_PLAY_AGAIN;
      }
    }
  }

  return result;
}

function tellResult(attributes, locale, action, oldGame) {
  let result = '';
  const game = attributes[attributes.currentGame];

  // It's possible they did something other than stand on the previous hand if this is a split
  // If so, read that off first (but try to avoid it if they just stood on the prior hand)
  if ((oldGame.activePlayer == 'player') && (game.currentPlayerHand != oldGame.currentPlayerHand)) {
    const oldHand = game.playerHands[oldGame.currentPlayerHand];

    // I don't want to re-read this hand if they just stood, so let's make sure they busted
    // or split Aces (which only draws on card) or did a double before we read this hand.
    if ((oldHand.total > 21) ||
      (oldHand.bet > game.playerHands[game.currentPlayerHand].bet)) {
      if (oldHand.total > 21) {
        result = resources.strings.RESULT_AFTER_HIT_BUST.replace('{0}', resources.cardRanks(oldHand.cards[oldHand.cards.length - 1], 'article'));
      } else {
        result = resources.strings.RESULT_AFTER_HIT_NOBUST.replace('{0}', resources.cardRanks(oldHand.cards[oldHand.cards.length - 1], 'article')).replace('{1}', oldHand.total);
      }

      // And now preface with the next hand before we tell them what happened
      result += readHandNumber(game, game.currentPlayerHand);
    }
  }

  // So what happened?
  switch (action) {
    case 'resetbankroll':
      result += resources.strings.RESULT_BANKROLL_RESET;
      break;
    case 'shuffle':
      result += resources.strings.RESULT_DECK_SHUFFLED;
      break;
    case 'bet':
      // A new hand was dealt
      result += readHand(game, locale);
      // If it is not the player's turn (could happen on dealer blackjack)
      // then read the game result here too
      if (game.activePlayer != 'player') {
        result += ' ' + readGameResult(game);
      }
      break;
    case 'sidebet':
      // A side bet was placed
      result += resources.strings.SIDEBET_PLACED.replace('{0}', game.progressive.bet);
      break;
    case 'nosidebet':
      // A side bet was removed
      result += resources.strings.SIDEBET_REMOVED;
      break;
    case 'hit':
    case 'double':
      // Tell them the new card, the total, and the dealer up card (or what they did)
      result += readHit(game, locale);
      break;
    case 'stand':
      // OK, let's read what the dealer had, what they drew, and what happened
      result += readStand(game, locale);
      break;
    case 'insurance':
    case 'noinsurance':
      // Say whether the dealer had blackjack, and what the next thing is to do
      result += readInsurance(game, locale);
      break;
    case 'split':
      // OK, now you have multiple hands - makes reading the game state more interesting
      result += readSplit(game, locale);
      break;
    case 'surrender':
      result += readSurrender(game, locale);
      break;
    }

  if ((oldGame.activePlayer == 'player') && (game.activePlayer != 'player')) {
    // OK, game over - so let's give the new total
    if (!game.high || (game.bankroll > game.high)) {
      game.high = game.bankroll;
    }

    result += resources.strings.YOUR_BANKROLL_TEXT.replace('{0}', game.bankroll);
  }

  return result;
}

//
// Recaps what the dealer has done now that he played his turn
//
function readDealerAction(game, locale) {
  let result;

  result = resources.strings.DEALER_HOLE_CARD.replace('{0}', resources.cardRanks(game.dealerHand.cards[0], 'article'));
  if (game.dealerHand.cards.length > 2) {
    result += resources.strings.DEALER_DRAW;
    result += utils.and(game.dealerHand.cards.slice(2).map((x) => resources.cardRanks(x, 'article')), {locale: locale});
  }

  if (game.dealerHand.total > 21) {
    result += resources.strings.DEALER_BUSTED;
  } else if ((game.dealerHand.total == 21) && (game.dealerHand.cards.length == 2)) {
    result += resources.strings.DEALER_BLACKJACK;
  } else {
    result += resources.strings.DEALER_TOTAL.replace('{0}', game.dealerHand.total);
  }

  return result;
}

//
// Read the result of the game
//
function readGameResult(game) {
  let i;
  let outcome = '';
  let sideBetResult = '';

  // Now read the side bet if placed
  if (game.sideBetPlaced) {
    // Oh, the side bet paid out - let them know
    if (game.numSevens == 0) {
      sideBetResult += resources.strings.SIDEBET_LOST;
    } else if (game.numSevens === 1) {
      sideBetResult += resources.strings.SIDEBET_ONESEVEN.replace('{0}', game.sideBetWin);
    } else if (game.numSevens === 2) {
      sideBetResult += resources.strings.SIDEBET_TWOSEVENS.replace('{0}', game.sideBetWin);
    } else if (game.numSevens === 3) {
      sideBetResult += resources.strings.SIDEBET_PROGRESSIVE.replace('{0}', game.sideBetWin);
    }
  }

  if (game.playerHands.length > 1) {
  // If more than one hand and the outcome is the same, say all hands
    let allSame = true;
    game.playerHands.map((x) => {
      if (x.outcome != game.playerHands[0].outcome) {
        allSame = false;
      }
    });

    if (allSame) {
      // This means you have multiple hands that all had the same outcome
      // Special case if you lost all of them and the side bet
      if (game.sideBetPlaced && (game.playerHands[0].outcome === 'loss')
          && (game.numSevens === 0)) {
        outcome += resources.strings.LOST_MULTIPLEHANDS_AND_SIDEBET;
      } else {
        outcome += resources.mapMultipleOutcomes(game.playerHands[0].outcome,
            game.playerHands.length);
        outcome += ' ';
        outcome += sideBetResult;
      }
    } else {
      // Read each hand
      for (i = 0; i < game.playerHands.length; i++) {
        outcome += readHandNumber(game, i);
        outcome += resources.mapOutcome(game.playerHands[i].outcome);
      }
      outcome += sideBetResult;
    }
  } else {
    // Single hand - how we read depends on whether side bet was placed
    if (game.sideBetPlaced) {
      // Special case if you lost the hand and side bet
      if ((game.playerHands[0].outcome === 'loss') &&
          (game.numSevens === 0)) {
        outcome += resources.strings.LOST_SINGLEHAND_AND_SIDEBET;
      } else {
        outcome += resources.mapOutcomePlusSideBet(game.playerHands[0].outcome);
        outcome += sideBetResult;
      }
    } else {
      outcome += resources.mapOutcome(game.playerHands[0].outcome);
    }
  }

  // What was the outcome?
  return outcome;
}

/*
 * We will read the new card, the total, and the dealer up card
 */
function readHit(game, locale) {
  const currentHand = game.playerHands[game.currentPlayerHand];
  const cardText = resources.cardRanks(currentHand.cards[currentHand.cards.length - 1], 'article');
  const cardRank = currentHand.cards[currentHand.cards.length - 1].rank;
  let result;

  if (currentHand.total > 21) {
    result = resources.strings.PLAYER_HIT_BUSTED.replace('{0}', cardText);
  } else {
    let formatChoices;

    // May say something different if it's a good hit
    if (currentHand.soft) {
      // Only say something if you hit to 21
      if (currentHand.total == 21) {
        formatChoices = 'GREAT_HIT_OPTIONS';
      } else {
        formatChoices = 'PLAYER_HIT_NOTBUSTED_SOFT';
      }
    } else {
      // Good if they hit up to 20 with a card 6 or under,
      // great if they got to 21 with a card 6 or under
      if ((currentHand.total == 20) && (cardRank <= 6)) {
        formatChoices = 'GOOD_HIT_OPTIONS';
      } else if ((currentHand.total == 21) && (cardRank <= 6)) {
        formatChoices = 'GREAT_HIT_OPTIONS';
      } else {
        formatChoices = 'PLAYER_HIT_NOTBUSTED';
      }
    }

    result = resources.pickRandomOption(formatChoices).replace('{0}', cardText).replace('{1}', currentHand.total);
    if (game.activePlayer === 'player') {
      result += resources.strings.DEALER_SHOWING.replace('{0}', resources.cardRanks(game.dealerHand.cards[1], 'article'));
    }
  }

  if (game.activePlayer != 'player') {
    result += readDealerAction(game, locale);
    result += ' ' + readGameResult(game);
  }

  return result;
}

//
// We will read the dealer's hand, action, and what the final outcome was
//
function readStand(game, locale) {
  let result;

  // If they are still playing, then read the next hand, otherwise read
  // the dealer action
  if (game.activePlayer == 'player') {
    result = readHand(game, locale);
  } else {
    result = readDealerAction(game, locale);
    result += ' ' + readGameResult(game);
  }

  return result;
}

//
// You split, so now let's read the result
//
function readSplit(game, locale) {
  let result;
  const pairCard = game.playerHands[game.currentPlayerHand].cards[0];

  if (pairCard.rank >= 10) {
    result = resources.strings.SPLIT_TENS;
  } else {
    result = resources.strings.SPLIT_PAIR.replace('{0}', resources.pluralCardRanks(pairCard));
  }

  // Now read the current hand
  result += readHand(game, locale);

  return result;
}

/*
 * You surrendered, so the game is over
 */
function readSurrender(game, locale) {
  let result = resources.strings.SURRENDER_RESULT;

  // Rub it in by saying what the dealer had
  result += readDealerAction(game, locale);

  return result;
}

/*
 * Say whether the dealer had blackjack - if not, reiterate the current hand,
 * if so then we're done and let them know to bet
 */
function readInsurance(game, locale) {
  let result;

  if (game.dealerHand.outcome == 'dealerblackjack') {
    // Game over
    result = resources.strings.DEALER_HAD_BLACKJACK;
    result += readGameResult(game);
  } else if (game.dealerHand.outcome == 'nodealerblackjack') {
    // No blackjack - so what do you want to do now?
    result = resources.strings.DEALER_NO_BLACKJACK;
    result += readHand(game, locale);
  }

  return result;
}

/*
 * Reads the state of the hand - your cards and total, and the dealer up card
 */
function readHand(game, locale) {
  let result = '';
  let resultFormat;

  // It's possible there is no hand
  if (game.playerHands.length == 0) {
    return '';
  }
  const currentHand = game.playerHands[game.currentPlayerHand];
  if (!currentHand) {
    // We're about to blow up - log for diagnosis
    console.log('currentHand is undefined: ' + JSON.stringify(game));
  }

  // If they have more than one hand, then say the hand number
  result += readHandNumber(game, game.currentPlayerHand);
  const readCards = utils.and(currentHand.cards.map((x) => resources.cardRanks(x)),
                        {locale: locale});

  // Read the full hand
  if (currentHand.total > 21) {
    resultFormat = (currentHand.soft) ? resources.strings.READHAND_PLAYER_BUSTED_SOFT
            : resources.strings.READHAND_PLAYER_BUSTED;
    result += resultFormat.replace('{0}', readCards).replace('{1}', currentHand.total);
  } else if (game.activePlayer == 'none') {
    // If no active player, use past tense
    if ((game.playerHands.length == 1) && (currentHand.cards.length == 2)
      && (currentHand.total == 21)) {
      result += resources.strings.READHAND_PLAYER_TOTAL_END_BLACKJACK.replace('{0}', readCards);
    } else {
      resultFormat = (currentHand.soft) ? resources.strings.READHAND_PLAYER_TOTAL_END_SOFT
                  : resources.strings.READHAND_PLAYER_TOTAL_END;
      result += resultFormat.replace('{0}', readCards).replace('{1}', currentHand.total);
    }
  } else {
    if ((game.playerHands.length == 1) && (currentHand.cards.length == 2)
      && (currentHand.total == 21)) {
      result += resources.strings.READHAND_PLAYER_TOTAL_ACTIVE_BLACKJACK.replace('{0}', readCards);
    } else {
      resultFormat = (currentHand.soft) ? resources.strings.READHAND_PLAYER_TOTAL_ACTIVE_SOFT
                  : resources.strings.READHAND_PLAYER_TOTAL_ACTIVE;
      result += resultFormat.replace('{0}', readCards).replace('{1}', currentHand.total);
    }
  }

  const dealerCardText = resources.cardRanks(game.dealerHand.cards[1], 'article');

  if (game.activePlayer == 'none') {
    // Game over, so read the whole dealer hand
    result += resources.strings.READHAND_DEALER_DONE.replace('{0}', dealerCardText);
    result += readDealerAction(game, locale);
  } else {
    result += resources.strings.READHAND_DEALER_ACTIVE.replace('{0}', dealerCardText);
  }

  return result;
}

//
// Returns a string if you have more than one hand in play
//
function readHandNumber(game, handNumber) {
  let result = '';

  if (game.playerHands.length > 1) {
    result = resources.mapHandNumber(handNumber);
  }

  return result;
}

function rulesToText(locale, rules, changeRules) {
  let text = '';

  // If old rules were passed in, only state what's set in changeRules
  // As that would be the elements that changed
  // Say the decks and betting range
  if (!changeRules || changeRules.hasOwnProperty('numberOfDecks')) {
    text += resources.strings.RULES_DECKS.replace('{0}', rules.numberOfDecks);
  }
  if (!changeRules || changeRules.hasOwnProperty('minBet') || changeRules.hasOwnProperty('maxBet')) {
    text += resources.strings.RULES_BET_RANGE.replace('{0}', rules.minBet).replace('{1}', rules.maxBet);
  }

  // Hit or stand on soft 17
  if (!changeRules || changeRules.hasOwnProperty('hitSoft17')) {
    text += (rules.hitSoft17 ? resources.strings.RULES_HIT_SOFT17
                : resources.strings.RULES_STAND_SOFT17);
  }

  // Double rules
  if (!changeRules || changeRules.hasOwnProperty('double') || changeRules.hasOwnProperty('doubleaftersplit')) {
    const doubleRule = resources.mapDouble(rules.double);
    if (doubleRule) {
      text += resources.strings.RULES_DOUBLE.replace('{0}', doubleRule);
      if (rules.double != 'none') {
        text += (rules.doubleaftersplit) ? resources.strings.RULES_DAS_ALLOWED
                : resources.strings.RULES_DAS_NOT_ALLOWED;
      }
    }
  }

  // Splitting (only metion if you can resplit aces 'cuz that's uncommon)
  if (!changeRules || changeRules.hasOwnProperty('resplitAces')) {
    if (rules.resplitAces && (rules.maxSplitHands > 1)) {
      text += resources.strings.RULES_RESPLIT_ACES;
    }
  }

  // Number of split hands allowed
  if (!changeRules || changeRules.hasOwnProperty('maxSplitHands')) {
    if (rules.maxSplitHands > 1) {
      text += resources.strings.RULES_NUMBER_OF_SPLITS.replace('{0}', rules.maxSplitHands);
    } else {
      text += resources.strings.RULES_SPLIT_NOT_ALLOWED;
    }
  }

  // Surrender rules
  if (!changeRules || changeRules.hasOwnProperty('surrender')) {
    text += ((rules.surrender == 'none') ? resources.strings.RULES_NO_SURRENDER : resources.strings.RULES_SURRENDER_OFFERED);
  }

  if (!changeRules || changeRules.hasOwnProperty('blackjackBonus')) {
    // Blackjack payout
    const payoutText = resources.mapBlackjackPayout(rules.blackjackBonus.toString());
    if (payoutText) {
      text += resources.strings.RULES_BLACKJACK.replace('{0}', payoutText);
    }
  }

  return text;
}
