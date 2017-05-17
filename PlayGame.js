//
// Handles core playing of the game and interaction with back-end service
//

'use strict';

const http = require('http');
const requestify = require('requestify');
const utils = require('alexa-speech-utils')();
const stubbedGame = require('./StubbedGame');

const cardRanks = ['none', 'ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];
const testUser = 'stubbed';

module.exports = {
  // Plays a given action, returning either an error or a response string
  playBlackjackAction: function(userID, action, callback) {
    // Special case if this is suggest
    if (action.action == 'suggest') {
      postUserAction(userID, action.action, 0, (error, suggestion) => {
        const youShould = ['You should ', 'The book says you should ', 'The book would tell you to ', 'According to Basic Strategy you should ',
                'The book would suggest that you ', 'I think you should ', 'Basic Strategy would suggest you '];
        const actionMapping = {'insurance': 'take insurance', 'noinsurance': 'not take insurance', 'hit': 'hit',
                        'stand': 'stand', 'split': 'split', 'double': 'double', 'surrender': 'surrender'};

        const speechError = (suggestion.error) ? suggestion.error : error;
        let suggestText = suggestion.suggestion;

        if (suggestText) {
          // Special case if it wasn't your turn
          if (suggestText == 'notplayerturn') {
            suggestText = 'I can\'t give a suggestion when the game is over';
          } else {
            if (actionMapping[suggestText]) {
              const prefix = youShould[Math.floor(Math.random() * youShould.length)];
              suggestText = prefix + actionMapping[suggestText];
            }
          }
        }

        getGameState(userID, (err, gameState) => {
          const reprompt = (gameState) ? listValidActions(gameState, 'full') : 'What can I help you with?';
          suggestText += ('. ' + reprompt);
          callback(speechError, null, suggestText, reprompt, null);
        });
      });
    } else {
      // Get the game state so we can take action (the latest should be stored tied to this user ID)
      let speechError = null;
      let speechQuestion = '';
      let repromptQuestion = null;

      getGameState(userID, (error, gameState) => {
        if (error) {
          speechError = 'There was an error: ' + error;
          callback(speechError, null, null);
          return;
        }

        // Is this a valid option?
        if (!gameState.possibleActions || (gameState.possibleActions.indexOf(action.action) < 0)) {
          // Probably need a way to read out the game state better
          speechError = 'I\'m sorry, ' + action.action + ' is not a valid action at this time. ';
          speechError += readHand(gameState);
          speechError += ' ' + listValidActions(gameState, 'full');
          sendUserCallback(gameState, speechError, null, null, null, callback);
        } else {
          // OK, let's post this action and get a new game state
          const betAmount = (action.amount ? action.amount : gameState.lastBet);

          postUserAction(gameState.userID, action.action, betAmount, (error, newGameState) => {
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
                speechQuestion += ('You bet $' + betAmount + '. ');
              }

              // Pose this as a question whether it's the player or dealer's turn
              repromptQuestion = listValidActions(newGameState, 'full');
              speechQuestion += (tellResult(action.action, gameState, newGameState)
                + ' ' + listValidActions(newGameState,
                  (playerBlackjack) ? 'full' : 'summary'));
            }

            sendUserCallback(newGameState, speechError, null,
              speechQuestion, repromptQuestion, callback);
          });
        }
      });
    }
  },
  // Reads back the rules in play
  readRules: function(userID, callback) {
    // Get the game state so we can take action (the latest should be stored tied to this user ID)
    getGameState(userID, (error, gameState) => {
      if (error) {
        const speechError = 'There was an error: ' + error;
        callback(speechError, null, null, null, null);
        return;
      }

      // Convert the rules to text
      const reprompt = listValidActions(gameState, 'full');
      const speech = rulesToText(gameState.houseRules) + reprompt;

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
  readCurrentHand: function(userID, callback) {
    getGameState(userID, (error, gameState) => {
      if (error) {
        callback(error, null, null);
      } else {
        let speechQuestion = null;
        let repromptQuestion = null;

        repromptQuestion = listValidActions(gameState, 'full');
        speechQuestion = 'You have $' + gameState.bankroll + '. ' + readHand(gameState) + ' ' + repromptQuestion;
        callback(null, null, speechQuestion, repromptQuestion, gameState);
      }
    });
  },
  // Gets contextual help based on the current state of the game
  getContextualHelp: function(userID, callback) {
    getGameState(userID, (error, gameState) => {
      if (error) {
        callback(error, null);
      } else {
        let result = '';

        if (gameState.possibleActions) {
          // Special case - if there is insurance and noinsurance in the list, then pose as a yes/no
          if (gameState.possibleActions.indexOf('noinsurance') > -1) {
            // It's possible you can't take insurance because you don't have enough money
            if (gameState.possibleActions.indexOf('insurance') > -1) {
              result = 'You can say yes to take insurance or no to decline insurance.';
            } else {
              result = 'You don\'t have enough money to take insurance - say no to decline insurance.';
            }
          } else {
            result = 'You can say ' + utils.or(gameState.possibleActions) + '.';
          }
        }

        result += ' For more options, please check the Alexa companion application.<break time=\'300ms\'/> What can I help you with?';
        callback(null, result);
      }
    });
  },
  // Changes the rules in play
  changeRules: function(userID, rules, callback) {
    let speech = 'Sorry, internal error. What else can I help with?';

    // OK, let's post the rule change and get a new game state
    postUserAction(userID, 'setrules', rules, (error, newGameState) => {
      if (!error) {
        // Read the new rules
        speech = rulesToText(newGameState.houseRules, rules);
      }

      // If this is shuffle, we'll do the shuffle for them
      const reprompt = 'Would you like to bet?';
      speech += (' Check the Alexa companion application for the full set of rules. ' + reprompt);
      sendUserCallback(newGameState, error, null, speech, reprompt, callback);
    });
  },
};

//
// It's possible the game gets to a state where you have to reset the bankroll
// or shuffle the deck.  Let's do that automatically for the user
//
function sendUserCallback(gameState, error, speechResponse,
        speechQuestion, repromptQuestion, callback) {
  // If this is shuffle, we'll do the shuffle for them
  if (gameState && gameState.possibleActions) {
    if (gameState.possibleActions.indexOf('shuffle') > -1) {
      // Simplify things and just shuffle for them
      postUserAction(gameState.userID, 'shuffle', 0, (nextError, nextGameState) => {
        callback(error, speechResponse, speechQuestion, repromptQuestion, nextGameState);
      });
      return;
    } else if (gameState.possibleActions.indexOf('resetbankroll') > -1) {
      // Simplify things and just shuffle for them if this is resetbankroll
      postUserAction(gameState.userID, 'resetbankroll', 0, (nextError, nextGameState) => {
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
function getGameState(userID, callback) {
  if (userID == testUser) {
    return stubbedGame.getGameState(callback);
  }

  const queryString = 'get?userID=' + userID;

  http.get(process.env.SERVICEURL + queryString, (res) => {
    if (res.statusCode == 200) {
      // Great, we should have a game!
      let fulltext = '';

      res.on('data', (data) => {
        fulltext += data;
      });

      res.on('end', () => {
        callback(null, JSON.parse(fulltext));
      });
    } else {
      // Sorry, there was an error calling the HTTP endpoint
      callback('Unable to call endpoint', null);
    }
  }).on('error', (e) => {
    callback('Communications error: ' + e.message, null);
  });
}

function flushGameState(userID, callback) {
  if (userID == testUser) {
    return stubbedGame.flushGameState(callback);
  }

  const queryString = 'flushcache?userID=' + userID;

  http.get(process.env.SERVICEURL + queryString, (res) => {
    if (res.statusCode == 200) {
      // Great, I don't really care what the response is
      callback(null, 'OK');
    } else {
      // Sorry, there was an error calling the HTTP endpoint
      callback('Unable to call endpoint', null);
    }
  }).on('error', (e) => {
    callback('Communications error: ' + e.message, null);
  });
}

function postUserAction(userID, action, value, callback) {
  if (userID == testUser) {
    return stubbedGame.postUserAction(action, value, callback);
  }

  const payload = {userID: userID, action: action};

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
    // Get the response body (JSON parsed or jQuery object for XMLs)
    response.getBody();

    // Get the raw response body
    callback(null, JSON.parse(response.body));
  })
  .fail((response) => {
    callback(getSpeechError(response), null);
  });
}

function getSpeechError(response) {
  const errorMapping = ['bettoosmall', 'Your bet is below the minimum of $5',
                      'bettoolarge', 'Your bet is above the maximum of $1000',
                      'betoverbankroll', 'Your bet is more than your available bankroll'];
  let errorText = 'Internal error';
  const error = response.getBody();
  let index;

  if (error && error.error) {
    index = errorMapping.indexOf(error.error);
    errorText = (index > -1) ? errorMapping[index + 1] : error.error;
  } else {
    errorText = 'Error code ' + response.getCode();
  }

  return errorText;
}

//
// Lists what the user can do next - provided in the form of a question
// You can ask for either "full" or "summary" depending on the state
//
function listValidActions(gameState, type) {
  let result = '';

  if (gameState.possibleActions) {
    // Special case - if there is insurance and noinsurance in the list, then ask a yes/no question
    if (gameState.possibleActions.indexOf('noinsurance') > -1) {
      // It's possible you can't take insurance because you don't have enough money
      if (gameState.possibleActions.indexOf('insurance') > -1) {
        result = 'Do you want to take insurance?  Say yes or no.';
      } else {
        result = 'You don\'t have enough money to take insurance - say no to decline insurance.';
      }
    } else if (type === 'full') {
      result = 'Would you like to ' + utils.or(gameState.possibleActions) + '?';
    } else {
      // Provide a summary
      if (gameState.activePlayer == 'player') {
        result = 'What would you like to do?';
      } else {
        result = 'Would you like to play again?';
      }
    }
  }

  return result;
}

function tellResult(action, gameState, newGameState) {
  let result = '';

  // It's possible they did something other than stand on the previous hand if this is a split
  // If so, read that off first (but try to avoid it if they just stood on the prior hand)
  if ((gameState.activePlayer == 'player') && (newGameState.currentPlayerHand != gameState.currentPlayerHand)) {
    const oldHand = newGameState.playerHands[gameState.currentPlayerHand];

    // I don't want to re-read this hand if they just stood, so let's make sure they busted
    // or split Aces (which only draws on card) or did a double before we read this hand.
    if ((oldHand.total > 21) ||
      (oldHand.bet > newGameState.playerHands[newGameState.currentPlayerHand].bet)) {
      result = 'You got a ' + cardRanks[oldHand.cards[oldHand.cards.length - 1].rank];
      result += (oldHand.total > 21) ? ' and busted. ' : (' for a total of ' + oldHand.total + '. ');

      // And now preface with the next hand before we tell them what happened
      result += readHandNumber(newGameState, newGameState.currentPlayerHand);
    }
  }

  // So what happened?
  switch (action) {
    case 'resetbankroll':
      result += 'Bankroll reset';
      break;
    case 'shuffle':
      result += 'Deck shuffled';
      break;
    case 'bet':
      // A new hand was dealt
      result += readHand(newGameState);
      break;
    case 'hit':
      // Tell them the new card, the total, and the dealer up card
      result += readHit(newGameState);
      break;
    case 'stand':
      // OK, let's read what the dealer had, what they drew, and what happened
      result += readStand(newGameState);
      break;
    case 'double':
      // Tell them the new card, and what the dealer did
      result += readDouble(newGameState);
      break;
    case 'insurance':
    case 'noinsurance':
      // Say whether the dealer had blackjack, and what the next thing is to do
      result += readInsurance(newGameState);
      break;
    case 'split':
      // OK, now you have multiple hands - makes reading the game state more interesting
      result += readSplit(newGameState);
      break;
    case 'surrender':
      result += readSurrender(newGameState);
      break;
    }

  if ((gameState.activePlayer == 'player') && (newGameState.activePlayer != 'player')) {
    // OK, game over - so let's give the new total
    result += ' You have $' + newGameState.bankroll + '.';
  }

  return result;
}

//
// Recaps what the dealer has done now that he played his turn
//
function readDealerAction(gameState) {
  let result;
  let i;

  result = 'The dealer had a ' + cardRanks[gameState.dealerHand.cards[0].rank] + ' down.';
  if (gameState.dealerHand.cards.length > 2) {
    result += ' The dealer drew ';
    for (i = 2; i < gameState.dealerHand.cards.length; i++) {
      result += 'a ' + cardRanks[gameState.dealerHand.cards[i].rank];
      if (i < gameState.dealerHand.cards.length - 1) {
        result += ' and ';
      }
    }

    result += '.';
  }

  if (gameState.dealerHand.total > 21) {
    result += ' The dealer busted.';
  } else if ((gameState.dealerHand.total == 21) && (gameState.dealerHand.cards.length == 2)) {
    result += ' The dealer has Blackjack.';
  } else {
    result += ' The dealer had a total of ' + gameState.dealerHand.total + '.';
  }

  return result;
}

//
// Read the result of the game
//
function readGameResult(gameState) {
  const outcomeMapping = ['blackjack', 'You win with a Natural Blackjack!',
             'dealerblackjack', 'The dealer has Blackjack.',
             'nodealerblackjack', 'The dealer doesn\'t have Blackjack.',
             'win', 'You won!',
             'loss', 'You lost.',
             'push', 'It\'s a tie.',
             'surrender', 'You surrendered.'];
  let i;
  let index;
  let outcome = '';

  // If multiple hands, say so
  for (i = 0; i < gameState.playerHands.length; i++) {
    outcome += readHandNumber(gameState, i);
    index = outcomeMapping.indexOf(gameState.playerHands[i].outcome);
    outcome += (index > -1) ? outcomeMapping[index + 1] : '';
    outcome += ' ';
  }

  // What was the outcome?
  return outcome;
}

/*
 * We will read the new card, the total, and the dealer up card
 */
function readHit(gameState) {
  const currentHand = gameState.playerHands[gameState.currentPlayerHand];
  let result;

  result = 'You got a ' + cardRanks[currentHand.cards[currentHand.cards.length - 1].rank];
  if (currentHand.total > 21) {
    result += ' and busted. ';
  } else {
    result += ' for a total of ' + (currentHand.soft ? 'soft ' : '') + currentHand.total + '.';
    result += ' The dealer is showing a ' + cardRanks[gameState.dealerHand.cards[1].rank];
    result += '.';
  }

  if (gameState.activePlayer != 'player') {
    result += readDealerAction(gameState);
    result += ' ' + readGameResult(gameState);
  }

  return result;
}

//
// We read the card that the player got, then the dealer's hand, action, and final outcome
//
function readDouble(gameState) {
  const currentHand = gameState.playerHands[gameState.currentPlayerHand];
  let result;

  result = 'You got a ' + cardRanks[currentHand.cards[currentHand.cards.length - 1].rank];
  if (currentHand.total > 21) {
    result += ' and busted.';
  } else {
    result += ' for a total of ' + (currentHand.soft ? 'soft ' : '') + currentHand.total + '. ';
  }

  if (gameState.activePlayer != 'player') {
    result += readDealerAction(gameState);
    result += ' ' + readGameResult(gameState);
  }

  return result;
}

//
// We will read the dealer's hand, action, and what the final outcome was
//
function readStand(gameState) {
  let result;

  // If they are still playing, then read the next hand, otherwise read
  // the dealer action
  if (gameState.activePlayer == 'player') {
    result = readHand(gameState);
  } else {
    result = readDealerAction(gameState);
    result += ' ' + readGameResult(gameState);
  }

  return result;
}

//
// You split, so now let's read the result
//
function readSplit(gameState) {
  let result = 'You split ';

  if (gameState.playerHands[gameState.currentPlayerHand].cards[0].rank >= 10) {
    result += 'tens';
  } else {
    result += 'a pair of ' + cardRanks[gameState.playerHands[gameState.currentPlayerHand].cards[0].rank] + 's';
  }
  result += '. ';

  // Now read the current hand
  result += readHand(gameState);

  return result;
}

/*
 * You surrendered, so the game is over
 */
function readSurrender(gameState) {
  let result = 'You surrendered. ';

  // Rub it in by saying what the dealer had
  result += readDealerAction(gameState);

  return result;
}

/*
 * Say whether the dealer had blackjack - if not, reiterate the current hand,
 * if so then we're done and let them know to bet
 */
function readInsurance(gameState) {
  let result = '';

  if (gameState.dealerHand.outcome == 'dealerblackjack') {
    // Game over
    result += 'The dealer had a blackjack. ';
    result += readGameResult(gameState);
  } else if (gameState.dealerHand.outcome == 'nodealerblackjack') {
    // No blackjack - so what do you want to do now?
    result += 'The dealer didn\'t have a blackjack. ';
    result += readHand(gameState);
  }

  return result;
}

/*
 * Reads the state of the hand - your cards and total, and the dealer up card
 */
function readHand(gameState) {
  let result = '';
  let i;

  // It's possible there is no hand
  if (gameState.playerHands.length == 0) {
    return '';
  }
  const currentHand = gameState.playerHands[gameState.currentPlayerHand];

  // If they have more than one hand, then say the hand number
  result += readHandNumber(gameState, gameState.currentPlayerHand);

  // Read the full hand
  if (currentHand.total > 21) {
    result += 'You busted with ';
  } else {
    // If no active player, use past tense
    result += (gameState.activePlayer == 'none') ? 'You had ' : 'You have ';
  }

  for (i = 0; i < currentHand.cards.length; i++) {
    result += cardRanks[currentHand.cards[i].rank];
    if (i < currentHand.cards.length - 1) {
      result += ' and ';
    }
  }

  // If this is a blackjack (two-card 21 with only one hand), then say it
  if ((gameState.playerHands.length == 1) && (currentHand.cards.length == 2)
    && (currentHand.total == 21)) {
    result += ' for a blackjack';
  } else {
    result += ' for a total of ' + (currentHand.soft ? 'soft ' : '') + currentHand.total;
  }

  result += '. The dealer ';
  if (gameState.activePlayer == 'none') {
    // Game over, so read the whole dealer hand
    result += 'had a ' + cardRanks[gameState.dealerHand.cards[1].rank] + ' showing. ';
    result += readDealerAction(gameState);
  } else {
    result += 'has a ' + cardRanks[gameState.dealerHand.cards[1].rank] + ' showing.';
  }

  return result;
}

//
// Returns a string if you have more than one hand in play
//
function readHandNumber(gameState, handNumber) {
  let result = '';
  const mapping = ['First hand ', 'Second hand ', 'Third hand ', 'Fourth hand '];

  if (gameState.playerHands.length > 1) {
    result = mapping[handNumber];
  }

  return result;
}

function rulesToText(rules, changeRules) {
  let text = '';

  // If old rules were passed in, only state what's set in changeRules
  // As that would be the elements that changed
  // Say the decks and betting range
  if (!changeRules || changeRules.hasOwnProperty('numberOfDecks')) {
    text += rules.numberOfDecks + ' deck game. ';
  }
  if (!changeRules || changeRules.hasOwnProperty('minBet') || changeRules.hasOwnProperty('maxBet')) {
    text += 'Bet from $' + rules.minBet + ' to $' + rules.maxBet + '. ';
  }

  // Hit or stand on soft 17
  if (!changeRules || changeRules.hasOwnProperty('hitSoft17')) {
    text += 'Dealer ' + (rules.hitSoft17 ? 'hits' : 'stands') + ' on soft 17. ';
  }

  // Double rules
  if (!changeRules || changeRules.hasOwnProperty('double') || changeRules.hasOwnProperty('doubleaftersplit')) {
    const doubleMapping = ['any', 'on any cards',
                          '10or11', 'on 10 or 11 only',
                          '9or10o11', 'on 9 thru 11 only',
                          'none', 'not allowed'];
    const iDouble = doubleMapping.indexOf(rules.double);
    if (iDouble > -1) {
      text += 'Double down ' + doubleMapping[iDouble + 1] + '. ';
      if (rules.double != 'none') {
        text += 'Double after split ' + (rules.doubleaftersplit ? 'allowed. ' : 'not allowed. ');
      }
    }
  }

  // Splitting (only metion if you can resplit aces 'cuz that's uncommon)
  if (!changeRules || changeRules.hasOwnProperty('resplitAces')) {
    if (rules.resplitAces) {
      text += 'Can resplit Aces. ';
    }
  }

  // Surrender rules
  if (!changeRules || changeRules.hasOwnProperty('surrender')) {
    const surrenderMapping = ['none', 'Surrender not offered. ',
                          'early', 'Surrender allowed. ',
                          'late', 'Surrender allowed. '];
    const iSurrender = surrenderMapping.indexOf(rules.surrender);
    if (iSurrender > -1) {
      text += surrenderMapping[iSurrender + 1];
    }
  }

  if (!changeRules || changeRules.hasOwnProperty('blackjackBonus')) {
    // Blackjack payout
    const blackjackPayout = ['0.5', '3 to 2. ',
                         '0.2', '6 to 5. ',
                         '0', 'even money. '];
    const iBlackjack = blackjackPayout.indexOf(rules.blackjackBonus.toString());
    if (iBlackjack > -1) {
      text += 'Blackjack pays ' + blackjackPayout[iBlackjack + 1];
    }
  }

  return text;
};
