const seedrandom = require('seedrandom');

// List of hard hands
// Total, hard/soft, pair/nopair, dealer upcard, % who play incorrectly
const hardHands = [
  '14,Hard,pair,10,98',
  '16,Hard,nopair,10,86',
  '18,Soft,nopair,3,79',
  '14,Hard,pair,8,79',
  '18,Soft,nopair,5,78',
  '19,Soft,nopair,6,77',
  '18,Soft,nopair,10,75',
  '18,Soft,nopair,6,74',
  '18,Soft,nopair,9,73',
  '18,Soft,nopair,4,73',
  '12,Hard,pair,7,73',
  '17,Soft,nopair,2,73',
  '8,Hard,nopair,5,73',
  '8,Hard,nopair,6,72',
  '10,Hard,pair,9,71',
  '17,Soft,nopair,3,67',
  '12,Hard,nopair,5,67',
  '14,Soft,nopair,4,66',
  '17,Soft,nopair,5,66',
  '12,Hard,nopair,4,66',
  '16,Soft,nopair,6,66',
  '17,Soft,nopair,6,64',
  '8,Hard,pair,5,64',
  '16,Soft,nopair,4,63',
  '17,Soft,nopair,4,63',
  '16,Soft,nopair,5,63',
  '18,Hard,pair,8,63',
  '14,Soft,nopair,5,62',
  '15,Soft,nopair,6,62',
  '17,Soft,nopair,7,62',
  '9,Hard,nopair,2,62',
  '15,Soft,nopair,4,62',
  '9,Hard,nopair,5,61',
  '13,Soft,nopair,4,61',
  '13,Soft,nopair,5,61',
  '4,Hard,pair,7,61',
  '8,Hard,pair,6,61',
  '9,Hard,nopair,4,61',
  '15,Soft,nopair,5,60',
  '13,Hard,nopair,2,60',
  '12,Hard,nopair,6,60',
  '9,Hard,nopair,3,59',
  '16,Hard,pair,10,59',
  '13,Soft,nopair,6,59',
  '14,Soft,nopair,6,59',
  '6,Hard,pair,8,58',
  '10,Hard,nopair,9,57',
  '10,Hard,pair,8,57',
  '9,Hard,nopair,6,57',
  '4,Hard,pair,3,57',
  '13,Hard,nopair,3,57',
  '18,Hard,pair,2,56',
  '12,Soft,pair,8,55',
  '14,Hard,pair,3,55',
  '18,Hard,pair,3,54',
  '12,Hard,pair,2,54',
  '14,Hard,pair,6,54',
  '4,Hard,pair,6,54',
  '13,Hard,nopair,6,54',
  '14,Hard,pair,2,54',
  '11,Hard,nopair,1,54',
  '10,Hard,nopair,8,54',
  '13,Hard,nopair,4,53',
  '10,Hard,pair,4,52',
  '11,Hard,nopair,10,52',
  '18,Hard,pair,5,52',
  '16,Hard,nopair,1,52',
  '14,Hard,pair,5,52',
  '4,Hard,pair,5,52',
  '10,Hard,pair,7,52',
  '13,Hard,nopair,5,52',
  '12,Soft,pair,9,51',
  '12,Soft,pair,10,51',
  '14,Hard,pair,4,51',
  '16,Hard,pair,9,51',
  '6,Hard,pair,7,50',
  '10,Hard,nopair,7,50',
  '12,Hard,pair,4,50',
  '12,Soft,pair,7,50',
  '16,Hard,nopair,7,50',
  '6,Hard,pair,6,49',
  '12,Hard,pair,5,49',
  '18,Hard,pair,6,49',
  '6,Hard,pair,2,49',
  '6,Hard,pair,5,49',
  '10,Hard,pair,6,49',
  '12,Soft,pair,5,48',
  '12,Soft,pair,6,48',
  '16,Hard,pair,6,48',
  '12,Soft,pair,3,48',
  '14,Hard,nopair,2,47',
  '12,Hard,pair,3,47',
  '14,Hard,nopair,5,46',
  '10,Hard,pair,2,46',
  '8,Hard,pair,2,46',
  '12,Soft,pair,4,46',
  '16,Hard,nopair,9,46',
  '11,Hard,nopair,9,45',
  '10,Hard,pair,3,45',
  '16,Hard,pair,5,45',
  '14,Hard,nopair,6,45',
  '16,Hard,pair,2,45',
  '18,Hard,pair,4,45',
  '11,Hard,nopair,8,45',
  '17,Soft,nopair,1,44',
  '14,Hard,nopair,3,44',
  '6,Hard,pair,4,44',
  '16,Hard,nopair,8,44',
  '16,Hard,pair,3,43',
  '8,Hard,pair,3,43',
  '14,Hard,nopair,4,42',
  '4,Hard,pair,4,41',
  '16,Hard,pair,4,41',
  '12,Soft,pair,2,41',
  '10,Hard,nopair,2,41',
  '11,Hard,nopair,7,40',
];

module.exports = {
  getInitialCards: function(game) {
    const randomValue = seedrandom(game.userID + (game.timestamp ? game.timestamp : ''))();
    let j = Math.floor(randomValue * hardHands.length);
    if (j == hardHands.length) {
      j--;
    }
console.log(hardHands[j]);
    const hand = hardHands[j].split(',');
    const cards = [];

    if (hand[2] === 'pair') {
      const rank = (hand[0] === 12) ? 1 : (hand[0] / 2);

      cards.push({'rank': rank, 'suit': 'S'});
      cards.push({'rank': rank, 'suit': 'H'});
    } else if (hand[1] === 'Soft') {
      const rank = (hand[0] - 11);

      cards.push({'rank': 1, 'suit': 'S'});
      cards.push({'rank': rank, 'suit': 'H'});
    } else {
      // Hard hand, no pair - pick two numbers from 2 - 10 that
      // will total the amount shown
      const minCard = Math.max(2, hand[0] - 10);
      let maxCard = Math.min(10, hand[0] - 2);

      if (maxCard === 10) {
        // Allow J-K
        maxCard = 13;
      }
      const val = seedrandom(game.userID + 'A' + (game.timestamp ? game.timestamp : ''))();
      const k = Math.floor(val * (maxCard - minCard + 1));
      if (k === (maxCard - minCard + 1)) {
        k--;
      }

      if ((2 * (minCard + k)) === hand[0]) {
        // No pairs!
        k = (k === 0) ? 1 : (k - 1);
      }

      cards.push({'rank': (minCard + k), 'suit': 'S'});
      cards.push({'rank': hand[0] - Math.min(10, minCard + k), 'suit': 'H'});
    }

    // And the dealer upcard - which goes between these two player cards
    const retCards = {player: cards, dealer: {'rank': parseInt(hand[3], 10), 'suit': 'C'}};
console.log(JSON.stringify(retCards));
    // Spit this out so we can verify
    console.log('Hard hand', JSON.stringify(hand));
    console.log('Cards', JSON.stringify(retCards));
    return retCards;
  },
  isHardHand: function(game) {
    const player = game.playerHands[0].cards;
    const dealer = Math.min(game.dealerHand.cards[1].rank, 10);
    const soft = (player[0].rank == 1) || (player[1].rank == 1);
    let total = Math.min(parseInt(player[0].rank, 10), 10)
      + Math.min(parseInt(player[1].rank, 10), 10);
    if (soft) {
      total += 10;
    }
    const pair = (Math.min(player[0].rank, 10) == Math.min(player[1].rank, 10));
    const str = total + ',' + (soft ? 'Soft' : 'Hard') + ',' + (pair ? 'pair' : 'nopair') + ',' + dealer;
    console.log(str);

    let hardHand = false;
    hardHands.forEach((hand) => {
      if (hand.startsWith(str)) {
        hardHand = true;
      }
    });

    return hardHand;
  },
};
