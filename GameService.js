//
// This is the Game Service module - this controls the playing of the
// game and does not include spoken output
//

const suggest = require('blackjack-strategy');
const bjUtils = require('./BlackjackUtils.js');
const request = require('request');
const seedrandom = require('seedrandom');

const STARTING_BANKROLL = 5000;

module.exports = {
  initializeGame: function(attributes, userID) {
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
       progressive: {
           bet: 5,                   // Amount of the side bet
           starting: 2500,           // Starting payout of the side bet
           jackpotRate: 1.25,        // Amount jackpot goes up with each hand played
       },
       activePlayer: 'none',
       currentPlayerHand: 0,
       specialState: null,
       bankroll: STARTING_BANKROLL,
       lastBet: 100,
       possibleActions: [],
       canReset: true,
    };

    // Start by shuffling the deck
    shuffleDeck(game, attributes.newUser);

    // Get the next possible actions
    setNextActions(game);

    // For now we only support the standard game
    attributes.standard = game;
    attributes.currentGame = 'standard';
  },
  initializeTournamentGame: function(attributes, userId) {
    attributes['tournament'] = {version: '1.0.0',
       userID: userId,
       deck: {cards: []},
       dealerHand: {cards: []},
       playerHands: [],
       rules: {
           hitSoft17: true,          // Does dealer hit soft 17
           surrender: 'none',        // Surrender offered - none, late, or early
           double: 'any',            // Double rules - none, 10or11, 9or10or11, any
           doubleaftersplit: true,   // Can double after split - none, 10or11, 9or10or11, any
           resplitAces: false,       // Can you resplit aces
           blackjackBonus: 0.5,      // Bonus for player blackjack, usually 0.5 or 0.2
           numberOfDecks: 4,         // Number of decks in play
           minBet: 5,                // The minimum bet - not configurable
           maxBet: 1000,             // The maximum bet - not configurable
           maxSplitHands: 4,         // Maximum number of hands you can have due to splits
       },
       activePlayer: 'none',
       currentPlayerHand: 0,
       specialState: null,
       bankroll: 25000,
       lastBet: 100,
       maxHands: 100,
       possibleActions: [],
       timestamp: Date.now(),
    };

    shuffleDeck(attributes['tournament']);
    setNextActions(attributes['tournament']);
    attributes.currentGame = 'tournament';
  },
  // Determines if this is the initial game state or not
  isDefaultGame: function(attributes) {
    const game = attributes[attributes.currentGame];

    // We only support one game type for now, but this could be different
    // if we had different rules by default for different games
    return ((game.activePlayer == 'none') && (game.bankroll == 5000) && (game.lastBet == 100)
      && (game.rules.hitSoft17 == false) && (game.rules.surrender == 'late')
      && (game.rules.double == 'any' && (game.rules.doubleaftersplit == true)
      && (game.rules.resplitAces == false) && (game.rules.blackjackBonus == 0.5)
      && (game.rules.numberOfDecks == 1)));
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
  userAction: function(attributes, action, value, callback) {
    const game = attributes[attributes.currentGame];
    let newCard;
    let error;

    // Is this a valid action?
    if ((action != 'setrules') && (game.possibleActions.indexOf[action] < 0)) {
      // I'm sorry Dave, I can't do that
      error = 'Invalid action';
      return;
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
          error = 'bettoosmall';
        } else if (value > game.bankroll) {
          error = 'betoverbankroll';
        } else if (value > game.rules.maxBet) {
          error = 'bettoolarge';
        } else {
          deal(attributes, value);
        }
        break;

      case 'sidebet':
        game.sideBetPlaced = true;
        game.specialState = 'sidebet';
        break;

      case 'nosidebet':
        game.sideBetPlaced = false;
        break;

      case 'hit':
        // Pop the top card off the deck for the player
        newCard = game.deck.cards.shift();
        game.playerHands[game.currentPlayerHand].cards.push(newCard);

        // If they busted, it is the dealer's turn
        const total = handTotal(game.playerHands[game.currentPlayerHand].cards).total;
        if (total > 21) {
          // Sorry, you lose - it's the dealer's turn now
          game.playerHands[game.currentPlayerHand].busted = true;
          nextHand(game);
        } else if (total == 21) {
          // You have 21 - go to the next hand
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
        newCard = game.deck.cards.shift();
        game.playerHands[game.currentPlayerHand].cards.push(newCard);
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
        newCard = game.deck.cards.shift();
        game.playerHands[game.currentPlayerHand].cards.push(newCard);

        // And add this to the player's hand.  Whew
        game.playerHands.push(newHand);
        break;

      default:
        // Hmm .. how did this not get caught above?
        error = 'Unknown Action';
    }

    if (!error) {
      // If this the the third card, and the first two cards
      // were seven and this is a seven, track it
      if (newCard && (newCard.rank === 7) && (game.numSevens === 2)) {
        let totalCards = 0;

        game.playerHands.map((hand) => {
          totalCards += hand.cards.length;
        });

        if (totalCards === 3) {
          game.numSevens++;
        }
      }

      // If it's the dealer's turn, then we'll play the dealer hand,
      // unless the player already busted
      if (game.activePlayer == 'dealer') {
        playDealerHand(game);

        for (let i = 0; i < game.playerHands.length; i++) {
          determineWinner(game, game.playerHands[i]);
        }

        // And the side bet winner
        determineSideBetWinner(attributes, (winAmount) => {
          game.sideBetWin = winAmount;
          setNextActions(game);
          updateGame(game);
          callback(error);
        });
        return;
      }

      setNextActions(game);
      updateGame(game);
    }

    callback(error);
  },
};

/*
 * Internal functions
 */

function updateGame(game) {
  let dealerCards = game.dealerHand.cards;

  if ((game.activePlayer == 'player') && game.dealerHand.cards.length) {
    // Don't total the hole card
    dealerCards = dealerCards.slice(1);
  }

  // Also, set the total for the dealer and player hands
  const dealerTotal = handTotal(dealerCards);
  game.dealerHand.total = dealerTotal.total;
  game.dealerHand.soft = dealerTotal.soft;

  for (i = 0; i < game.playerHands.length; i++) {
    const playerTotal = handTotal(game.playerHands[i].cards);

    game.playerHands[i].total = playerTotal.total;
    game.playerHands[i].soft = playerTotal.soft;
  }
}

function deal(attributes, betAmount) {
  const game = attributes[attributes.currentGame];
  const newHand = {bet: 0, busted: false, cards: []};

  // Make sure the betAmount is valid
  newHand.bet = Number(betAmount);
  game.bankroll -= newHand.bet;
  newHand.outcome = 'playing';

  // If they have a side bet, take that money too
  if (game.sideBetPlaced) {
    if (game.bankroll < game.progressive.bet) {
      // You don't have enough money for the side bet - clear it
      game.sideBetPlaced = false;
    } else {
      game.bankroll -= game.progressive.bet;
    }
  }

  // Clear out the hands
  game.dealerHand.cards = [];
  game.playerHands = [];
  game.sideBetWin = undefined;

  // Now deal the cards
  newHand.cards.push(game.deck.cards.shift());
  game.dealerHand.cards.push(game.deck.cards.shift());
  newHand.cards.push(game.deck.cards.shift());
  game.dealerHand.cards.push(game.deck.cards.shift());
  game.playerHands.push(newHand);

  // Count the sevens!
  game.numSevens = 0;
  if (newHand.cards[0].rank === 7) {
    game.numSevens++;
    if (newHand.cards[1].rank === 7) {
      game.numSevens++;
    }
  }

  // Reset state variables
  game.specialState = null;
  game.lastBet = betAmount;
  game.dealerHand.outcome = 'playing';

  // And set the next hand (to the player)
  game.activePlayer = 'none';
  game.currentPlayerHand = 0;
  nextHand(game);

  // If there was a side bet placed, increment the progressive count
  if (game.sideBetPlaced) {
    bjUtils.incrementProgressive(attributes);
  }
}

function shuffleDeck(game, newPlayer) {
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
    const randomValue1 = seedrandom(i + game.userID + (game.timestamp ? game.timestamp : ''))();
    const randomValue2 = seedrandom('A' + i + game.userID + (game.timestamp ? game.timestamp : ''))();
    const card1 = Math.floor(randomValue1 * game.rules.numberOfDecks * 52);
    const card2 = Math.floor(randomValue2 * game.rules.numberOfDecks * 52);
    if (card1 == game.rules.numberOfDecks * 52) {
      card1--;
    }
    if (card2 == game.rules.numberOfDecks * 52) {
      card2--;
    }
    const tempCard = game.deck.cards[card1];

    game.deck.cards[card1] = game.deck.cards[card2];
    game.deck.cards[card2] = tempCard;
  }

  // If this is a brand-new player, we'll guarantee a win
  if (newPlayer) {
    game.deck.cards.unshift({'rank': 7, 'suit': 'C'});
    game.deck.cards.unshift({'rank': 9, 'suit': 'S'});
    game.deck.cards.unshift({'rank': 11, 'suit': 'D'});
    game.deck.cards.unshift({'rank': 10, 'suit': 'C'});
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
      if (game.progressive
          && !game.sideBetPlaced
          && ((game.bankroll - game.progressive.bet) >= game.rules.minBet)) {
        game.possibleActions.push('sidebet');
      }
    }

    // Shuffle if there aren't enough cards to play
    if (game.deck.cards.length <= 20) {
      game.possibleActions.push('shuffle');
    }

    // If they placed a side bet, they can remove it
    if (game.sideBetPlaced) {
      game.possibleActions.push('nosidebet');
    }
  }
}

function nextHand(game) {
  // If it's none, it goes to player 0
  if (game.activePlayer == 'none') {
    // It's the player's turn unless the player has a blackjack (and the dealer doesn't
    // have an ace showing), or if the dealer has a blackjack with a 10 up
    game.currentPlayerHand = 0;
    if (handTotal(game.playerHands[0].cards).total == 21) {
      game.activePlayer = (game.dealerHand.cards[1].rank == 1) ? 'player' : 'dealer';
    } else if ((handTotal(game.dealerHand.cards).total == 21) && (game.dealerHand.cards[1].rank != 1)) {
      // OK, mark it as the dealer's turn to cause the card to flip and end the game
      game.activePlayer = 'dealer';
    } else {
      game.activePlayer = 'player';
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

function determineSideBetWinner(attributes, callback) {
  // Let's pay the side bet
  const game = attributes[attributes.currentGame];

  if (game.progressive && game.sideBetPlaced) {
    switch (game.numSevens) {
      case 1:
        // Pays 25 units
        game.bankroll += 25;
        callback(25);
        break;
      case 2:
        // Pays 100 units
        game.bankroll += 100;
        callback(100);
        break;
      case 3:
        // Pays the progressive!
        bjUtils.getProgressivePayout(attributes, (jackpot) => {
          const params = {
            url: process.env.SERVICEURL + 'blackjack/updateJackpot',
            formData: {
              jackpot: jackpot,
              game: attributes.currentGame,
              userId: game.userID,
              resetProgressive: 'true',
            },
          };
          request.post(params, (err, res, body) => {
          });

          game.bankroll += jackpot;
          game.progressiveJackpot = game.progressive.starting;
          callback(jackpot);
        });
        break;
      default:
        // Sorry, you didn't win
        callback(0);
        break;
    }
  } else {
    // No side bet, no winner
    callback(undefined);
  }
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

