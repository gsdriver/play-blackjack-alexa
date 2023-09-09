//
// This is the Game Service module - this controls the playing of the
// game and does not include spoken output
//

const suggest = require('blackjack-strategy');
const bjUtils = require('./BlackjackUtils');
const tournament = require('./tournament');
const request = require('request');
const seedrandom = require('seedrandom');
const hardHands = require('./hardHands');

const STARTING_BANKROLL = 5000;
const REFRESH_BANKROLL = 500;

availableGames = {
  'standard': {version: '1.0.0',
     deck: {cards: []},
     dealerHand: {cards: []},
     playerHands: [],
     rules: {
       hitSoft17: false,         // Does dealer hit soft 17
       surrender: 'late',        // Surrender offered - none, late, or early
       double: '10or11',         // Double rules - none, 10or11, 9or10or11, any
       doubleaftersplit: false,  // Can double after split - none, 10or11, 9or10or11, any
       resplitAces: false,       // Can you resplit aces
       blackjackBonus: 0.5,      // Bonus for player blackjack, usually 0.5 or 0.2
       numberOfDecks: 4,         // Number of decks in play
       minBet: 5,                // The minimum bet - not configurable
       maxBet: 5000,             // The maximum bet - not configurable
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
     bankrollRefresh: REFRESH_BANKROLL,
     lastBet: 100,
     possibleActions: [],
     canReset: true,
     canChangeRules: true,
  },
  'training': {version: '1.0.0',
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
       maxBet: 5000,             // The maximum bet - not configurable
       maxSplitHands: 4,         // Maximum number of hands you can have due to splits
     },
     activePlayer: 'none',
     currentPlayerHand: 0,
     specialState: null,
     bankroll: STARTING_BANKROLL,
     bankrollRefresh: REFRESH_BANKROLL,
     lastBet: 100,
     possibleActions: [],
     canReset: true,
     useTrainingHands: true,
     alwaysShuffle: true,
     canChangeRules: false,
  },
  'tournament': {version: '1.0.0',
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
       maxBet: 5000,             // The maximum bet - not configurable
       maxSplitHands: 4,         // Maximum number of hands you can have due to splits
     },
     activePlayer: 'none',
     currentPlayerHand: 0,
     specialState: null,
     bankroll: 25000,
     bankrollRefresh: 0,
     lastBet: 100,
     maxHands: 100,
     possibleActions: [],
  },
  'spanish': {version: '1.0.0',
    removeCards: [10],
    deck: {cards: []},
    dealerHand: {cards: []},
    playerHands: [],
    rules: {
      hitSoft17: false,           // Does dealer hit soft 17
      surrender: 'late',          // Surrender offered - none, late, or early
      double: 'anyCards',         // Double rules - anyCards means any time, any number of cards
      doubleaftersplit: true,     // Can double after split - none, 10or11, 9or10or11, any
      resplitAces: true,          // Can you resplit aces
      blackjackBonus: 0.5,        // Bonus for player blackjack, usually 0.5 or 0.2
      numberOfDecks: 6,           // Number of decks in play
      minBet: 5,                  // The minimum bet - not configurable
      maxBet: 5000,               // The maximum bet - not configurable
      maxSplitHands: 4,           // Maximum number of hands you can have due to splits
      surrenderAfterDouble: true, // Can you surrender after doubling?
      pay21: {
        playerWin: true,          // Does 21 always win (not push)
        handLength: {             // 21 with this many cards pays this payout
          5: 1.5,
          6: 2,
          max: {                  // This many or more pays this payout
            cards: 7,
            payout: 3,
          },
        },
        cardCombos: {             // 21 with this combination of cards pays this payout
                                  // Pays out even after split; not if double down
          '6|7|8': 1.5,
          '7|7|7': 1.5,
          'suit': {               // Payout when all cards are same suit
            'C': 2,
            'D': 2,
            'H': 2,
            'S': 3,
          },
        },
      },
    },
    superBonus: true,            // Suited 7-7-7 against dealer 7 pays $1000 for bets under $25;
                                 // $5000 for bets over $25 - not on split/double down
    activePlayer: 'none',
    currentPlayerHand: 0,
    specialState: null,
    bankroll: STARTING_BANKROLL,
    bankrollRefresh: REFRESH_BANKROLL,
    lastBet: 100,
    possibleActions: [],
    readSuit: true,
    canReset: true,
  },
};

module.exports = {
  initializeGame: function(game, attributes, userID) {
    let newGame;

    if (availableGames[game]) {
      newGame = JSON.parse(JSON.stringify(availableGames[game]));
      newGame.userID = userID;

      // Set timestamp for tournament to avoid extra achievement points
      if (game == 'tournament') {
        newGame.timestamp = Date.now();
      }

      // Start by shuffling the deck
      shuffleDeck(newGame);
      newGame.dealerHand.cards = [];
      newGame.playerHands = [];

      // Get the next possible actions
      setNextActions(newGame);
      attributes[game] = newGame;
      attributes.currentGame = game;
    }

    return newGame;
  },
  // Gets a list of available games
  getAvailableGames: function(attributes) {
    const tournamentAvailable = tournament.canEnterTournament(attributes);
    let game;
    const games = [];

    for (game in availableGames) {
      if (game == 'tournament') {
        if (tournamentAvailable) {
          games.push(game);
        }
      } else if (game === 'standard') {
        games.push(game);
      } else {
        if (attributes.paid && attributes.paid[game] &&
            (attributes.paid[game].state == 'PURCHASED')) {
          games.push(game);
        } else if ((attributes.playerLocale == 'en-US') && (game === 'spanish') && process.env.SPANISHTRIAL) {
          games.push(game);
        }
      }
    }

    return games;
  },
  // Updates the attributes structure with new values if necessary
  updateGames: function(attributes) {
    for (game in availableGames) {
      if (attributes[game]) {
        attributes[game].bankrollRefresh = availableGames[game].bankrollRefresh;

        // Also reset the min and max bets
        attributes[game].rules.minBet = availableGames[game].rules.minBet;
        attributes[game].rules.maxBet = availableGames[game].rules.maxBet;
      }
    }
  },
  // Resets the list of actions after a bankroll reset
  resetActions: function(attributes) {
    const game = attributes[attributes.currentGame];

    setNextActions(game);
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
      // If there is only one possible action, return that
      if (game.possibleActions.length == 1) {
        return game.possibleActions[0];
      }

      // Spanish 21 is special case
      if (game.superBonus) {
        const spanishSuggest = require('./suggest-spanish');
        return spanishSuggest.suggestion(game.playerHands[game.currentPlayerHand].cards,
            ((game.dealerHand.cards[1].rank > 10) ? 10 : game.dealerHand.cards[1].rank));
      }
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
        // unless double is 'anyCard' (e.g. for Spanish 21)
        game.bankroll -= game.playerHands[game.currentPlayerHand].bet;
        game.playerHands[game.currentPlayerHand].bet *= 2;
        newCard = game.deck.cards.shift();
        game.playerHands[game.currentPlayerHand].cards.push(newCard);

        if (game.rules.double == 'anyCards') {
          // Still their turn unless they busted
          const total = handTotal(game.playerHands[game.currentPlayerHand].cards).total;
          if (total > 21) {
            // Sorry, you lose - it's the dealer's turn now
            game.playerHands[game.currentPlayerHand].busted = true;
            nextHand(game);
          } else if (total == 21) {
            // You have 21 - go to the next hand
            nextHand(game);
          }
        } else {
          nextHand(game);
        }
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

        // Any super bonus winner?
        game.superBonusWin = undefined;
        if (game.superBonus) {
          // Super bonus is 7-7-7 suited against a dealer 7
          if ((game.playerHands.length == 1) && (game.playerHands[0].bet == game.lastBet)) {
            const cards = game.playerHands[0].cards;

            if ((cards.length == 3) && (cards[0].rank == 7) &&
              (cards[1].rank == 7) && (cards[2].rank == 7) &&
              (cards[0].suit == cards[1].suit) && (cards[1].suit == cards[2].suit) &&
              (game.dealerHand.cards[1].rank == 7)) {
                // OMG - it's the super bonus!
                game.superBonusWin = (game.lastBet < 25) ? 1000 : 5000;
                game.bankroll += game.superBonusWin;
              }
          }
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
  if (attributes.temp.alwaysDealerBlackjack) {
    // Let's try to force a loss by giving the dealer a blackjack
    newHand.cards.push(game.deck.cards.shift());
    game.dealerHand.cards.push({'rank': 1, 'suit': 'S'});
    newHand.cards.push(game.deck.cards.shift());
    game.dealerHand.cards.push({'rank': 11, 'suit': 'C'});
  } else {
    newHand.cards.push(game.deck.cards.shift());
    game.dealerHand.cards.push(game.deck.cards.shift());
    newHand.cards.push(game.deck.cards.shift());
    game.dealerHand.cards.push(game.deck.cards.shift());
  }
  
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

  // Check if this is a "hard hand"
  if (!game.useTrainingHands) {
    game.isHardHand = hardHands.isHardHand(game);
  }
}

function shuffleDeck(game) {
  // Start by initializing the deck
  let i;
  let rank;
  const start = Date.now();

  game.deck.cards = [];
  const suits = ['C', 'D', 'H', 'S'];
  for (i = 0; i < game.rules.numberOfDecks; i++) {
    for (rank = 1; rank <= 13; rank++) {
      if (!game.removeCards || (game.removeCards.indexOf(rank) == -1)) {
        suits.map((item) => {
          game.deck.cards.push({'rank': rank, 'suit': item});
        });
      }
    }
  }

  // Shuffle using the Fisher-Yates algorithm
  for (i = 0; i < game.deck.cards.length - 1; i++) {
    const randomValue = seedrandom(i + game.userID + (game.timestamp ? game.timestamp : ''))();
    let j = Math.floor(randomValue * (game.deck.cards.length - i));
    if (j == (game.deck.cards.length - i)) {
      j--;
    }
    j += i;
    const tempCard = game.deck.cards[i];
    game.deck.cards[i] = game.deck.cards[j];
    game.deck.cards[j] = tempCard;
  }

  // If we are supposed to get a training hand, splice those cards out to the top of the deck
  if (game.useTrainingHands) {
    const trainingHand = hardHands.getInitialCards(game);
    const topCards = [trainingHand.player[0], trainingHand.player[1], trainingHand.dealer];

    topCards.forEach((card) => {
      game.deck.cards.forEach((deckCard, idx) => {
        if ((deckCard.rank === card.rank) && (deckCard.suit === card.suit)) {
          game.deck.cards.splice(idx, 1);
        }
      });
    });

    // Now add each of these to the top of the array
    const dealerHole = game.deck.cards.splice(0, 1);
    game.deck.cards.unshift(trainingHand.dealer);
    game.deck.cards.unshift(trainingHand.player[1]);
    game.deck.cards.unshift(dealerHole[0]);
    game.deck.cards.unshift(trainingHand.player[0]);
  }

  // Clear out all hands
  console.log('Shuffle took ' + (Date.now() - start) + ' ms');
  game.activePlayer = 'none';
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

  // If you can double any cards (Spanish 21), then set that as long as it's still their turn
  if ((game.activePlayer == 'player') && (game.rules.double == 'anyCards')
      && (game.playerHands[game.currentPlayerHand].bet <= game.bankroll)) {
    game.possibleActions.push('double');
  }

  if ((game.activePlayer == 'player') && game.rules.surrenderAfterDouble
    && (game.playerHands.length == 1) && (game.playerHands[0].cards.length == 3)
    && (game.playerHands[0].bet > game.lastBet)) {
    // Spanish 21 - surrender after double
    game.possibleActions.push('surrender');
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
      if (game.alwaysShuffle) {
        game.possibleActions.push('shuffle');
      }
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
    } else if ((handTotal(game.dealerHand.cards).total == 21)
        && (game.dealerHand.cards[1].rank != 1)) {
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
  let specialPayout;

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
      playerHand.outcome = (dealerBlackjack && !(game.rules.pay21 && game.rules.pay21.playerWin))
            ? 'push' : 'blackjack';
    } else if (dealerBlackjack) {
      game.dealerHand.outcome = 'dealerblackjack';
      playerHand.outcome = 'loss';
    } else if (playerTotal > 21) {
      playerHand.outcome = 'loss';
    } else if ((playerTotal == 21) && game.rules.pay21) {
      // Special payouts of 21's (as long as you didn't double)!
      playerHand.outcome = 'win';
      if (playerHand.bet == game.lastBet) {
        if (game.rules.pay21.handLength) {
          if (game.rules.pay21.handLength.max &&
            game.rules.pay21.handLength.max.cards &&
            playerHand.cards.length >= game.rules.pay21.handLength.max.cards) {
            specialPayout = game.rules.pay21.handLength.max.payout;
          } else if (game.rules.pay21.handLength[playerHand.cards.length]) {
            specialPayout = game.rules.pay21.handLength[playerHand.cards.length];
          }
        }
        if (game.rules.pay21.cardCombos) {
          // Do the cards math the pattern?
          let combo;
          let match;
          for (combo in game.rules.pay21.cardCombos) {
            if (!match && (combo !== 'suit')) {
              const ranks = combo.split('|');
              if (ranks.length == playerHand.cards.length) {
                // Sort playerCards
                const playerCards = JSON.parse(JSON.stringify(playerHand.cards));
                playerCards.sort((a, b) => (a.rank - b.rank));
                let i;

                match = combo;
                for (i = 0; i < playerCards.length; i++) {
                  if (playerCards[i].rank != ranks[i]) {
                    // No match
                    match = undefined;
                  }
                }
              }
            }
          }

          // Do we have a match?
          if (match) {
            // Great!  Are they suited?
            let isSuited;
            if (game.rules.pay21.cardCombos.suit) {
              isSuited = true;
              let i;

              for (i = 1; i < playerHand.cards.length; i++) {
                if (playerHand.cards[i].suit !== playerHand.cards[0].suit) {
                  isSuited = false;
                }
              }
            }

            if (isSuited) {
              specialPayout = game.rules.pay21.cardCombos.suit[playerHand.cards[0].suit];
            } else {
              specialPayout = game.rules.pay21.cardCombos[match];
            }
          }
        }
      }
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
      game.bankroll += Math.floor(playerHand.bet * game.rules.blackjackBonus);
      // FALL THROUGH
    case 'win':
      if (specialPayout) {
        console.log('Special payout ratio ' + specialPayout);
        game.bankroll += Math.floor((1 + specialPayout) * playerHand.bet);
      } else {
        game.bankroll += (playerHand.bet * 2);
      }
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

