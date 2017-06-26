//
// Localized resources
//

const resources = {
  // From index.js
  'UNKNOWNINTENT_RESET': 'Sorry, I didn\'t get that. Try saying Yes or No.',
  'UNKNOWNINTENT_RESET_REPROMPT': 'Try saying Yes or No.',
  'UNKNOWNINTENT_NEWGAME': 'Sorry, I didn\'t get that. Try saying Bet.',
  'UNKNOWNINTENT_NEWGAME_REPROMPT': 'Try saying Bet.',
  'UNKNOWNINTENT_INSURANCE_RESET': 'Sorry, I didn\'t get that. Try saying Yes or No.',
  'UNKNOWNINTENT_INSURANCE_REPROMPT': 'Try saying Yes or No.',
  'UNKNOWNINTENT_INGAME': 'Sorry, I didn\'t get that. Try saying Repeat to hear the current status.',
  'UNKNOWNINTENT_INGAME_REPROMPT': 'Try saying Repeat.',
  // From BlackjackUtils.js
  'ERROR_REPROMPT': 'What else can I help with?',
  'CHANGE_CARD_TEXT': 'You can change the following options:\n\n - HIT SOFT SEVENTEEN: whether the dealer will hit a soft 17 total. Can be ON or OFF.\n - SURRENDER: whether surrender is offered as an option. Can be ON or OFF.\n - DOUBLE DOWN: whether double down is offered or not.  Can be ON or OFF.\n - DOUBLE AFTER SPLIT: whether you can double down after splitting a pair.  Can be ON or OFF.\n - RESPLIT ACES: wheter you can resplit Aces or not.  Can be ON or OFF.\n - NUMBER OF DECKS: the number of decks in play. Can be ONE, TWO, FOUR, SIX, or EIGHT.\n - NUMBER OF SPLIT HANDS: the maximum number of hands you can have from splitting. Can be ONE, TWO, THREE, or FOUR.\n\nFor example, say "change number of decks to two" if you want to play with two decks.\nNote that the deck will be shuffled if you change the rules of the game',
  // From Betting.js
  'BAD_BET_FORMAT': 'Unable to place a bet for {0}',
  // From Blackjack.js
  'BLACKJACKINTENT_NO_ACTION': 'I\'m sorry, I didn\'t catch that action. Please say what you want to do on this hand like hit or stand. What else can I help with?',
  'BLACKJACKINTENT_UNKNOWN_ACTION': 'I\'m sorry, I don\'t understand how to {0}. Please provide an action like hit or stand. What else can I help with?',
  // From ChangeRules.js
  'CHANGERULES_NO_RULE': 'I\'m sorry, I didn\'t catch a rule to change. Check the Alexa companion app for rules you can change. What else can I help with?',
  'CHANGERULES_NO_RULE_VALUE': 'I\'m sorry, I don\'t understand how to change {0}. Check the Alexa companion app for rules you can change. What else can I help with?',
  'CHANGERULES_NO_RULE_OPTION': 'I\'m sorry, I didn\'t catch how to change {0}. Check the Alexa companion app for rules you can change. What else can I help with?',
  'CHANGERULES_CANT_CHANGE_RULE': 'I\'m sorry, I was unable to change {0} to {1}. Check the Alexa companion app for available rules you can change. What else can I help with?',
  'CHANGERULES_CARD_TITLE': 'Play Blackjack',
  'FULL_RULES': 'The full rules are {0}',
  // From Exit.js
  'EXIT_BANKROLL': 'You are leaving with £{0}.',
  'EXIT_GOODBYE': 'Goodbye.',
  // From Help.js
  'HELP_GENERIC_HELP': 'You can play a game by saying Deal, or you can say exit<break time=\'300ms\'/>Now, what can I help you with?',
  'HELP_CARD_TITLE': 'Blackjack Commands',
  'HELP_CARD_TEXT': 'You can say BET to place a bet. If no amount is mentioned, the game will use the last amount bet.\nDuring a hand, ask WHAT SHOULD I DO to hear the Basic Strategy suggestion.\nSay READ THE RULES if you would like to hear the rules currently in play.\nCHANGE will change the rules in play. You can change the following options:\n\n - HIT SOFT SEVENTEEN: whether the dealer will hit a soft 17 total. Can be ON or OFF.\n - SURRENDER: whether surrender is offered as an option. Can be ON or OFF.\n - DOUBLE DOWN: whether double down is offered or not.  Can be ON or OFF.\n - DOUBLE AFTER SPLIT: whether you can double down after splitting a pair.  Can be ON or OFF.\n - RESPLIT ACES: wheter you can resplit Aces or not.  Can be ON or OFF.\n - NUMBER OF DECKS: the number of decks in play. Can be ONE, TWO, FOUR, SIX, or EIGHT.\n - NUMBER OF SPLIT HANDS: the maximum number of hands you can have from splitting. Can be ONE, TWO, THREE, or FOUR.\n\nFor example, say "change number of decks to two" if you want to play with two decks.\nNote that the deck will be shuffled if you change the rules of the game',
  // From Launch.js
  'LAUNCH_WELCOME': 'Welcome to the Blackjack player. ',
  'LAUNCH_STARTGAME': 'You can start a blackjack game by saying Bet ... Now, what can I help you with?',
  'LAUNCH_DEFAULTSTATE_TEXT': 'You have £{0}. Say bet to start a new game. ... Now, what can I help you with?',
  'LAUNCH_NONDEFAULTSTATE_TEXT': 'You have £{0}. Say bet to start a new game or reset game to reset to the default rules and bankroll. ... Now, what can I help you with?',
  // From Reset.js
  'RESET_CONFIRM': 'Would you like to reset the game? This will reset your bankroll and rules of the game.',
  'RESET_COMPLETED': 'You have £5000. Say bet to start a new game.',
  'RESET_REPROMPT': 'Say bet to start a new game.',
  'RESET_ABORTED': 'Game not reset. Say bet to start a new game.',
  // From Rules.js
  'RULES_CARD_TITLE': 'Blackjack Rules',
  // From PlayGame.js
  'SUGGEST_OPTIONS': 'You should {0}|The book says you should {0}|The book would tell you to {0}|According to Basic Strategy you should {0}|The book would suggest that you {0}|I think you should {0}|Basic Strategy would suggest you {0}',
  'SUGGEST_TURNOVER': 'I can\'t give a suggestion when the game is over',
  'REPORT_ERROR': 'There was an error: {0}',
  'INVALID_ACTION': 'I\'m sorry, {0} is not a valid action at this time. ',
  'YOU_BET_TEXT': 'You bet £{0}. ',
  'YOUR_BANKROLL_TEXT': 'You have £{0}. ',
  'HELP_TAKE_INSURANCE': 'You can say yes to take insurance or no to decline insurance.',
  'HELP_INSURANCE_INSUFFICIENT_BANKROLL': 'You don\'t have enough money to take insurance - say no to decline insurance.',
  'HELP_YOU_CAN_SAY': 'You can say {0}.',
  'HELP_MORE_OPTIONS': ' For more options, please check the Alexa companion application.<break time=\'300ms\'/> What can I help you with?',
  'INTERNAL_ERROR': 'Sorry, internal error. What else can I help with?',
  'CHANGERULES_REPROMPT': 'Would you like to bet?',
  'CHANGERULES_CHECKAPP': ' Check the Alexa companion application for the full set of rules. Would you like to bet?',
  'SPEECH_ERROR_CODE': 'Error code {0}',
  'ASK_TAKE_INSURANCE': 'Do you want to take insurance?  Say yes or no.',
  'ASK_POSSIBLE_ACTIONS': 'Would you like to {0}?',
  'ASK_WHAT_TO_DO': 'What would you like to do?',
  'ASK_PLAY_AGAIN': 'Would you like to play again?',
  'RESULT_AFTER_HIT_BUST': 'You got a {0} and busted. ',
  'RESULT_AFTER_HIT_NOBUST': 'You got a {0} for a total of {1}. ',
  'RESULT_BANKROLL_RESET': 'Bankroll reset',
  'RESULT_DECK_SHUFFLED': 'Deck shuffled',
  'DEALER_HOLE_CARD': 'The dealer had a {0} down.',
  'DEALER_BUSTED': ' The dealer busted.',
  'DEALER_BLACKJACK': ' The dealer has Blackjack.',
  'DEALER_TOTAL': ' The dealer had a total of {0}.',
  'DEALER_DRAW': ' The dealer drew ',
  'DEALER_CARD_ARTICLE': 'a {0}',
  'PLAYER_HIT_BUSTED': 'You got a {0} and busted. ',
  'DEALER_SHOWING': ' The dealer is showing a {0}.',
  'SPLIT_TENS': 'You split tens. ',
  'SPLIT_PAIR': 'You split a pair of {0}. ',
  'SURRENDER_RESULT': 'You surrendered. ',
  'DEALER_HAD_BLACKJACK': 'The dealer had a blackjack. ',
  'DEALER_NO_BLACKJACK': 'The dealer didn\'t have a blackjack. ',
  'READHAND_PLAYER_TOTAL_ACTIVE_BLACKJACK': 'You have {0} for a blackjack. ',
  'READHAND_PLAYER_TOTAL_END_BLACKJACK': 'You had {0} for a blackjack. ',
  'READHAND_PLAYER_BUSTED_SOFT': 'You busted with {0} for a total of soft {1}. ',
  'READHAND_PLAYER_TOTAL_ACTIVE_SOFT': 'You have {0} for a total of soft {1}.  ',
  'READHAND_PLAYER_TOTAL_END_SOFT': 'You had {0} for a total of soft {1}.  ',
  'READHAND_PLAYER_BUSTED': 'You busted with {0} for a total of {1}.  ',
  'READHAND_PLAYER_TOTAL_ACTIVE': 'You have {0} for a total of {1}.  ',
  'READHAND_PLAYER_TOTAL_END': 'You had {0} for a total of {1}.  ',
  'READHAND_DEALER_ACTIVE': 'The dealer has a {0} showing.',
  'READHAND_DEALER_DONE': 'The dealer had a {0} showing. ',
  'RULES_DECKS': '{0} deck game. ',
  'RULES_BET_RANGE': 'Bet from £{0} to £{1}. ',
  'RULES_HIT_SOFT17': 'Dealer hits on soft 17. ',
  'RULES_STAND_SOFT17': 'Dealer stands on soft 17. ',
  'RULES_RESPLIT_ACES': 'Can resplit Aces. ',
  'RULES_SPLIT_NOT_ALLOWED': 'Splitting hands is not allowed. ',
  'RULES_NUMBER_OF_SPLITS': 'Split up to {0} hands. ',
  'RULES_DAS_ALLOWED': 'Double after split allowed. ',
  'RULES_DAS_NOT_ALLOWED': 'Double after split not allowed. ',
  'RULES_DOUBLE': 'Double down {0}. ',
  'RULES_BLACKJACK': 'Blackjack pays {0}. ',
  'RULES_SURRENDER_OFFERED': 'Surrender allowed. ',
  'RULES_NO_SURRENDER': 'Surrender not offered. ',
  'PLAYER_HIT_NOTBUSTED_SOFT': 'You got a {0} for a total of soft {1}. |Here\'s a {0} for a total of soft {1}. |I have a {0} for you giving you soft {1}. ',
  'PLAYER_HIT_NOTBUSTED': 'You got a {0} for a total of {1}. |Here\'s a {0} for a total of {1}. |I have a {0} for you giving you {1}. ',
  'GOOD_HIT_OPTIONS': 'I have a {0} for you giving you {1}. Not bad! |You got a {0} for a total of {1}. Good hit. |Here\'s a {0} for a total of {1}. ',
  'GREAT_HIT_OPTIONS': 'Look at this, I have a {0} giving you {1}. |Yes, it\'s a {0} for a total of {1}! |Here\'s a beauty, a {0} for a total of {1}. ',
};

module.exports = {
  strings: resources,
  getBlackjackAction: function(actionSlot) {
    const actionMapping = {'hit': 'hit', 'take a hit': 'hit', 'hit me': 'hit', 'take one': 'hit',
      'stand': 'stand', 'stay': 'stand', 'done': 'stand',
      'surrender': 'surrender', 'give up': 'surrender',
      'double': 'double', 'double down': 'double',
      'split': 'split',
      'shuffle': 'shuffle', 'shuffle deck': 'shuffle',
      'reset': 'resetbankroll', 'reset bankroll': 'resetbankroll',
      'bet': 'bet', 'deal': 'bet'};
    const action = actionMapping[actionSlot.value.toLowerCase()];

    // Look it up in lowercase
    return (action == undefined) ? null : action;
  },
  mapChangeValue: function(value) {
    const valueMapping = {'on': true, 'off': false, 'enable': true, 'disable': false, 'enabled': true, 'disabled': false,
      '3 to 2': 0.5, 'three to two': 0.5, '6 to 5': 0.2, 'six to five': 0.2, 'even': 0, 'even money': 0,
      'one deck': 1, 'two decks': 2, 'four decks': 4, 'six decks': 6, 'eight decks': 8,
      'two deck': 2, 'four deck': 4, 'six deck': 6, 'eight deck': 8,
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'eight': 8,
      '1': 1, '2': 2, '3': 3, '4': 4, '6': 6, '8': 8};
    return valueMapping[value];
  },
  mapChangeRule: function(rule) {
    const ruleMapping = {'hit soft seventeen': 'hitSoft17', 'soft seventeen': 'hitSoft17', 'dealer hits seventeen': 'hitSoft17',
      'hit seventeen': 'hitSoft17', 'hits seventeen': 'hitSoft17',
      'dealer hit seventeen': 'hitSoft17', 'dealer hits soft seventeen': 'hitSoft17', 'dealer hit soft seventeen': 'hitSoft17',
      'hit soft 17': 'hitSoft17', 'soft 17': 'hitSoft17', 'dealer hits 17': 'hitSoft17',
      'hit 17': 'hitSoft17', 'hits 17': 'hitSoft17',
      'dealer hit 17': 'hitSoft17', 'dealer hits soft 17': 'hitSoft17', 'dealer hit soft 17': 'hitSoft17',
      'surrender': 'surrender',
      'double': 'double', 'double down': 'double', 'double after split': 'doubleaftersplit',
      'resplit aces': 'resplitAces',
      'blackjack pays': 'blackjackBonus', 'blackjack bonus': 'blackjackBonus', 'number of decks': 'numberOfDecks',
      'decks': 'numberOfDecks', 'deck count': 'numberOfDecks', 'number of splits': 'maxSplitHands',
      'number of split hands': 'maxSplitHands', 'split hands': 'maxSplitHands'};
    return ruleMapping[rule];
  },
  mapActionToSuggestion: function(action) {
    const actionMapping = {'insurance': 'take insurance', 'noinsurance': 'not take insurance', 'hit': 'hit',
                    'stand': 'stand', 'split': 'split', 'double': 'double', 'surrender': 'surrender'};
    return actionMapping[action];
  },
  mapServerError: function(error) {
    const errorMapping = {'bettoosmall': 'Your bet is below the minimum of £5',
                        'bettoolarge': 'Your bet is above the maximum of £1000',
                        'betoverbankroll': 'Your bet is more than your available bankroll'};
    return (errorMapping[error] ? errorMapping[error] : 'Internal error');
  },
  cardRanks: function(card) {
    const names = ['none', 'ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];
    return names[card.rank];
  },
  pluralCardRanks: function(card) {
    const names = ['none', 'aces', 'twos', 'threes', 'fours', 'fives', 'sixes', 'sevens', 'eights', 'nines', 'tens', 'jacks', 'queens', 'kings'];
    return names[card.rank];
  },
  mapPlayOption: function(option) {
    const optionMapping = {'resetbankroll': 'reset game',
                          'shuffle': 'shuffle',
                          'bet': 'bet',
                          'hit': 'hit',
                          'stand': 'stand',
                          'double': 'double down',
                          'insurance': 'take insurance',
                          'noinsurance': 'decline insurance',
                          'split': 'split',
                          'surrender': 'surrender'};
    return (optionMapping[option] ? optionMapping[option] : option);
  },
  mapOutcome: function(outcome) {
    const outcomeMapping = {'blackjack': 'You win with a Natural Blackjack!',
               'dealerblackjack': 'The dealer has Blackjack.',
               'nodealerblackjack': 'The dealer doesn\'t have Blackjack.',
               'win': 'You won!',
               'loss': 'You lost.',
               'push': 'It\'s a tie.',
               'surrender': 'You surrendered.'};
    return outcomeMapping[outcome];
  },
  mapHandNumber: function(hand) {
    const mapping = ['First hand ', 'Second hand ', 'Third hand ', 'Fourth hand '];
    return mapping[hand];
  },
  mapDouble: function(rule) {
    const doubleMapping = {'any': 'on any cards',
                          '10or11': 'on 10 or 11 only',
                          '9or10or11': 'on 9 thru 11 only',
                          'none': 'not allowed'};
    return doubleMapping[rule];
  },
  mapBlackjackPayout: function(rule) {
    const blackjackPayout = {'0.5': '3 to 2',
                           '0.2': '6 to 5',
                           '0': 'even money'};
    return blackjackPayout[rule];
  },
};

