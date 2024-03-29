//
// Handles translation of core playing of the game into speech output
//

'use strict';

const utils = require('alexa-speech-utils')();
const gameService = require('./GameService');
const tournament = require('./tournament');
const request = require('request');
const bjUtils = require('./BlackjackUtils');
const speechUtils = require('alexa-speech-utils')();

let resources;

module.exports = {
  // Plays a given action, returning either an error or a response string
  playBlackjackAction: function(attributes, locale, userID, action, callback) {
    // Special case if this is suggest
    resources = require('./resources')(locale);
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

      // If they aren't in training mode, and they haven't already heard
      // about training mode, then let them know about this feature
      if (!attributes.prompts.training) {
        attributes.prompts.training = true;
        if (!game.training && !game.useTrainingHands) {
          speech += ('. ' + resources.strings.PROMPT_TRAINING);
        }
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
        speechError += readHand(attributes, game, locale);
        speechError += ' ' + listValidActions(game, locale, 'full');
        sendUserCallback(attributes, speechError, null, null, null, callback);
      } else {
        // OK, let's post this action and get a new game state
        const betAmount = (action.amount ? action.amount : game.lastBet);
        const oldGame = JSON.parse(JSON.stringify(game));

        // Check what they should have done if this is a hard hand
        if (game.isHardHand && !game.training && !game.hardSuggestion) {
          const hardSuggestion = gameService.getRecommendedAction(game);
          if ((hardSuggestion !== 'notplayerturn') && (hardSuggestion !== action.action)) {
            game.hardSuggestion = hardSuggestion;
          } else {
            game.hardSuggestion = 'none';
          }
        }

        // We need to know if this was the right play or not
        const suggestion = gameService.getRecommendedAction(game);

        // If they are in training mode, first check if this is the right action
        // and we didn't already make a suggestion that they are ignoring
        if ((game.training || game.useTrainingHands) && !game.suggestion) {
          if ((suggestion !== 'notplayerturn') && (suggestion !== action.action)) {
            // Let them know what the recommended action was
            // and give them a chance to use this action instead
            game.suggestion = {suggestion: suggestion, player: action.action};

            let suggestText;
            if (resources.mapActionToSuggestion(suggestion)) {
              suggestText = resources.mapActionToSuggestion(suggestion);
            } else {
              suggestText = suggestion;
            }
            let speech = resources.pickRandomOption('SUGGESTED_PLAY').replace('{0}', suggestText);
            const reprompt = resources.strings.SUGGESTED_PLAY_REPROMPT.replace('{0}', suggestText);

            speech += reprompt;
            callback(null, null, speech, reprompt, null);
            return;
          }
        }

        // If this was the first hand, or they specified a value, tell them how much they bet
        if ((action.action === 'bet') && (action.firsthand || (action.amount !== game.lastBet))) {
          speechQuestion += resources.strings.YOU_BET_TEXT.replace('{0}', betAmount);
        }

        // If there was a suggestion, remove it as we have taken a play
        game.suggestion = undefined;
        gameService.userAction(attributes, action.action, betAmount, (speechError) => {
          let error;

          if (speechError) {
            error = resources.mapServerError(speechError);
          } else {
            // Player took an action - the board will need to be redrawn
            attributes.temp.drawBoard = true;

            // Special case - give a full read-out if this is a natural blackjack
            const playerBlackjack = ((game.playerHands.length == 1)
              && (game.activePlayer == 'player')
              && (game.playerHands[0].cards.length == 2)
              && (game.playerHands[0].total == 21));

            // If this is tournament mode and the hand is over, special rules apply
            if (((oldGame.activePlayer == 'player') && (game.activePlayer != 'player'))
              && (attributes.currentGame === 'tournament')) {
              // Are they out of hands?
              if (game.hands >= game.maxHands) {
                // Whoops, we are done
                speechQuestion += tellResult(attributes, locale, action.action, oldGame);
                const response = tournament.outOfHands(locale, attributes, speechQuestion);
                callback(error, response, null, null);
                return;
              }

              // Are they out of money?
              if (game.possibleActions.indexOf('resetbankroll') > -1) {
                // Sorry, you lose
                speechQuestion += tellResult(attributes, locale, action.action, oldGame);
                callback(error,
                    tournament.outOfMoney(locale, attributes, speechQuestion), null, null);
                return;
              }
            }

            // If they ran out of money (non-tournament), then either reset
            // it for them (if they have the subscription), or we'll end the game
            let resetBankroll;
            const handResult = (tellResult(attributes, locale, action.action, oldGame) + ' ');
            if (game.possibleActions.indexOf('resetbankroll') > -1) {
              if (attributes.paid && attributes.paid.bankrollreset && (attributes.paid.bankrollreset.state == 'PURCHASED')) {
                game.bankroll = game.bankrollRefresh;
                resetBankroll = true;
              } else {
                attributes.busted = Date.now();
                callback(error, handResult + resources.strings.BUSTED_AFTER_PLAY, null, null);
                return;
              }        
            }

            // Make note if the hand is over, they lost, and they played it wrong
            attributes.temp.wrongPlayLoser = (suggestion !== 'notplayerturn')
              && (suggestion !== action.action)
              && (game.activePlayer === 'none')
              && !game.playerHands.some((h) => h.outcome !== 'loss');
        
            // Pose this as a question whether it's the player or dealer's turn
            repromptQuestion = listValidActions(game, locale, 'full');
            speechQuestion += handResult;
            speechQuestion += resetBankroll
              ? resources.strings.RESET_BANKROLL_AFTER_PLAY
              : listValidActions(game, locale, (playerBlackjack) ? 'full' : 'summary');
          }

          sendUserCallback(attributes, error, null, speechQuestion, repromptQuestion, callback);
        });
      }
    }
  },
  // Reads back the rules in play
  readRules: function(attributes, locale) {
    resources = require('./resources')(locale);
    const game = attributes[attributes.currentGame];

    const reprompt = listValidActions(game, locale, 'full');
    const speech = rulesToText(locale, game.rules) + reprompt;

    return {speech: speech, reprompt: reprompt};
  },
  // Reads back the current hand and game state
  readCurrentHand: function(attributes, locale) {
    resources = require('./resources')(locale);
    const game = attributes[attributes.currentGame];
    const reprompt = listValidActions(game, locale, 'full');
    const speech = readHand(attributes, game, locale) + ' ' + reprompt;
    return {speech: speech, reprompt: reprompt};
  },
  // Gets contextual help based on the current state of the game
  getContextualHelp: function(event, attributes, helpPrompt) {
    resources = require('./resources')(event.request.locale);
    const game = attributes[attributes.currentGame];
    let result = '';

    if (attributes.temp.joinTournament || attributes.temp.confirmReset
      || attributes.temp.selectingGame) {
      result = resources.strings.HELP_YOU_CAN_SAY_YESNO;
    } else if (game.possibleActions) {
      // Special case - if there is insurance and noinsurance in the list, then pose as a yes/no
      if (game.possibleActions.indexOf('noinsurance') > -1) {
        // It's possible you can't take insurance because you don't have enough money
        if (game.possibleActions.indexOf('insurance') > -1) {
          result = ((game.playerHands[0].total === 21) && (game.rules.blackjackBonus == 0.5))
              ? resources.strings.HELP_TAKE_INSURANCE_BLACKJACK
              : resources.strings.HELP_TAKE_INSURANCE;
        } else {
          result = resources.strings.HELP_INSURANCE_INSUFFICIENT_BANKROLL;
        }
      } else {
        const actions = game.possibleActions.map((x) => resources.mapPlayOption(x));
        actions.push(resources.strings.HELP_YOU_CAN_SAY_LEADER);
        if (helpPrompt && !game.training && !game.useTrainingHands) {
          actions.push(resources.strings.HELP_YOU_CAN_SAY_ENABLE_TRAINING);
        }
        result = resources.strings.HELP_YOU_CAN_SAY.replace('{0}', utils.or(actions, {locale: event.request.locale}));
      }
    } else if (!helpPrompt) {
      result = resources.strings.TRAINING_REPROMPT;
    }

    if (helpPrompt) {
      result += resources.strings.HELP_MORE_OPTIONS;
    }

    return result;
  },
  // Changes the rules in play
  changeRules: function(attributes, locale, rules, callback) {
    resources = require('./resources')(locale);
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
      if ((attributes.platform !== 'google') && !attributes.bot) {
        speech += resources.strings.CHANGERULES_CHECKAPP;
      }
      speech += resources.strings.CHANGERULES_CHECKAPP_BET;
      sendUserCallback(attributes, error, null, speech, reprompt, callback);
    });
  },
};

//
// It's possible the game gets to a state where you have to reset the bankroll
// and/or shuffle the deck.  Let's do that automatically for the user
//
function sendUserCallback(attributes, error, response, speech, reprompt, callback) {
  const game = attributes[attributes.currentGame];

  // If this is shuffle, we'll do the shuffle for them
  if (game && game.possibleActions && game.possibleActions.indexOf('shuffle') > -1) {
    // Simplify things and just shuffle for them
    gameService.userAction(attributes, 'shuffle', 0, (err) => {
      sendCallback();
    });
  } else {
    sendCallback();
  }

  function sendCallback() {
    // We're done and ready to callback
    callback(error, response, speech, reprompt);
  }
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
        // Do you have blackjack?
        result = ((game.playerHands[0].total === 21) && (game.rules.blackjackBonus == 0.5))
            ? resources.strings.ASK_TAKE_INSURANCE_BLACKJACK
            : resources.strings.ASK_TAKE_INSURANCE;
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
        result = resources.pickRandomOption('ASK_PLAY_AGAIN');
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
    // or split Aces (which only draws one card) or did a double before we read this hand.
    if ((oldHand.total >= 21) ||
      (oldHand.bet > game.playerHands[game.currentPlayerHand].bet)) {
      if (oldHand.total > 21) {
        result = resources.strings.RESULT_AFTER_HIT_BUST
          .replace('{0}', resources.readCard(oldHand.cards[oldHand.cards.length - 1], 'article', game.readSuit));
      } else {
        result = resources.strings.RESULT_AFTER_HIT_NOBUST
          .replace('{0}', resources.readCard(oldHand.cards[oldHand.cards.length - 1], 'article', game.readSuit))
          .replace('{1}', oldHand.total);
      }

      // And now preface with the next hand before we tell them what happened
      result += readHandNumber(game, game.currentPlayerHand);
    }
  }

  // So what happened?
  switch (action) {
    case 'shuffle':
      result += resources.strings.RESULT_DECK_SHUFFLED;
      break;
    case 'bet':
      // A new hand was dealt
      result += readHand(attributes, game, locale);
      // If it is not the player's turn (could happen on dealer blackjack)
      // then read the game result here too
      if (game.activePlayer != 'player') {
        result += ' ' + readGameResult(attributes);
      }
      break;
    case 'sidebet':
      // A side bet was placed
      result += resources.strings.SIDEBET_PLACED
        .replace('{0}', game.progressive.bet)
        .replace('{1}', game.progressiveJackpot);
      break;
    case 'nosidebet':
      // A side bet was removed
      result += resources.strings.SIDEBET_REMOVED;
      break;
    case 'hit':
    case 'double':
      // Tell them the new card, the total, and the dealer up card (or what they did)
      result += readHit(attributes, locale);
      break;
    case 'stand':
      // OK, let's read what the dealer had, what they drew, and what happened
      result += readStand(attributes, locale);
      break;
    case 'insurance':
    case 'noinsurance':
      // Say whether the dealer had blackjack, and what the next thing is to do
      result += readInsurance(attributes, locale);
      break;
    case 'split':
      // OK, now you have multiple hands - makes reading the game state more interesting
      result += readSplit(attributes, locale);
      break;
    case 'surrender':
      result += readSurrender(attributes, locale);
      break;
    }

  if ((oldGame.activePlayer == 'player') && (game.activePlayer != 'player')) {
    // OK, game over - so let's give the new total
    if (!game.high || (game.bankroll > game.high)) {
      game.high = game.bankroll;
    }

    if (game.maxHands && (game.hands < game.maxHands)) {
      result += resources.strings.TOURNAMENT_BANKROLL
          .replace('{0}', game.bankroll)
          .replace('{1}', (game.maxHands - game.hands));
    } else {
      result += resources.strings.YOUR_BANKROLL_TEXT.replace('{0}', game.bankroll);
    }

    // If it's non-tournament play and that was 5 or more cards to a 21,
    // flag it so we can tell them about Spanish 21 next hand
    if ((attributes.currentGame !== 'tournament') &&
      ((game.playerHands.length == 1) && (game.playerHands[0].cards.length > 4)
        && (handTotal(game.playerHands[0].cards) == 21))) {
      attributes.temp.long21 = true;
    }
  }

  return result;
}

//
// Recaps what the dealer has done now that he played his turn
//
function readDealerAction(game, locale) {
  let result;

  result = resources.strings.DEALER_HOLE_CARD.replace('{0}', resources.readCard(game.dealerHand.cards[0], 'article', game.readSuit));
  if (game.dealerHand.cards.length > 2) {
    result += resources.strings.DEALER_DRAW;
    result += utils.and(game.dealerHand.cards.slice(2).map((x) => resources.readCard(x, 'article', game.readSuit)), {locale: locale});
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
function readGameResult(attributes) {
  let i;
  let outcome = '';
  let sideBetResult = '';
  const game = attributes[attributes.currentGame];

  // Post to the service for post-game analysis
  const params = {
    url: process.env.SERVICEURL + 'blackjack/analyzePlay',
    formData: {
      attributes: JSON.stringify(attributes),
    },
  };
  request.post(params, (err, res, body) => {
    if (err) {
      console.log(err);
    }
  });

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

  // And read super bonus if it hit
  if (game.superBonusWin) {
    sideBetResult += resources.strings.SUPERBONUS_WIN.replace('{0}', game.superBonusWin);
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
    if (sideBetResult.length) {
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

  // Update achievements
  if (!attributes.achievements) {
    attributes.achievements = {};
  }
  // 10 points if this is the first play of the day
  const pointsEarned = [];
  const noPoints = (bjUtils.getAchievementScore(attributes.achievements) === 0);
  if (game.firstDailyHand) {
    pointsEarned.push(resources.strings.FIRST_DAILY_HAND);
    attributes.achievements.daysPlayed = (attributes.achievements.daysPlayed)
          ? (attributes.achievements.daysPlayed + 1) : 1;
  }
  // 5 points for a natural blackjack
  if ((game.playerHands.length === 1)
      && (game.playerHands[0].cards.length === 2)
      && (game.playerHands[0].total === 21)) {
    pointsEarned.push(resources.strings.NATURAL_BLACKJACK);
    attributes.achievements.naturals = (attributes.achievements.naturals)
          ? (attributes.achievements.naturals + 1) : 1;
  }
  // N points for a streak of wins (N > 1)
  let winner = true;
  game.playerHands.map((x) => {
    if ((x.outcome !== 'win') && (x.outcome !== 'blackjack')) {
      winner = false;
    }
  });
  game.winningStreak = (winner) ? ((game.winningStreak) ? (game.winningStreak + 1) : 1) : 0;
  if (game.winningStreak > 1) {
    pointsEarned.push(resources.strings.WINNING_STREAK
      .replace('{0}', game.winningStreak).replace('{1}', game.winningStreak));
    attributes.achievements.streakScore = (attributes.achievements.streakScore)
        ? (attributes.achievements.streakScore + game.winningStreak)
        : game.winningStreak;
  }

  if (pointsEarned.length) {
    // Tell them what they earned
    let score;
    const format = resources.strings.POINTS_EARNED_NOSCORE;

    outcome += format.replace('{0}', speechUtils.and(pointsEarned, {pause: '200ms'}))
        .replace('{1}', score);

    // If this isn't the first time earning points, prompt about the leader board
    if (!noPoints) {
      if (!attributes.prompts.leaderBoard) {
        attributes.prompts.leaderBoard = true;
        outcome += resources.strings.PROMPT_LEADER_BOARD;
      }
    }
  }

  // They are no longer a new user
  if (attributes.newUser) {
    attributes.newUser = undefined;
  }

  // What was the outcome?
  return outcome;
}

/*
 * We will read the new card, the total, and the dealer up card
 */
function readHit(attributes, locale) {
  const game = attributes[attributes.currentGame];
  const currentHand = game.playerHands[game.currentPlayerHand];
  const cardText = resources.readCard(currentHand.cards[currentHand.cards.length - 1], 'article', game.readSuit);
  const cardRank = currentHand.cards[currentHand.cards.length - 1].rank;
  let result;

  if (currentHand.total > 21) {
    result = resources.pickRandomOption('PLAYER_HIT_BUSTED').replace('{0}', cardText);
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
      result += resources.strings.DEALER_SHOWING.replace('{0}', resources.readCard(game.dealerHand.cards[1], 'article', game.readSuit));
    }
  }

  if (game.activePlayer != 'player') {
    result += readDealerAction(game, locale);
    result += ' ' + readGameResult(attributes);
  }

  return result;
}

//
// We will read the dealer's hand, action, and what the final outcome was
//
function readStand(attributes, locale) {
  const game = attributes[attributes.currentGame];
  let result;

  // If they are still playing, then read the next hand, otherwise read
  // the dealer action
  if (game.activePlayer == 'player') {
    result = readHand(attributes, game, locale);
  } else {
    result = readDealerAction(game, locale);
    result += ' ' + readGameResult(attributes);
  }

  return result;
}

//
// You split, so now let's read the result
//
function readSplit(attributes, locale) {
  const game = attributes[attributes.currentGame];
  let result;
  const pairCard = game.playerHands[game.currentPlayerHand].cards[0];

  if (pairCard.rank >= 10) {
    result = resources.strings.SPLIT_TENS;
  } else {
    result = resources.strings.SPLIT_PAIR.replace('{0}', resources.pluralCardRanks(pairCard));
  }

  // Now read the current hand
  result += readHand(attributes, game, locale);

  return result;
}

/*
 * You surrendered, so the game is over
 */
function readSurrender(attributes, locale) {
  const game = attributes[attributes.currentGame];
  let result;

  // Rub it in by saying what the dealer had
  result = readDealerAction(game, locale);
  result += ' ' + readGameResult(attributes);

  return result;
}

/*
 * Say whether the dealer had blackjack - if not, reiterate the current hand,
 * if so then we're done and let them know to bet
 */
function readInsurance(attributes, locale) {
  const game = attributes[attributes.currentGame];
  let result;

  if (game.dealerHand.outcome == 'dealerblackjack') {
    // Game over
    result = resources.strings.DEALER_HAD_BLACKJACK;
    result += readGameResult(attributes);
  } else if (game.dealerHand.outcome == 'nodealerblackjack') {
    // No blackjack - so what do you want to do now?
    result = resources.strings.DEALER_NO_BLACKJACK;
    result += readHand(attributes, game, locale);
  }

  return result;
}

/*
 * Reads the state of the hand - your cards and total, and the dealer up card
 */
function readHand(attributes, game, locale) {
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
  const readCards = utils.and(currentHand.cards.map((x) => {
    return resources.readCard(x, false, game.readSuit);
  }), {locale: locale});

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

  const dealerCardText = resources.readCard(game.dealerHand.cards[1], 'article', game.readSuit);

  if (game.activePlayer == 'none') {
    // Game over, so read the whole dealer hand
    result += resources.strings.READHAND_DEALER_DONE.replace('{0}', dealerCardText);
    result += readDealerAction(game, locale);
  } else {
    result += resources.strings.READHAND_DEALER_ACTIVE.replace('{0}', dealerCardText);
    result += promptHandPlay(attributes);
  }

  return result;
}

//
// Reads a suggestion if the analysis indicates we should
//
function promptHandPlay(attributes) {
  const game = attributes[attributes.currentGame];
  let suggestion = '';

  if ((attributes.currentGame !== 'tournament') && attributes.analysis) {
    const suggest = gameService.getRecommendedAction(game);
    if (attributes.analysis[suggest]) {
      // OK, we should suggest this - once we do, we'll clear
      // this attribute so it isn't suggested again
      suggestion = resources.strings.PROACTIVE_SUGGESTION
          .replace('{0}', resources.mapActionPastTense(suggest))
          .replace('{1}', resources.mapActionToSuggestion(suggest));
      attributes.analysis[suggest] = 0;
    }
  }

  return suggestion;
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

  // Is this Spanish 21?
  if (rules.pay21) {
    text += resources.strings.RULES_SPANISH21;
  }

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

function handTotal(cards) {
  let retval = 0;
  let hasAces = false;

  for (let i = 0; i < cards.length; i++) {
    if (cards[i].rank > 10) {
      retval += 10;
    } else {
      retval += cards[i].rank;
    }

    // Note if there's an ace
    if (cards[i].rank == 1) {
      hasAces = true;
    }
  }

  // If there are aces, add 10 to the total (unless it would go over 21)
  // Note that in this case the hand is soft
  if ((retval <= 11) && hasAces) {
    retval += 10;
  }

  return retval;
}
