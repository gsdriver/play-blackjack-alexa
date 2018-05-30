//
// Provides playing suggestions for Spanish 21
// Taken from https://wizardofodds.com/games/spanish-21/
//

// H - Hit; S - Stand; Sn - Stand, except Hit with N or more cards
// P - Split; PS - Split, except hit suited sevens
// D - Double; Dn - Double, except hit with N or more cards
// R - Surrender
const hardTotals = {
  4: {2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  5: {2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  6: {2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  7: {2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  8: {2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  9: {2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'D4', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  10: {2: 'DS', 3: 'DS', 4: 'D', 5: 'D', 6: 'D', 7: 'D4', 8: 'D3', 9: 'H', 10: 'H', 1: 'H'},
  11: {2: 'D4', 3: 'D5', 4: 'D5', 5: 'D5', 6: 'D5', 7: 'D4', 8: 'D4', 9: 'D4', 10: 'D3', 1: 'D3'},
  12: {2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  13: {2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  14: {2: 'H', 3: 'H', 4: 'S4', 5: 'S5', 6: 'S4', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  15: {2: 'S4', 3: 'S5', 4: 'S5', 5: 'S6', 6: 'S6', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  16: {2: 'S5', 3: 'S6', 4: 'S6', 5: 'S', 6: 'S', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  17: {2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S6', 9: 'S6', 10: 'S6', 1: 'R'},
  18: {2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 1: 'S'},
  19: {2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 1: 'S'},
  20: {2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 1: 'S'},
  21: {2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 1: 'S'},
};

const softTotals = {
  12: {2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  13: {2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  14: {2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  15: {2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  16: {2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'D4', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  17: {2: 'H', 3: 'H', 4: 'D3', 5: 'D4', 6: 'D5', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  18: {2: 'S4', 3: 'S4', 4: 'D4', 5: 'D5', 6: 'D5', 7: 'S6', 8: 'S4', 9: 'H', 10: 'H', 1: 'H'},
  19: {2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S6', 1: 'S'},
  20: {2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S6', 1: 'S'},
  21: {2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S6', 1: 'S'},
};

const pairs = {
  2: {2: 'P', 3: 'P', 4: 'P', 5: 'P', 6: 'P', 7: 'P', 8: 'P', 9: 'H', 10: 'H', 1: 'H'},
  3: {2: 'P', 3: 'P', 4: 'P', 5: 'P', 6: 'P', 7: 'P', 8: 'P', 9: 'H', 10: 'H', 1: 'H'},
  6: {2: 'H', 3: 'H', 4: 'P', 5: 'P', 6: 'P', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  7: {2: 'P', 3: 'P', 4: 'P', 5: 'P', 6: 'P', 7: 'PS', 8: 'H', 9: 'H', 10: 'H', 1: 'H'},
  8: {2: 'P', 3: 'P', 4: 'P', 5: 'P', 6: 'P', 7: 'P', 8: 'P', 9: 'P', 10: 'P', 1: 'P'},
  9: {2: 'S', 3: 'P', 4: 'P', 5: 'P', 6: 'P', 7: 'S', 8: 'P', 9: 'P', 10: 'S', 1: 'S'},
  1: {2: 'P', 3: 'P', 4: 'P', 5: 'P', 6: 'P', 7: 'P', 8: 'P', 9: 'P', 10: 'P', 1: 'P'},
};

module.exports = {
  suggestion: function(cards, dealerCard) {
    const total = handTotal(cards);
    const isPair = ((cards.length == 2) &&
      ((cards[0].rank == cards[1].rank) || ((cards[0].rank >= 10) && (cards[1].rank >= 10))));
    let suggest;
    let result;

    if (isPair && pairs[cards[0].rank]) {
      suggest = pairs[cards[0].rank][dealerCard];
    } else if (total.soft) {
      suggest = softTotals[total.total][dealerCard];
    } else {
      suggest = hardTotals[total.total][dealerCard];
    }

    switch (suggest) {
      case 'H':
        result = 'hit';
        break;
      case 'S':
        result = 'stand';
        break;
      case 'S4':
        result = (cards.length >= 4) ? 'hit' : 'stand';
        break;
      case 'S5':
        result = (cards.length >= 5) ? 'hit' : 'stand';
        break;
      case 'S6':
        result = (cards.length >= 6) ? 'hit' : 'stand';
        break;
      case 'P':
        result = 'split';
        break;
      case 'PS':
        result = (cards[0].suit == cards[1].suit) ? 'hit' : 'split';
        break;
      case 'D':
        result = 'double';
        break;
      case 'D3':
        result = (cards.length >= 3) ? 'hit' : 'double';
        break;
      case 'D4':
        result = (cards.length >= 4) ? 'hit' : 'double';
        break;
      case 'D5':
        result = (cards.length >= 5) ? 'hit' : 'double';
        break;
      case 'R':
        result = 'surrender';
        break;
      default:
        // Really shouldn't happen??
        console.log('Bad hand passed to Spanish suggestion');
        break;
    }

    return result;
  },
};

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
