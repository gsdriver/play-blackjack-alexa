//
// Handles core playing of the game and interaction with back-end service
//

'use strict';

const http = require('http');
const requestify = require('requestify');
const utils = require('alexa-speech-utils')();
const stubbedGame = require('./StubbedGame');

const testUser = 'stubbed';
let resources;

module.exports = {
  // Plays a given action, returning either an error or a response string
  playBlackjackAction: function(savedGameState, locale, userID, action, callback) {
    // Special case if this is suggest
    resources = require('./' + locale + '/resources');

    if (action.action == 'suggest') {
      postUserAction(locale, userID, action.action, 0, (error, suggestion) => {
        const speechError = (suggestion.error) ? suggestion.error : error;
        let suggestText = suggestion.suggestion;

        if (suggestText) {
          // Special case if it wasn't your turn
          if (suggestText == 'notplayerturn') {
            suggestText = resources.strings.SUGGEST_TURNOVER;
          } else {
            if (resources.mapActionToSuggestion(suggestText)) {
              const youShould = resources.strings.SUGGEST_OPTIONS.split('|');
              const prefix = youShould[Math.floor(Math.random() * youShould.length)];

              suggestText = prefix.replace('{0}', resources.mapActionToSuggestion(suggestText));
            }
          }
        }

        getGameState(savedGameState, userID, (err, gameState) => {
          const reprompt = (gameState) ? listValidActions(gameState, locale, 'full') : resources.ERROR_REPROMPT;
          suggestText += ('. ' + reprompt);
          callback(speechError, null, suggestText, reprompt, null);
        });
      });
    } else {
      // Get the game state so we can take action (the latest should be stored tied to this user ID)
      let speechError = null;
      let speechQuestion = '';
      let repromptQuestion = null;

      getGameState(savedGameState, userID, (error, gameState) => {
        if (error) {
          speechError = resources.strings.REPORT_ERROR.replace('{0}', error);
          callback(speechError, null, null);
          return;
        }

        // Is this a valid option?
        if (!gameState.possibleActions || (gameState.possibleActions.indexOf(action.action) < 0)) {
          // Probably need a way to read out the game state better
          speechError = resources.strings.INVALID_ACTION.replace('{0}', action.action);
          speechError += readHand(gameState, locale);
          speechError += ' ' + listValidActions(gameState, locale, 'full');
          sendUserCallback(locale, gameState, speechError, null, null, null, callback);
        } else {
          // OK, let's post this action and get a new game state
          const betAmount = (action.amount ? action.amount : gameState.lastBet);

          postUserAction(locale, gameState.userID, action.action,
            betAmount, (error, newGameState) => {
            if (error) {
              speechError = error;
            } else {
              // Special case - give a full read-out if this is a natural blackjack
              const playerBlackjack = ((newGameState.playerHands.length == 1)
                && (newGameState.activePlayer == 'player')
                && (newGameState.playerHands[0].cards.length == 2)
                && (newGameState.playerHands[0].total == 21));

              // If this was the first hand, or they specified a value, tell them how much they bet
              if ((action.action === 'bet') && (action.firsthand || (action.amount > 0))) {
                speechQuestion += resources.strings.YOU_BET_TEXT.replace('{0}', betAmount);
              }

              // Pose this as a question whether it's the player or dealer's turn
              repromptQuestion = listValidActions(newGameState, locale, 'full');
              speechQuestion += (tellResult(locale, action.action, gameState, newGameState)
                + ' ' + listValidActions(newGameState, locale,
                  (playerBlackjack) ? 'full' : 'summary'));
            }

            sendUserCallback(locale, newGameState, speechError, null,
              speechQuestion, repromptQuestion, callback);
          });
        }
      });
    }
  },
  // Reads back the rules in play
  readRules: function(savedGameState, locale, userID, callback) {
    resources = require('./' + locale + '/resources');

    // Get the game state so we can take action (the latest should be stored tied to this user ID)
    getGameState(savedGameState, userID, (error, gameState) => {
      if (error) {
        const speechError = resources.strings.REPORT_ERROR.replace('{0}', error);
        callback(speechError, null, null, null, null);
        return;
      }

      // Convert the rules to text
      const reprompt = listValidActions(gameState, locale, 'full');
      const speech = rulesToText(locale, gameState.houseRules) + reprompt;

      callback(null, null, speech, reprompt, gameState);
    });
  },
  // Flushes the current user from our store, which resets everything to the beginning state
  flushGame: function(userID, callback) {
    flushGameState(userID, (error, result) => {
      // Just call back
      callback(error, result);
    });
  },
  // Reads back the current hand and game state
  readCurrentHand: function(savedGameState, locale, userID, callback) {
    resources = require('./' + locale + '/resources');

    getGameState(savedGameState, userID, (error, gameState) => {
      if (error) {
        callback(error, null, null);
      } else {
        let speechQuestion = null;
        let repromptQuestion = null;

        repromptQuestion = listValidActions(gameState, locale, 'full');
        speechQuestion = resources.strings.YOUR_BANKROLL_TEXT.replace('{0}', gameState.bankroll) + readHand(gameState, locale) + ' ' + repromptQuestion;
        callback(null, null, speechQuestion, repromptQuestion, gameState);
      }
    });
  },
  // Gets contextual help based on the current state of the game
  getContextualHelp: function(savedGameState, locale, userID, callback) {
    resources = require('./' + locale + '/resources');
    getGameState(savedGameState, userID, (error, gameState) => {
      if (error) {
        callback(error, null);
      } else {
        let result = '';

        if (gameState.possibleActions) {
          // Special case - if there is insurance and noinsurance in the list, then pose as a yes/no
          if (gameState.possibleActions.indexOf('noinsurance') > -1) {
            // It's possible you can't take insurance because you don't have enough money
            if (gameState.possibleActions.indexOf('insurance') > -1) {
              result = resources.strings.HELP_TAKE_INSURANCE;
            } else {
              result = resources.strings.HELP_INSURANCE_INSUFFICIENT_BANKROLL;
            }
          } else {
            result = resources.strings.HELP_YOU_CAN_SAY.replace('{0}',
              utils.or(gameState.possibleActions.map((x) => resources.mapPlayOption(x)),
              {locale: locale}));
          }
        }

        result += resources.strings.HELP_MORE_OPTIONS;
        callback(null, result);
      }
    });
  },
  // Changes the rules in play
  changeRules: function(locale, userID, rules, callback) {
    resources = require('./' + locale + '/resources');
    let speech = resources.strings.INTERNAL_ERROR;

    // OK, let's post the rule change and get a new game state
    postUserAction(locale, userID, 'setrules', rules, (error, newGameState) => {
      if (!error) {
        // Read the new rules
        speech = rulesToText(locale, newGameState.houseRules, rules);
      }

      // If this is shuffle, we'll do the shuffle for them
      const reprompt = resources.strings.CHANGERULES_REPROMPT;
      speech += resources.strings.CHANGERULES_CHECKAPP;
      sendUserCallback(locale, newGameState, error, null, speech, reprompt, callback);
    });
  },
};

//
// It's possible the game gets to a state where you have to reset the bankroll
// or shuffle the deck.  Let's do that automatically for the user
//
function sendUserCallback(locale, gameState, error, speechResponse,
        speechQuestion, repromptQuestion, callback) {
  // If this is shuffle, we'll do the shuffle for them
  if (gameState && gameState.possibleActions) {
    if (gameState.possibleActions.indexOf('shuffle') > -1) {
      // Simplify things and just shuffle for them
      postUserAction(locale, gameState.userID, 'shuffle', 0, (nextError, nextGameState) => {
        callback(error, speechResponse, speechQuestion, repromptQuestion, nextGameState);
      });
      return;
    } else if (gameState.possibleActions.indexOf('resetbankroll') > -1) {
      // Simplify things and just shuffle for them if this is resetbankroll
      postUserAction(locale, gameState.userID, 'resetbankroll', 0, (nextError, nextGameState) => {
        callback(error, speechResponse, speechQuestion, repromptQuestion, nextGameState);
      });
      return;
    }
  }

  // Nope, just do a regular callback
  callback(error, speechResponse, speechQuestion, repromptQuestion, gameState);
}

/*
 * Internal functions
 */
function getGameState(savedGameState, userID, callback) {
  if (userID == testUser) {
    return stubbedGame.getGameState(callback);
  }

  // If they have a saved game state, just return that
  if (savedGameState) {
    callback(null, savedGameState);
  } else {
    const startTime = new Date().getTime();
    let endTime;
    const queryString = 'get?userID=' + userID;

    http.get(process.env.SERVICEURL + queryString, (res) => {
      if (res.statusCode == 200) {
        // Great, we should have a game!
        let fulltext = '';

        res.on('data', (data) => {
          fulltext += data;
        });

        res.on('end', () => {
          const gameState = JSON.parse(fulltext);

          endTime = new Date().getTime();
          console.log('Elapsed time to call getGameState: ' + (endTime - startTime) + ' ms');

          // There is a bug in the response from the server IF the player had split the last hand
          // AND on this new hand the dealer has a blackjack with a 10 showing.  In that case, this
          // hand is over however currentHand was not reset to 0, so the player has only one hand
          // but we think they're on the second hand.  We will blow up if we don't correct this
          // Ideal fix is in the blackjack server, but this is a workaround the lambda function
          // can make to let the game continue

          if (gameState.playerHands && (gameState.activePlayer == 'none')
            && (gameState.dealerHand && (gameState.dealerHand.outcome == 'dealerblackjack'))
            && (gameState.currentPlayerHand >= gameState.playerHands.length)) {
            console.log('Fixing dealerblackjack after split bug');
            gameState.currentPlayerHand = 0;
          }

          callback(null, gameState);
        });
      } else {
        // Sorry, there was an error calling the HTTP endpoint
        console.log('GetGameState response error: ' + res.statusCode);
        endTime = new Date().getTime();
        console.log('Elapsed time to call getGameState: ' + (endTime - startTime) + ' ms');
        callback('Unable to call endpoint', null);
      }
    }).on('error', (e) => {
      console.log('GetGameState Communications error: ' + e.message);
      endTime = new Date().getTime();
      console.log('Elapsed time to call getGameState: ' + (endTime - startTime) + ' ms');
      callback('Communications error: ' + e.message, null);
    });
  }
}

function flushGameState(userID, callback) {
  if (userID == testUser) {
    return stubbedGame.flushGameState(callback);
  }

  const queryString = 'flushcache?userID=' + userID;
  const startTime = new Date().getTime();
  let endTime;

  http.get(process.env.SERVICEURL + queryString, (res) => {
    if (res.statusCode == 200) {
      // Great, I don't really care what the response is
      endTime = new Date().getTime();
      console.log('Elapsed time to call flushGameState: ' + (endTime - startTime) + ' ms');
      callback(null, 'OK');
    } else {
      // Sorry, there was an error calling the HTTP endpoint
      console.log('flushGameState response error: ' + res.statusCode);
      endTime = new Date().getTime();
      console.log('Elapsed time to call flushGameState: ' + (endTime - startTime) + ' ms');
      callback('Unable to call endpoint', null);
    }
  }).on('error', (e) => {
    console.log('flushGameState Communications error: ' + e.message);
    endTime = new Date().getTime();
    console.log('Elapsed time to call flushGameState: ' + (endTime - startTime) + ' ms');
    callback('Communications error: ' + e.message, null);
  });
}

function postUserAction(locale, userID, action, value, callback) {
  if (userID == testUser) {
    return stubbedGame.postUserAction(action, value, callback);
  }

  const payload = {userID: userID, action: action};
  const startTime = new Date().getTime();
  let endTime;

  if (action == 'bet') {
    payload.value = value;
  } else if (action == 'setrules') {
    for (const attrname in value) {
      if (Object.prototype.hasOwnProperty.call(value, attrname)) {
        payload[attrname] = value[attrname];
      }
    }
  }
  requestify.post(process.env.SERVICEURL, payload)
  .then((response) => {
    // Get the raw response body
    endTime = new Date().getTime();
    console.log('Elapsed time to call postUserAction ' + action + ': ' + (endTime - startTime) + ' ms');
    callback(null, JSON.parse(response.body));
  })
  .fail((response) => {
    endTime = new Date().getTime();
    console.log('Failed calling ' + action + ' ' + response.body);
    console.log('Elapsed time to call postUserAction ' + action + ': ' + (endTime - startTime) + ' ms');
    callback(getSpeechError(response, locale), null);
  });
}

function getSpeechError(response, locale) {
  const error = response.getBody();
  return (error && error.error) ?
    resources.mapServerError(error.error) :
    resources.strings.SPEECH_ERROR_CODE.replace('{0}', response.getCode());
}

//
// Lists what the user can do next - provided in the form of a question
// You can ask for either "full" or "summary" depending on the state
//
function listValidActions(gameState, locale, type) {
  let result = '';

  if (gameState.possibleActions) {
    // Special case - if there is insurance and noinsurance in the list, then ask a yes/no question
    if (gameState.possibleActions.indexOf('noinsurance') > -1) {
      // It's possible you can't take insurance because you don't have enough money
      if (gameState.possibleActions.indexOf('insurance') > -1) {
        result = resources.strings.ASK_TAKE_INSURANCE;
      } else {
        result = resources.strings.HELP_INSURANCE_INSUFFICIENT_BANKROLL;
      }
    } else if (type === 'full') {
      result = resources.strings.ASK_POSSIBLE_ACTIONS.replace('{0}',
        utils.or(gameState.possibleActions.map((x) => resources.mapPlayOption(x)),
        {locale: locale}));
    } else {
      // Provide a summary
      if (gameState.activePlayer == 'player') {
        result = resources.strings.ASK_WHAT_TO_DO;
      } else {
        result = resources.strings.ASK_PLAY_AGAIN;
      }
    }
  }

  return result;
}

function tellResult(locale, action, gameState, newGameState) {
  let result = '';

  // It's possible they did something other than stand on the previous hand if this is a split
  // If so, read that off first (but try to avoid it if they just stood on the prior hand)
  if ((gameState.activePlayer == 'player') && (newGameState.currentPlayerHand != gameState.currentPlayerHand)) {
    const oldHand = newGameState.playerHands[gameState.currentPlayerHand];

    // I don't want to re-read this hand if they just stood, so let's make sure they busted
    // or split Aces (which only draws on card) or did a double before we read this hand.
    if ((oldHand.total > 21) ||
      (oldHand.bet > newGameState.playerHands[newGameState.currentPlayerHand].bet)) {
      if (oldHand.total > 21) {
        result = resources.strings.RESULT_AFTER_HIT_BUST.replace('{0}', resources.cardRanks(oldHand.cards[oldHand.cards.length - 1]));
      } else {
        result = resources.strings.RESULT_AFTER_HIT_NOBUST.replace('{0}', resources.cardRanks(oldHand.cards[oldHand.cards.length - 1])).replace('{1}', oldHand.total);
      }

      // And now preface with the next hand before we tell them what happened
      result += readHandNumber(newGameState, newGameState.currentPlayerHand);
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
      result += readHand(newGameState, locale);
      break;
    case 'hit':
      // Tell them the new card, the total, and the dealer up card
      result += readHit(newGameState, locale);
      break;
    case 'stand':
      // OK, let's read what the dealer had, what they drew, and what happened
      result += readStand(newGameState, locale);
      break;
    case 'double':
      // Tell them the new card, and what the dealer did
      result += readDouble(newGameState, locale);
      break;
    case 'insurance':
    case 'noinsurance':
      // Say whether the dealer had blackjack, and what the next thing is to do
      result += readInsurance(newGameState, locale);
      break;
    case 'split':
      // OK, now you have multiple hands - makes reading the game state more interesting
      result += readSplit(newGameState, locale);
      break;
    case 'surrender':
      result += readSurrender(newGameState, locale);
      break;
    }

  if ((gameState.activePlayer == 'player') && (newGameState.activePlayer != 'player')) {
    // OK, game over - so let's give the new total
    result += resources.strings.YOUR_BANKROLL_TEXT.replace('{0}', newGameState.bankroll);
  }

  return result;
}

//
// Recaps what the dealer has done now that he played his turn
//
function readDealerAction(gameState, locale) {
  let result;

  result = resources.strings.DEALER_HOLE_CARD.replace('{0}', resources.cardRanks(gameState.dealerHand.cards[0]));
  if (gameState.dealerHand.cards.length > 2) {
    result += resources.strings.DEALER_DRAW;
    result += utils.and(gameState.dealerHand.cards.slice(2).map((x) => resources.strings.DEALER_CARD_ARTICLE.replace('{0}', resources.cardRanks(x))), {locale: locale});
    result += '.';
  }

  if (gameState.dealerHand.total > 21) {
    result += resources.strings.DEALER_BUSTED;
  } else if ((gameState.dealerHand.total == 21) && (gameState.dealerHand.cards.length == 2)) {
    result += resources.strings.DEALER_BLACKJACK;
  } else {
    result += resources.strings.DEALER_TOTAL.replace('{0}', gameState.dealerHand.total);
  }

  return result;
}

//
// Read the result of the game
//
function readGameResult(gameState) {
  let i;
  let outcome = '';

  // If multiple hands, say so
  for (i = 0; i < gameState.playerHands.length; i++) {
    outcome += readHandNumber(gameState, i);
    outcome += resources.mapOutcome(gameState.playerHands[i].outcome);
    outcome += ' ';
  }

  // What was the outcome?
  return outcome;
}

/*
 * We will read the new card, the total, and the dealer up card
 */
function readHit(gameState, locale) {
  const currentHand = gameState.playerHands[gameState.currentPlayerHand];
  const cardText = resources.cardRanks(currentHand.cards[currentHand.cards.length - 1]);
  let result;

  if (currentHand.total > 21) {
    result = resources.strings.PLAYER_HIT_BUSTED.replace('{0}', cardText);
  } else {
    const resultFormat = ((currentHand.soft) ? resources.strings.PLAYER_HIT_NOTBUSTED_SOFT
              : resources.strings.PLAYER_HIT_NOTBUSTED);
    result = resultFormat.replace('{0}', cardText).replace('{1}', currentHand.total);
    result += resources.strings.DEALER_SHOWING.replace('{0}', resources.cardRanks(gameState.dealerHand.cards[1]));
  }

  if (gameState.activePlayer != 'player') {
    result += readDealerAction(gameState, locale);
    result += ' ' + readGameResult(gameState);
  }

  return result;
}

//
// We read the card that the player got, then the dealer's hand, action, and final outcome
//
function readDouble(gameState, locale) {
  const currentHand = gameState.playerHands[gameState.currentPlayerHand];
  const cardText = resources.cardRanks(currentHand.cards[currentHand.cards.length - 1]);
  let result;

  if (currentHand.total > 21) {
    result = resources.strings.PLAYER_HIT_BUSTED.replace('{0}', cardText);
  } else {
    const resultFormat = ((currentHand.soft) ? resources.strings.PLAYER_HIT_NOTBUSTED_SOFT
              : resources.strings.PLAYER_HIT_NOTBUSTED);
    result = resultFormat.replace('{0}', cardText).replace('{1}', currentHand.total);
  }

  if (gameState.activePlayer != 'player') {
    result += readDealerAction(gameState, locale);
    result += ' ' + readGameResult(gameState);
  }

  return result;
}

//
// We will read the dealer's hand, action, and what the final outcome was
//
function readStand(gameState, locale) {
  let result;

  // If they are still playing, then read the next hand, otherwise read
  // the dealer action
  if (gameState.activePlayer == 'player') {
    result = readHand(gameState, locale);
  } else {
    result = readDealerAction(gameState, locale);
    result += ' ' + readGameResult(gameState);
  }

  return result;
}

//
// You split, so now let's read the result
//
function readSplit(gameState, locale) {
  let result;
  const pairCard = gameState.playerHands[gameState.currentPlayerHand].cards[0];

  if (pairCard.rank >= 10) {
    result = resources.strings.SPLIT_TENS;
  } else {
    result = resources.strings.SPLIT_PAIR.replace('{0}', resources.pluralCardRanks(pairCard));
  }

  // Now read the current hand
  result += readHand(gameState, locale);

  return result;
}

/*
 * You surrendered, so the game is over
 */
function readSurrender(gameState, locale) {
  let result = resources.strings.SURRENDER_RESULT;

  // Rub it in by saying what the dealer had
  result += readDealerAction(gameState, locale);

  return result;
}

/*
 * Say whether the dealer had blackjack - if not, reiterate the current hand,
 * if so then we're done and let them know to bet
 */
function readInsurance(gameState, locale) {
  let result;

  if (gameState.dealerHand.outcome == 'dealerblackjack') {
    // Game over
    result = resources.strings.DEALER_HAD_BLACKJACK;
    result += readGameResult(gameState);
  } else if (gameState.dealerHand.outcome == 'nodealerblackjack') {
    // No blackjack - so what do you want to do now?
    result = resources.strings.DEALER_NO_BLACKJACK;
    result += readHand(gameState, locale);
  }

  return result;
}

/*
 * Reads the state of the hand - your cards and total, and the dealer up card
 */
function readHand(gameState, locale) {
  let result = '';
  let resultFormat;

  // It's possible there is no hand
  if (gameState.playerHands.length == 0) {
    return '';
  }
  const currentHand = gameState.playerHands[gameState.currentPlayerHand];
  if (!currentHand) {
    // We're about to blow up - log for diagnosis
    console.log('currentHand is undefined: ' + JSON.stringify(gameState));
  }

  // If they have more than one hand, then say the hand number
  result += readHandNumber(gameState, gameState.currentPlayerHand);
  const readCards = utils.and(currentHand.cards.map((x) => resources.cardRanks(x)),
                        {locale: locale});

  // Read the full hand
  if (currentHand.total > 21) {
    resultFormat = (currentHand.soft) ? resources.strings.READHAND_PLAYER_BUSTED_SOFT
            : resources.strings.READHAND_PLAYER_BUSTED;
    result += resultFormat.replace('{0}', readCards).replace('{1}', currentHand.total);
  } else if (gameState.activePlayer == 'none') {
    // If no active player, use past tense
    if ((gameState.playerHands.length == 1) && (currentHand.cards.length == 2)
      && (currentHand.total == 21)) {
      result += resources.strings.READHAND_PLAYER_TOTAL_END_BLACKJACK.replace('{0}', readCards);
    } else {
      resultFormat = (currentHand.soft) ? resources.strings.READHAND_PLAYER_TOTAL_END_SOFT
                  : resources.strings.READHAND_PLAYER_TOTAL_END;
      result += resultFormat.replace('{0}', readCards).replace('{1}', currentHand.total);
    }
  } else {
    if ((gameState.playerHands.length == 1) && (currentHand.cards.length == 2)
      && (currentHand.total == 21)) {
      result += resources.strings.READHAND_PLAYER_TOTAL_ACTIVE_BLACKJACK.replace('{0}', readCards);
    } else {
      resultFormat = (currentHand.soft) ? resources.strings.READHAND_PLAYER_TOTAL_ACTIVE_SOFT
                  : resources.strings.READHAND_PLAYER_TOTAL_ACTIVE;
      result += resultFormat.replace('{0}', readCards).replace('{1}', currentHand.total);
    }
  }

  const dealerCardText = resources.cardRanks(gameState.dealerHand.cards[1]);

  if (gameState.activePlayer == 'none') {
    // Game over, so read the whole dealer hand
    result += resources.strings.READHAND_DEALER_DONE.replace('{0}', dealerCardText);
    result += readDealerAction(gameState, locale);
  } else {
    result += resources.strings.READHAND_DEALER_ACTIVE.replace('{0}', dealerCardText);
  }

  return result;
}

//
// Returns a string if you have more than one hand in play
//
function readHandNumber(gameState, handNumber) {
  let result = '';

  if (gameState.playerHands.length > 1) {
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
};
