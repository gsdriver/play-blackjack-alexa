//
// This is the Game Service module - this controls the playing of the
// game and does not include spoken output
//

const suggest = require('blackjack-strategy');

const STARTING_BANKROLL = 5000;

module.exports = {
  initializeGame: function(attributes, userID) {
    // NOTE: Here is where we would add a call to the service to
    // retrieve the gameState from Redis.  Once done, we could then
    // flush the game from there (so a reset doesn't cause us to
    // read from there again)

    const game = {version: '1.0.0',
       userID: userID,
       deck: {cards: []},
       dealerHand: {cards: []},
       playerHands: [],
       rules: {
           hitSoft17: false,         // Does dealer hit soft 17
           surrender: 'late',        // Surrender offered - none, late, or early
           double: 'any',            // Double rules - none, 10or11, 9or10or11, any
           doubleaftersplit: true,   // Can double after split - none, 10or11, 9or10or11, any
           resplitAces: false,       // Can you resplit aces
           blackjackBonus: 0.5,      // Bonus for player blackjack, usually 0.5 or 0.2
           numberOfDecks: 1,         // Number of decks in play
           minBet: 5,                // The minimum bet - not configurable
           maxBet: 1000,             // The maximum bet - not configurable
           maxSplitHands: 4,         // Maximum number of hands you can have due to splits
       },
       activePlayer: 'none',
       currentPlayerHand: 0,
       specialState: null,
       bankroll: STARTING_BANKROLL,
       lastBet: 100,
       possibleActions: [],
    };

    // Start by shuffling the deck
    shuffleDeck(game);

    // Get the next possible actions
    setNextActions(game);
    attributes.game = game;
    attributes.gameState = getGameJSONResponse(game);
  },
  getRecommendedAction: function(game) {
    // Only make a suggestion if the game is still in play (the player's turn)
    if (game.activePlayer == 'player') {
      const playerCards = game.playerHands[game.currentPlayerHand].cards.map(
            (card) => ((card.rank) > 10 ? 10 : card.rank));

      game.rules.strategyComplexity = 'advanced';
      return suggest.GetRecommendedPlayerAction(playerCards,
            ((game.dealerHand.cards[1].rank > 10) ? 10 : game.dealerHand.cards[1].rank),
            game.playerHands.length,
            game.possibleActions.indexOf('insurance') < 0, game.rules);
    } else {
      return 'notplayerturn';
    }
  },
  userAction: function(attributes, action, value) {
    const game = attributes.game;

    // Is this a valid action?
    if ((action != 'setrules') && (game.possibleActions.indexOf[action] < 0)) {
      // I'm sorry Dave, I can't do that
      return 'Invalid action';
    }

    // OK, take action
    switch (action) {
      case 'setrules':
        // New set of rules
        game.rules = changeRules(game.rules, value);

        // Empty the deck and set the player to 'none' to force a reshuffle
        game.deck.cards = [];
        game.activePlayer = 'none';
        break;

      case 'resetbankroll':
        // Reset the bankroll
        game.bankroll = STARTING_BANKROLL;
        break;

      case 'shuffle':
        // In this case shuffle, then the player can bet
        shuffleDeck(game);
        break;

      case 'bet':
        // Validate the bet and deal the next hand
        if (value < game.rules.minBet) {
          return 'bettoosmall';
        } else if (value > game.bankroll) {
          return 'betoverbankroll';
        } else if (value > game.rules.maxBet) {
          return 'bettoolarge';
        }
        deal(game, value);
        break;

      case 'hit':
        // Pop the top card off the deck for the player
        game.playerHands[game.currentPlayerHand].cards.push(game.deck.cards.shift());

        // If they busted, it is the dealer's turn
        if (handTotal(game.playerHands[game.currentPlayerHand].cards).total > 21) {
          // Sorry, you lose - it's the dealer's turn now
          game.playerHands[game.currentPlayerHand].busted = true;
          nextHand(game);
        }
        break;

      case 'stand':
        // Move to the next player
        nextHand(game);
        break;

      case 'insurance':
        // If they are taking insurance, deduct the amount from the bankroll
        game.bankroll -= (game.playerHands[game.currentPlayerHand].bet / 2);
        // FALL THROUGH!
      case 'noinsurance':
        // OK, check if the dealer has 21 - if so, game is over
        game.specialState = action;
        if (handTotal(game.dealerHand.cards).total == 21) {
          // Game over (go to the dealer)
          game.dealerHand.outcome = 'dealerblackjack';
          nextHand(game);
        } else {
          // Let the player know there was no blackjack
          game.dealerHand.outcome = 'nodealerblackjack';
        }
        break;

      case 'surrender':
        // Well, that's that
        game.bankroll -= (game.playerHands[game.currentPlayerHand].bet / 2);
        game.specialState = action;
        nextHand(game);
        break;

      case 'double':
        // For this, we mimick a hit and a stand, and set the special state to doubled
        game.bankroll -= game.playerHands[game.currentPlayerHand].bet;
        game.playerHands[game.currentPlayerHand].bet *= 2;
        game.playerHands[game.currentPlayerHand].cards.push(game.deck.cards.shift());
        nextHand(game);
        break;

      case 'split':
        // OK, split these cards into another hand
        const newHand = {
          bet: game.playerHands[game.currentPlayerHand].bet,
          busted: false,
          cards: [],
        };

        game.bankroll -= newHand.bet;
        newHand.cards.push(game.playerHands[game.currentPlayerHand].cards.shift());

        // Pop the top card off the deck back into the current hand
        game.playerHands[game.currentPlayerHand].cards.push(game.deck.cards.shift());

        // And add this to the player's hand.  Whew
        game.playerHands.push(newHand);
        break;

      default:
        // Hmm .. how did this not get caught above?
        return 'Unknown Action';
    }

    // If it's the dealer's turn, then we'll play the dealer hand, unless the player already busted
    if (game.activePlayer == 'dealer') {
      playDealerHand(game);

      for (let i = 0; i < game.playerHands.length; i++) {
        determineWinner(game, game.playerHands[i]);
      }
    }

    // Now figure out what the next possible actions are and return
    setNextActions(game);
    attributes.gameState = getGameJSONResponse(game);
    return null;
  },
};

/*
 * Internal functions
 */

function getGameJSONResponse(game) {
  // OK, copy over the relevant information into the JSON object that will be returned
  // BUGBUG - Add version
  const gameState = {'userID': game.userID,
        'activePlayer': game.activePlayer,
        'currentPlayerHand': game.currentPlayerHand,
        'bankroll': game.bankroll,
        'possibleActions': game.possibleActions,
        'dealerHand': {outcome: game.dealerHand.outcome, cards: []},
        'playerHands': game.playerHands,
        'lastBet': game.lastBet,
        'houseRules': game.rules};

  // Not copied: version, deck, dealerHand (holecard), specialState
  // Need to copy over the dealer hand (don't show the hole card if it shouldn't be shown)
  let i = 0;
  if ((game.activePlayer == 'player') && game.dealerHand.cards.length) {
    // Pop the 'empty card'
    gameState.dealerHand.cards.push({'rank': 0, 'suit': 'N'});
    i = 1;
  }
  for (; i < game.dealerHand.cards.length; i++) {
    const card = {'rank': game.dealerHand.cards[i].rank, 'suit': game.dealerHand.cards[i].suit};
    gameState.dealerHand.cards.push(card);
  }

  // Also, set the total for the dealer and player hands
  const dealerTotal = handTotal(gameState.dealerHand.cards);
  gameState.dealerHand.total = dealerTotal.total;
  gameState.dealerHand.soft = dealerTotal.soft;

  for (i = 0; i < gameState.playerHands.length; i++) {
    const playerTotal = handTotal(game.playerHands[i].cards);

    game.playerHands[i].total = playerTotal.total;
    game.playerHands[i].soft = playerTotal.soft;
  }

  return gameState;
}

function deal(game, betAmount) {
  const newHand = {bet: 0, busted: false, cards: []};

  // Make sure the betAmount is valid
  newHand.bet = Number(betAmount);
  game.bankroll -= newHand.bet;
  newHand.outcome = 'playing';

  // Clear out the hands
  game.dealerHand.cards = [];
  game.playerHands = [];

  // Now deal the cards
  newHand.cards.push(game.deck.cards.shift());
  game.dealerHand.cards.push(game.deck.cards.shift());
  newHand.cards.push(game.deck.cards.shift());
  game.dealerHand.cards.push(game.deck.cards.shift());
  game.playerHands.push(newHand);

  // Reset state variables
  game.specialState = null;
  game.lastBet = betAmount;
  game.dealerHand.outcome = 'playing';

  // And set the next hand (to the player)
  game.activePlayer = 'none';
  game.currentPlayerHand = 0;
  nextHand(game);
}

function shuffleDeck(game) {
  // Start by initializing the deck
  let i;
  let rank;

  game.deck.cards = [];
  const suits = ['C', 'D', 'H', 'S'];
  for (i = 0; i < game.rules.numberOfDecks; i++) {
    for (rank = 1; rank <= 13; rank++) {
      suits.map((item) => {
        game.deck.cards.push({'rank': rank, 'suit': item});
      });
    }
  }

  // OK, let's shuffle the deck - we'll do this by going thru
  // 10 * number of cards times, and swap random pairs each iteration
  // Yeah, there are probably more elegant solutions but this should do the job
  for (i = 0; i < game.rules.numberOfDecks * 520; i++) {
    const card1 = Math.floor(Math.random() * game.rules.numberOfDecks * 52);
    const card2 = Math.floor(Math.random() * game.rules.numberOfDecks * 52);
    const tempCard = game.deck.cards[card1];

    game.deck.cards[card1] = game.deck.cards[card2];
    game.deck.cards[card2] = tempCard;
  }

  // Clear out all hands
  game.activePlayer = 'none';
  game.dealerHand.cards = [];
  game.playerHands = [];
}

function setNextActions(game) {
  // Lots of special rules if you split Aces
  const splitAces = (game.activePlayer == 'player') && ((game.playerHands.length > 1) && (game.playerHands[game.currentPlayerHand].cards[0].rank == 1));

  game.possibleActions = [];

  // Special situations if we just dealt
  if ((game.activePlayer == 'player') && (game.playerHands.length == 1) && (game.playerHands[0].cards.length == 2)) {
    // Insurance if the dealer has an ace showing
    // and they haven't already taken action on insurance
    if ((game.dealerHand.cards[1].rank == 1) && (game.specialState == null)) {
      // To take insurance, they have to have enough in the bankroll
      if ((game.playerHands[0].bet / 2) <= game.bankroll) {
        game.possibleActions.push('insurance');
      }

      game.possibleActions.push('noinsurance');

      // Do we offer early surrender?
      if (game.rules.surrender == 'early') {
        game.possibleActions.push('surrender');
      }
      return;
    }

    // Surrender
    if (game.rules.surrender != 'none') {
        game.possibleActions.push('surrender');
    }
  }

  // Other actions are only available for the first two cards of a hand
  if ((game.activePlayer == 'player') && (game.playerHands[game.currentPlayerHand].cards.length == 2)) {
    // Double down - not allowed if you split Aces
    if (!splitAces && (game.playerHands[game.currentPlayerHand].bet <= game.bankroll)) {
      // Whether you can double is dictated by either
      // the rules.double or rules.doubleaftersplit variable
      const doubleRules = (game.playerHands.length == 1) ? game.rules.double : (game.rules.doubleaftersplit ? game.rules.double : 'none');
      const playerTotal = handTotal(game.playerHands[game.currentPlayerHand].cards).total;

      switch (doubleRules) {
        case 'any':
          // You can double
          game.possibleActions.push('double');
          break;

        case '10or11':
          if ((playerTotal == 10) || (playerTotal == 11)) {
            game.possibleActions.push('double');
          }
          break;

        case '9or10or11':
          if ((playerTotal >= 9) && (playerTotal <= 11)) {
            game.possibleActions.push('double');
          }
          break;

        default:
          break;
      }
    }

    // Split
    const currentHand = game.playerHands[game.currentPlayerHand];
    if (((currentHand.cards[0].rank == currentHand.cards[1].rank)
        || ((currentHand.cards[0].rank > 9) && (currentHand.cards[1].rank > 9)))
        && (currentHand.bet <= game.bankroll)) {
      // OK, they can split if they haven't reached the maximum number of allowable hands
      if (game.playerHands.length < game.rules.maxSplitHands) {
        // Oh - one more case; if they had Aces we have to check the resplit Aces rule
        if (!splitAces || game.rules.resplitAces) {
          game.possibleActions.push('split');
        }
      }
    }
  }

  if (game.activePlayer == 'player') {
    // We want hit/stand to be the first actions
    // If it's your turn, you can stand
    game.possibleActions.unshift('stand');

    // You can hit as long as you don't have 21
    if (handTotal(game.playerHands[game.currentPlayerHand].cards).total < 21) {
      // One more case - if you split Aces you only get one card (so you can't hit)
      if (!splitAces) {
        game.possibleActions.unshift('hit');
      }
    }
  }

  if (game.activePlayer == 'none') {
    // At this point you can either bet (next hand) or shuffle if there
    // aren't enough cards.  If you are out of money (and can't cover the minimum bet),
    // we make you first reset the bankroll
    if (game.bankroll < game.rules.minBet) {
      game.possibleActions.push('resetbankroll');
    } else if (game.deck.cards.length > 20) {
      game.possibleActions.push('bet');
    } else {
      game.possibleActions.push('shuffle');
    }
  }
}

function nextHand(game) {
  // If it's none, it goes to player 0
  if (game.activePlayer == 'none') {
    // It is the player's turn -- UNLESS the dealer has a blackjack with a 10 up
    // In that case, the hand is immediately over (goes to the dealer's turn)
    if ((handTotal(game.dealerHand.cards).total == 21) && (game.dealerHand.cards[1].rank != 1)) {
      // OK, mark it as the dealer's turn to cause the card to flip and end the game
      game.activePlayer = 'dealer';
    } else {
      game.activePlayer = 'player';
      game.currentPlayerHand = 0;
    }
  } else if (game.activePlayer == 'player') {
      if (game.currentPlayerHand < game.playerHands.length - 1) {
        // Still the player's turn - move to the next hand
        // Note that we'll probably need to give them a second card
        game.currentPlayerHand++;
        if (game.playerHands[game.currentPlayerHand].cards.length < 2) {
          game.playerHands[game.currentPlayerHand].cards.push(game.deck.cards.shift());
        }
      } else {
        // Now it's the dealer's turn
        game.activePlayer = 'dealer';
      }
  } else {
    // It was the dealer's turn - back to none
    game.activePlayer = 'none';
  }
}

function playDealerHand(game) {
  let handValue = handTotal(game.dealerHand.cards);
  let allPlayerHandsBusted = true; // Assume everyone busted until proven otherwise
  const playerBlackjack = ((game.playerHands.length == 1)
    && (handTotal(game.playerHands[0].cards).total == 21)
    && (game.playerHands[0].cards.length == 2));

  // If all players have busted, we won't play thru
  for (let i = 0; i < game.playerHands.length; i++) {
    if (!game.playerHands[i].busted) {
      // Someone didn't bust
      allPlayerHandsBusted = false;
      break;
    }
  }

  // If all hands busted, or player has blackjack, or player surrendered we don't play
  if (!allPlayerHandsBusted && !playerBlackjack && (game.specialState != 'surrender')) {
    while ((handValue.total < 17) ||
        ((handValue.total == 17) && game.rules.hitSoft17 && handValue.soft)) {
      game.dealerHand.cards.push(game.deck.cards.shift());
      handValue = handTotal(game.dealerHand.cards);
    }
  }

  // We're done with the dealer hand
  nextHand(game);
}

function determineWinner(game, playerHand) {
  const dealerTotal = handTotal(game.dealerHand.cards).total;
  const playerTotal = handTotal(playerHand.cards).total;
  const dealerBlackjack = ((dealerTotal == 21) && (game.dealerHand.cards.length == 2));
  const playerBlackjack = ((game.playerHands.length == 1)
        && (playerTotal == 21) && (playerHand.cards.length == 2));

  // Did they surrender?  If so, that's that
  if (game.specialState == 'surrender') {
    playerHand.outcome = 'surrender';
  } else {
    // Did they take insurance?  If they did and the dealer has a blackjack, they win
    if (game.specialState == 'insurance') {
      // Note that insurance bets are off the initial bet (not the doubled amount)
      if (dealerBlackjack) {
        // Well what do you know
        game.bankroll += (3 * playerHand.bet / 2);
      }
    }

    // Start with blackjack
    if (playerBlackjack) {
      playerHand.outcome = (dealerBlackjack) ? 'push' : 'blackjack';
    } else if (dealerBlackjack) {
      game.dealerHand.outcome = 'dealerblackjack';
      playerHand.outcome = 'loss';
    } else if (playerTotal > 21) {
      playerHand.outcome = 'loss';
    } else {
      if (dealerTotal > 21) {
        playerHand.outcome = 'win';
      } else if (playerTotal > dealerTotal) {
        playerHand.outcome = 'win';
      } else if (playerTotal < dealerTotal) {
        playerHand.outcome = 'loss';
      } else {
        playerHand.outcome = 'push';
      }
    }
  }

  switch (playerHand.outcome) {
    case 'blackjack':
      game.bankroll += (playerHand.bet * game.rules.blackjackBonus);
      // FALL THROUGH
    case 'win':
      game.bankroll += (playerHand.bet * 2);
      break;
    case 'push':
    case 'surrender':
      game.bankroll += playerHand.bet;
      break;
    default:
      // I already took the money off the bankroll, you don't get any back
      break;
  }
}

/*
 * Changes the rules of the game - note that any rule that isn't set in the
 * new structure is inherited from the old structure
 */
function changeRules(oldRules, newRules) {
  const rules = {};

  rules.hitSoft17 = (newRules.hasOwnProperty('hitSoft17') ? newRules.hitSoft17 : oldRules.hitSoft17);
  rules.surrender = (newRules.hasOwnProperty('surrender') ? newRules.surrender : oldRules.surrender);
  rules.double = (newRules.hasOwnProperty('double') ? newRules.double : oldRules.double);
  rules.doubleaftersplit = (newRules.hasOwnProperty('doubleaftersplit') ? newRules.doubleaftersplit : oldRules.doubleaftersplit);
  rules.resplitAces = (newRules.hasOwnProperty('resplitAces') ? newRules.resplitAces : oldRules.resplitAces);
  rules.blackjackBonus = (newRules.hasOwnProperty('blackjackBonus') ? newRules.blackjackBonus : oldRules.blackjackBonus);
  rules.numberOfDecks = (newRules.hasOwnProperty('numberOfDecks') ? newRules.numberOfDecks : oldRules.numberOfDecks);
  rules.minBet = (newRules.hasOwnProperty('minBet') ? newRules.minBet : oldRules.minBet);
  rules.maxBet = (newRules.hasOwnProperty('maxBet') ? newRules.maxBet : oldRules.maxBet);
  rules.maxSplitHands = (newRules.hasOwnProperty('maxSplitHands') ? newRules.maxSplitHands : oldRules.maxSplitHands);

  return rules;
}

function handTotal(cards) {
  const retval = {total: 0, soft: false};
  let hasAces = false;

  for (let i = 0; i < cards.length; i++) {
    if (cards[i].rank > 10) {
      retval.total += 10;
    } else {
      retval.total += cards[i].rank;
    }

    // Note if there's an ace
    if (cards[i].rank == 1) {
      hasAces = true;
    }
  }

  // If there are aces, add 10 to the total (unless it would go over 21)
  // Note that in this case the hand is soft
  if ((retval.total <= 11) && hasAces) {
    retval.total += 10;
    retval.soft = true;
  }

  return retval;
}
