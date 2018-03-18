//
// Localized resources
//

const resources = {
  // From index.js
  'UNKNOWNINTENT_RESET': 'Sorry, I didn\'t get that. Try saying Yes or No.',
  'UNKNOWNINTENT_RESET_REPROMPT': 'Try saying Yes or No.',
  'UNKNOWNINTENT_NEWGAME': 'Sorry, I didn\'t get that. Try saying Bet.',
  'UNKNOWNINTENT_NEWGAME_REPROMPT': 'Try saying Bet.',
  'UNKNOWNINTENT_FIRSTTIME': 'Say bet to start a game.',
  'UNKNOWNINTENT_FIRSTTIME_REPROMPT': 'Try saying Bet.',
  'UNKNOWNINTENT_INSURANCE': 'Sorry, I didn\'t get that. Try saying Yes or No.',
  'UNKNOWNINTENT_INSURANCE_REPROMPT': 'Try saying Yes or No.',
  'UNKNOWNINTENT_INGAME': 'Sorry, I didn\'t get that. Try saying Repeat to hear the current status.',
  'UNKNOWNINTENT_INGAME_REPROMPT': 'Try saying Repeat.',
  // From BlackjackUtils.js
  'ERROR_REPROMPT': 'What else can I help with?',
  'CHANGE_CARD_TEXT': 'You can change the following options:\n\n - HIT SOFT SEVENTEEN: whether the dealer will hit a soft 17 total. Can be ON or OFF.\n - SURRENDER: whether surrender is offered as an option. Can be ON or OFF.\n - DOUBLE DOWN: whether double down is offered or not.  Can be ON or OFF.\n - DOUBLE AFTER SPLIT: whether you can double down after splitting a pair.  Can be ON or OFF.\n - RESPLIT ACES: wheter you can resplit Aces or not.  Can be ON or OFF.\n - NUMBER OF DECKS: the number of decks in play. Can be ONE, TWO, FOUR, SIX, or EIGHT.\n - NUMBER OF SPLIT HANDS: the maximum number of hands you can have from splitting. Can be ONE, TWO, THREE, or FOUR.\n\nFor example, say "change number of decks to two" if you want to play with two decks.\nNote that the deck will be shuffled if you change the rules of the game',
  'READ_BANKROLL_WITH_ACHIEVEMENT': 'You have ${0} and {1} achievement points. ',
  // From Betting.js
  'BAD_BET_FORMAT': 'Unable to place a bet for {0}',
  // From SideBet.js
  'SIDEBET_PLACED': '${0} side bet placed. The side bet will remain in play until you say remove side bet. ',
  'SIDEBET_REMOVED': 'Side bet removed. ',
  // From Blackjack.js
  'BLACKJACKINTENT_NO_ACTION': 'I\'m sorry, I didn\'t catch that action. Please say what you want to do on this hand like hit or stand. What else can I help with?',
  'BLACKJACKINTENT_UNKNOWN_ACTION': 'I\'m sorry, I don\'t understand how to {0}. Please provide an action like hit or stand. What else can I help with?',
  // From ChangeRules.js
  'CHANGERULES_NO_RULE': 'I\'m sorry, I didn\'t catch a rule to change. Check the Alexa companion app for rules you can change. What else can I help with?',
  'CHANGERULES_NO_RULE_VALUE': 'I\'m sorry, I don\'t understand how to change {0}. Check the Alexa companion app for rules you can change. What else can I help with?',
  'CHANGERULES_NO_RULE_OPTION': 'I\'m sorry, I didn\'t catch how to change {0}. Check the Alexa companion app for rules you can change. What else can I help with?',
  'CHANGERULES_CANT_CHANGE_RULE': 'I\'m sorry, I was unable to change {0} to {1}. Check the Alexa companion app for available rules you can change. What else can I help with?',
  'CHANGERULES_CARD_TITLE': 'Blackjack Game',
  'FULL_RULES': 'The full rules are {0}',
  // From Exit.js
  'EXIT_BANKROLL': 'You are leaving with ${0}.',
  'EXIT_GOODBYE': 'Goodbye.',
  // From HighScore.js
  'HIGHSCORE_REPROMPT': 'What else can I help you with?',
  // From Help.js
  'HELP_GENERIC_HELP': 'You can play a game by saying Deal <break time=\'200ms\'/> or you can say enable training mode if you would like me to prompt when your play differs from Basic Strategy. <break time=\'300ms\'/> Now, what can I help you with?',
  'HELP_CARD_TITLE': 'Blackjack Commands',
  'HELP_CARD_PROGRESSIVE_TEXT': 'This game features a progressive triple seven jackpot. Place a side bet of $5 by saying PLACE SIDE BET which will stay in effect until you say REMOVE SIDE BET.\nThe side bet pays out $25 if your first card is a seven, $100 if your first two cards are both seven, and the progressive jackpot if your first three cards are seven. The progressive jackpot is based on aggregate play across all users of this skill.\n',
  'HELP_CARD_TEXT': 'You can say BET to place a bet. If no amount is mentioned, the game will use the last amount bet. You can say READ HIGH SCORES to hear the current leader board.\nDuring a hand, ask WHAT SHOULD I DO to hear the Basic Strategy suggestion.\nSay READ THE RULES if you would like to hear the rules currently in play.\nCHANGE will change the rules in play. You can change the following options:\n\n - HIT SOFT SEVENTEEN: whether the dealer will hit a soft 17 total. Can be ON or OFF.\n - SURRENDER: whether surrender is offered as an option. Can be ON or OFF.\n - DOUBLE DOWN: whether double down is offered or not.  Can be ON or OFF.\n - DOUBLE AFTER SPLIT: whether you can double down after splitting a pair.  Can be ON or OFF.\n - RESPLIT ACES: wheter you can resplit Aces or not.  Can be ON or OFF.\n - NUMBER OF DECKS: the number of decks in play. Can be ONE, TWO, FOUR, SIX, or EIGHT.\n - NUMBER OF SPLIT HANDS: the maximum number of hands you can have from splitting. Can be ONE, TWO, THREE, or FOUR.\n\nFor example, say "change number of decks to two" if you want to play with two decks.\nNote that the deck will be shuffled if you change the rules of the game',
  'HELP_ACHIEVEMENT_POINTS': 'You earn 100 achievement points for every tournament win <break time=\'200ms\'/> 10 points each day you play <break time=\'200ms\'/> 5 points for a natural winning blackjack <break time=\'200ms\'/> and N points for each streak of N winning hands more than one. ',
  // From Launch.js
  'LAUNCH_WELCOME': 'Welcome to Blackjack Game. The triple seven progressive jackpot is currently ${0}. ',
  'LAUNCH_WELCOME_NOJACKPOT': 'Welcome to Blackjack Game. ',
  'LAUNCH_START_GAME': 'Say bet to start a new game',
  'LAUNCH_ENABLE_TRAINING': 'say enable training mode',
  'LAUNCH_START_PLACE_SIDEBET': 'place side bet to bet $5 towards the jackpot',
  'LAUNCH_START_REMOVE_SIDEBET': 'remove side bet to remove your side bet',
  'LAUNCH_START_HIGH_SCORES': 'read high scores to hear the leader board',
  'LAUNCH_START_RESET': 'reset game to reset to the default rules and bankroll',
  'LAUNCH_START_PROMPT': ' <break time=\'300ms\'/>Now, what can I help you with?',
  // From Reset.js
  'RESET_CONFIRM': 'Would you like to reset the game? This will reset your bankroll and rules of the game.',
  'RESET_COMPLETED': 'You have $5000. Say bet to start a new game.',
  'RESET_REPROMPT': 'Say bet to start a new game.',
  'RESET_ABORTED': 'Game not reset. Say bet to start a new game.',
  // From Rules.js
  'RULES_CARD_TITLE': 'Blackjack Rules',
  // From Training.js
  'TRAINING_ON': 'Training mode turned on. I will let you know when your play differs from Basic Strategy. Say disable training mode to leave this mode. What can I help you with?',
  'TRAINING_OFF': 'Training mode turned off. What can I help you with?',
  'TRAINING_REPROMPT': 'What can I help you with?',
  // From PlayGame.js
  'PROACTIVE_SUGGESTION': ' I\'ve noticed you haven\'t {0} recently and wanted to remind you that the book would say you should {1} on this hand.',
  'SUGGEST_OPTIONS': 'You should {0}|The book says you should {0}|The book would tell you to {0}|According to Basic Strategy you should {0}|The book would suggest that you {0}|I think you should {0}|Basic Strategy would suggest you {0}',
  'SUGGEST_TURNOVER': 'I can\'t give a suggestion when the game is over',
  'SUGGESTED_PLAY': 'I would recommend you {0}. |The book would tell you to {0}. |Basic Strategy would suggest you {0}. |Maybe you should {0} instead. ',
  'SUGGESTED_PLAY_REPROMPT': 'Would you like to {0}?',
  'REPORT_ERROR': 'There was an error: {0}',
  'INVALID_ACTION': 'I\'m sorry, {0} is not a valid action at this time. ',
  'YOU_BET_TEXT': 'You bet ${0}. ',
  'YOUR_BANKROLL_TEXT': 'You have ${0}. ',
  'READ_ABOUT_LEADER_BOARD': 'Say read high scores to hear the leader board. ',
  'READ_JACKPOT_AFTER_LAUNCH': 'The triple seven progressive jackpot is currently ${0}. ',
  'READ_JACKPOT_AFTER_LAUNCH_NOSIDEBET': 'The triple seven progressive jackpot is currently ${0}. Say place side bet to place a $5 side bet. ',
  'HELP_TAKE_INSURANCE': 'You can say yes to take insurance or no to decline insurance.',
  'HELP_TAKE_INSURANCE_BLACKJACK': 'Since you have a blackjack, can you say yes to get paid your bet, or no in which case you push if the dealer has blackjack.',
  'HELP_INSURANCE_INSUFFICIENT_BANKROLL': 'You don\'t have enough money to take insurance - say no to decline insurance.',
  'HELP_YOU_CAN_SAY': 'You can say {0}.',
  'HELP_YOU_CAN_SAY_LEADER': 'read high scores',
  'HELP_YOU_CAN_SAY_ENABLE_TRAINING': 'enable training mode',
  'HELP_MORE_OPTIONS': ' For more options, please check the Alexa companion application.<break time=\'300ms\'/> What can I help you with?',
  'INTERNAL_ERROR': 'Sorry, internal error. What else can I help with?',
  'CHANGERULES_REPROMPT': 'Would you like to bet?',
  'CHANGERULES_CHECKAPP': ' Check the Alexa companion application for the full set of rules. Would you like to bet?',
  'SPEECH_ERROR_CODE': 'Error code {0}',
  'ASK_TAKE_INSURANCE': 'Do you want to take insurance?  Say yes or no.',
  'ASK_TAKE_INSURANCE_BLACKJACK': 'Even money?  Say yes or no.',
  'ASK_POSSIBLE_ACTIONS': 'Would you like to {0}?',
  'ASK_WHAT_TO_DO': 'What would you like to do?',
  'ASK_PLAY_AGAIN': 'Would you like to play again?',
  'ASK_SAY_BET': 'Say bet to start the game.',
  'RESULT_AFTER_HIT_BUST': 'You got {0} and busted. ',
  'RESULT_AFTER_HIT_NOBUST': 'You got {0} for a total of {1}. ',
  'RESULT_BANKROLL_RESET': 'Bankroll reset',
  'RESULT_DECK_SHUFFLED': 'Deck shuffled',
  'DEALER_HOLE_CARD': 'The dealer had {0} down',
  'DEALER_BUSTED': ' and busted.',
  'DEALER_BLACKJACK': ' and has Blackjack.',
  'DEALER_TOTAL': ' for a total of {0}.',
  'DEALER_DRAW': '. The dealer drew ',
  'PLAYER_HIT_BUSTED': 'You got {0} and busted. ',
  'DEALER_SHOWING': ' The dealer is showing {0}.',
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
  'READHAND_DEALER_ACTIVE': 'The dealer has {0} showing.',
  'READHAND_DEALER_DONE': 'The dealer had {0} showing. ',
  'RULES_DECKS': '{0} deck game. ',
  'RULES_BET_RANGE': 'Bet from ${0} to ${1}. ',
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
  'PLAYER_HIT_NOTBUSTED_SOFT': 'You got {0} for a total of soft {1}. |Here\'s {0} for a total of soft {1}. |The dealer has {0} for you giving you soft {1}. ',
  'PLAYER_HIT_NOTBUSTED': 'You got {0} for a total of {1}. |Here\'s {0} for a total of {1}. |The dealer has {0} for you giving you {1}. ',
  'GOOD_HIT_OPTIONS': 'The dealer has {0} for you giving you {1}. Not bad! |You got {0} for a total of {1}. Good hit. |Here\'s {0} for a total of {1}. ',
  'GREAT_HIT_OPTIONS': 'The dealer has {0} giving you {1}. Brilliant! |Yes, it\'s {0} for a total of {1}! |Here\'s a good one, {0} for a total of {1}. ',
  'SIDEBET_LOST': 'Your side bet lost. ',
  'LOST_SINGLEHAND_AND_SIDEBET': 'You lost your hand and your side bet. ',
  'LOST_MULTIPLEHANDS_AND_SIDEBET': 'You lost all your hands and your side bet. ',
  'WINNING_STREAK': 'That\'s {0} wins in a row earning you {1} achievement points! ',
  'FIRST_DAILY_HAND': 'You earned 10 achievement points for your first hand of the day. ',
  'NATURAL_BLACKJACK': 'A natural blackjack gives you 5 achievement points. ',
  'SIDEBET_ONESEVEN': 'Your first card was a seven winning ${0} on the side bet. ',
  'SIDEBET_TWOSEVENS': 'Your first two cards were sevens winning ${0} on the side bet. ',
  'SIDEBET_PROGRESSIVE': '<audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/jackpot.mp3\"/> Your first three cards were sevens! You won the progressive jackpot of ${0}! ',
  'LEADER_RANKING': 'You have {0} achievement points ranking you as <say-as interpret-as="ordinal">{1}</say-as> of {2} players. ',
  'LEADER_NO_SCORES': 'Sorry, I\'m unable to read the current leader board',
  'LEADER_TOP_SCORES': 'The top {0} achievement scores are ',
  'LEADER_BANKROLL_RANKING': 'You have ${0} ranking you as <say-as interpret-as="ordinal">{1}</say-as> of {2} players. ',
  'LEADER_BANKROLL_FORMAT': '${0}',
  'LEADER_TOP_BANKROLLS': 'The top {0} bankrolls are ',
  'LEADER_ACHIEVEMENT_HELP': ' <break time=\'300ms\'/> Ask for help to hear how you earn achievement points',
  // From Tournament.js
  'TOURNAMENT_NOCHANGERULES': 'Sorry, you can\'t change the rules during tournament play. ',
  'TOURNAMENT_NORESET': 'Sorry, you can\'t reset your bankroll during tournament play. What else can I help you with?',
  'TOURNAMENT_BANKROLL': 'You have ${0} and {1} hands remaining. ',
  'TOURNAMENT_HANDS_REMAINING': 'You have {0} hands remaining. ',
  'TOURNAMENT_BANKRUPT': 'You lost all your money and are out of the tournament. Thanks for playing! Check back tomorrow for the results. ',
  'TOURNAMENT_INVALIDACTION_REPROMPT': 'What else can I help you with?',
  'TOURNAMENT_WINNER': 'Congratulations, you won the tournament with ${0}! ',
  'TOURNAMENT_LOSER': 'Sorry, you didn\'t win the tournament. The high score was ${0} and you had ${1}. ',
  'TOURNAMENT_REMINDER': 'Come back Tuesday for the weekly tournament. ',
  'TOURNAMENT_LAUNCH_WELCOMEBACK': 'Welcome to Blackjack Game. You are currently playing in an active tournament. Would you like to continue? ',
  'TOURNAMENT_LAUNCH_WELCOMEBACK_REPROMPT': 'Would you like to continue with the tournament? ',
  'TOURNAMENT_LAUNCH_INFORM': 'Welcome to Blackjack Game. There is currently a tournament going on. Would you like to join?',
  'TOURNAMENT_LAUNCH_INFORM_REPROMPT': 'Would you like to join the tournament?',
  'TOURNAMENT_OUTOFHANDS': 'That was your last hand. Thanks for playing! Check back tomorrow for the results. ',
  'TOURNAMENT_WELCOME_NEWPLAYER': 'Welcome to the Blackjack Tournament! You start the tournament with ${0} and have {1} hands to earn as high a bankroll as possible. At the end of the tournament, the highest bankroll will receive 100 achievement points. Note that this tournament is separate from your normal bankroll. ',
  'TOURNAMENT_WELCOME_BACK': 'Welcome back to the Blackjack Tournament! You have {0} hands remaining. ',
  'TOURNAMENT_WELCOME_REPROMPT': 'Place your bets!',
  'TOURNAMENT_STANDING_FIRST': 'You are currently in <say-as interpret-as="ordinal">1</say-as> place. ',
  'TOURNAMENT_STANDING_TOGO': '<say-as interpret-as="ordinal">1</say-as> place has ${0}. ',
  'TOURNAMENT_HELP': 'You are playing in the Blackjack Game tournament. ',
  'TOURNAMENT_HELP_CARD_TEXT': 'You are playing in the Blackjack Game tournament. You can place up to {0} bets on a four deck shoe. Whoever has the highest bankroll at the end of the tournament wins 100 achievement points.\nYou can say BET to place a bet. If no amount is mentioned, the game will use the last amount bet. You can say READ HIGH SCORES to hear the current leader board.\nDuring a hand, ask WHAT SHOULD I DO to hear the Basic Strategy suggestion.\nSay READ THE RULES if you would like to hear the rules currently in play. Note that you cannot change the rules of the game during tournament play.',
};

module.exports = {
  strings: resources,
  pickRandomOption: function(res) {
    if (res && resources[res]) {
      const options = resources[res].split('|');
      return options[Math.floor(Math.random() * options.length)];
    } else {
      return undefined;
    }
  },
  getBlackjackAction: function(actionSlot) {
    const actionMapping = {'hit': 'hit', 'take a hit': 'hit', 'hit me': 'hit', 'take one': 'hit', 'take 1': 'hit',
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
  mapActionPastTense: function(action) {
    const actionMapping = {'insurance': 'taken insurance', 'noinsurance': 'not taken insurance', 'hit': 'hit',
                    'stand': 'stood', 'split': 'split', 'double': 'doubled', 'surrender': 'surrendered'};
    return actionMapping[action];
  },
  mapServerError: function(error) {
    const errorMapping = {'bettoosmall': 'Your bet is below the minimum of $5',
                        'bettoolarge': 'Your bet is above the maximum of $1000',
                        'betoverbankroll': 'Your bet is more than your available bankroll',
                        'sidebettoosmall': 'Your bankroll is too low to place the side bet and continue playing'};
    return (errorMapping[error] ? errorMapping[error] : 'Internal error');
  },
  cardRanks: function(card, withArticle) {
    const names = ['none', 'ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];
    const articleNames = ['none', 'an ace', 'a two', 'a three', 'a four', 'a five', 'a six', 'a seven', 'an eight', 'a nine', 'a ten', 'a jack', 'a queen', 'a king'];

    if (withArticle === 'article') {
      return articleNames[card.rank];
    } else {
      return names[card.rank];
    }
  },
  pluralCardRanks: function(card) {
    const names = ['none', 'aces', 'twos', 'threes', 'fours', 'fives', 'sixes', 'sevens', 'eights', 'nines', 'tens', 'jacks', 'queens', 'kings'];
    return names[card.rank];
  },
  mapPlayOption: function(option) {
    const optionMapping = {'resetbankroll': 'reset game',
                          'shuffle': 'shuffle',
                          'bet': 'bet',
                          'sidebet': 'place side bet',
                          'nosidebet': 'remove side bet',
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
    const outcomeMapping = {'blackjack': 'You win with a Natural Blackjack! ',
               'win': 'You won! ',
               'loss': 'You lost. ',
               'push': 'It\'s a push. ',
               'surrender': 'You surrendered. '};
    return outcomeMapping[outcome];
  },
  mapOutcomePlusSideBet: function(outcome) {
    const outcomeMapping = {'blackjack': 'You won your hand with a Natural Blackjack and ',
               'win': 'You won your hand and ',
               'loss': 'You lost your hand and ',
               'push': 'You pushed your hand and ',
               'surrender': 'You surrendered your hand and '};
    return outcomeMapping[outcome];
  },
  mapMultipleOutcomes: function(outcome, numHands) {
    const twoHandMapping = {'win': 'You won both hands!',
               'loss': 'You lost both hands.',
               'push': 'Both hands tied.',
               'surrender': 'You surrendered both hands.'};
    const multipleHandMapping = {'win': 'You won all your hands!',
               'loss': 'You lost all your hands.',
               'push': 'You tied on all your hands.',
               'surrender': 'You surrendered all your hands.'};
    return (numHands == 2) ? twoHandMapping[outcome] : multipleHandMapping[outcome];
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

