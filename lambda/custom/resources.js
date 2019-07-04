//
// Localized resources
//

const common = {
  // From BlackjackUtils.js
  'ERROR_REPROMPT': 'What else can I help with?',
  'CHANGE_CARD_TEXT': 'You can change the following options:\n\n - HIT SOFT SEVENTEEN: whether the dealer will hit a soft 17 total. Can be ON or OFF.\n - SURRENDER: whether surrender is offered as an option. Can be ON or OFF.\n - DOUBLE DOWN: whether double down is offered or not.  Can be ON or OFF.\n - DOUBLE AFTER SPLIT: whether you can double down after splitting a pair.  Can be ON or OFF.\n - RESPLIT ACES: wheter you can resplit Aces or not.  Can be ON or OFF.\n - NUMBER OF DECKS: the number of decks in play. Can be ONE, TWO, FOUR, SIX, or EIGHT.\n - NUMBER OF SPLIT HANDS: the maximum number of hands you can have from splitting. Can be ONE, TWO, THREE, or FOUR.\n\nFor example, say "change number of decks to two" if you want to play with two decks.\nNote that the deck will be shuffled if you change the rules of the game',
  'SELECT_GAME_TITLE': 'Select a game',
  'GOOD_MORNING': 'Good morning {Name} <break time=\"200ms\"/> ',
  'GOOD_AFTERNOON': 'Good afternoon {Name} <break time=\"200ms\"/> ',
  'GOOD_EVENING': 'Good evening {Name} <break time=\"200ms\"/> ',
  // From Select.js
  'SELECT_ONE_GAME': 'Sorry, there is only one game available to play. ',
  'SELECT_GAMES': 'We have the following games available to play <break time=\'200ms\'/> {0}. ',
  'SELECT_REPROMPT': 'Would you like to play {0}?',
  // From SideBet.js
  'SIDEBET_REMOVED': 'Side bet removed. ',
  // From Blackjack.js
  'BLACKJACKINTENT_NO_ACTION': 'I\'m sorry, I didn\'t catch that action. Please say what you want to do on this hand like hit or stand. What else can I help with?',
  'BLACKJACKINTENT_UNKNOWN_ACTION': 'I\'m sorry, I don\'t understand how to {0}. Please provide an action like hit or stand. What else can I help with?',
  // From ChangeRules.js
  'CHANGERULES_NO_RULE': 'I\'m sorry, I didn\'t catch a rule to change. {2} What else can I help with?',
  'CHANGERULES_NO_RULE_VALUE': 'I\'m sorry, I don\'t understand how to change {0}. {2} What else can I help with?',
  'CHANGERULES_NO_RULE_OPTION': 'I\'m sorry, I didn\'t catch how to change {0}. {2} What else can I help with?',
  'CHANGERULES_CANT_CHANGE_RULE': 'I\'m sorry, I was unable to change {0} to {1}. {2} What else can I help with?',
  'CHANGERULES_CARD_TITLE': 'Blackjack Game',
  'CHANGERULES_ERR_CHECKAPP': 'Check the Alexa companion app for rules you can change.',
  'FULL_RULES': 'The full rules are {0}',
  // From Exit.js
  'EXIT_GOODBYE': 'Goodbye.',
  'EXIT_REMINDER': 'Would you like me to set a weekly reminder for the tournament every {Time} {Timezone}?',
  'EXIT_REMINDER_REPROMPT': 'Would you like me to set a weekly reminder for the tournament?',
  // From HighScore.js
  'HIGHSCORE_GIVENAME': 'If you would like to include your name in the leaderboard, grant this skill permission in the Alexa companion app <break time=\'200ms\'/>',
  'HIGHSCORE_REPROMPT': 'What else can I help you with?',
  // From Help.js
  'HELP_GENERIC_HELP': 'You can play a game by saying Deal <break time=\'200ms\'/> or you can say enable training mode if you would like me to prompt when your play differs from Basic Strategy. <break time=\'300ms\'/> Now, what can I help you with?',
  'HELP_CARD_TITLE': 'Blackjack Commands',
  'HELP_CARD_TEXT': 'You can say BET to place a bet. If no amount is mentioned, the game will use the last amount bet. You can say READ HIGH SCORES to hear the current leader board.\nDuring a hand, ask WHAT SHOULD I DO to hear the Basic Strategy suggestion.\nSay READ THE RULES if you would like to hear the rules currently in play.\nCHANGE will change the rules in play. You can change the following options:\n\n - HIT SOFT SEVENTEEN: whether the dealer will hit a soft 17 total. Can be ON or OFF.\n - SURRENDER: whether surrender is offered as an option. Can be ON or OFF.\n - DOUBLE DOWN: whether double down is offered or not.  Can be ON or OFF.\n - DOUBLE AFTER SPLIT: whether you can double down after splitting a pair.  Can be ON or OFF.\n - RESPLIT ACES: wheter you can resplit Aces or not.  Can be ON or OFF.\n - NUMBER OF DECKS: the number of decks in play. Can be ONE, TWO, FOUR, SIX, or EIGHT.\n - NUMBER OF SPLIT HANDS: the maximum number of hands you can have from splitting. Can be ONE, TWO, THREE, or FOUR.\n\nFor example, say "change number of decks to two" if you want to play with two decks.\nNote that the deck will be shuffled if you change the rules of the game',
  'HELP_ACHIEVEMENT_POINTS': 'You earn 100 achievement points for every tournament win <break time=\'200ms\'/> 10 points each day you play <break time=\'200ms\'/> 5 points for a natural winning blackjack <break time=\'200ms\'/> and N points for each streak of N winning hands more than one. ',
  'HELP_SELECT_GAME': 'Say choose a new game to hear other available games. ',
  'HELP_ACHIEVEMENT_CARD_TEXT': '\nYou earn achievement points as you play which is how the high score board is determined. You earn points as follows:\n - 100 achievement points each time you win the Tuesday Tournament\n - 10 points each day you play\n - 5 points for a natural winning blackjack\n - N points for each streak of N winning hands more than one.\n',
  // From Launch.js
  'LAUNCH_WELCOME': '{"standard":"Welcome to Blackjack Game. |{0} Welcome to Blackjack Game. |{0} Let\'s play blackjack! |{0} Ready for some blackjack? ","tournament":"Welcome to the tournament round of Blackjack Game. |{0} It\'s tournament time! |{0} Welcome to the Blackjack tournament. ","spanish":"Welcome to Spanish 21. |{0} Welcome to Spanish 21. |{0} Ready for some Spanish 21? "}',
  'LAUNCH_INITIAL_WELCOME': '{"standard":"","tournament":"You can play up to 100 hands to get the highest bankroll in the tournament. ","spanish":"In this game a player 21 always wins <break time=\'200ms\'/> you can redouble <break time=\'200ms\'/> 21 with 5 or more cards wins a bonus payout <break time=\'200ms\'/> and there are special suited bonuses. "}',
  'LAUNCH_START_GAME': 'Say bet to start a new game',
  'LAUNCH_ENABLE_TRAINING': 'say enable training mode',
  'LAUNCH_SELECT_GAME': ' or say select a different game to change between Spanish 21 and standard blackjack',
  'LAUNCH_START_REMOVE_SIDEBET': 'remove side bet to remove your side bet',
  'LAUNCH_START_HIGH_SCORES': 'read high scores to hear the leader board',
  'LAUNCH_START_RESET': 'reset game to reset to the default rules and bankroll',
  'LAUNCH_START_PROMPT': ' <break time=\'300ms\'/>Now, what can I help you with?',
  'LAUNCH_SPANISH_TRIAL': 'For a limited time, we have a free trial version of Spanish 21 to play. Say select a new game to play Spanish 21. ',
  'LAUNCH_SPANISH_TRIAL_OVER': 'The free trial of Spanish 21 is over. If you would like to continue to play Spanish 21, say buy Spanish 21. ',
  // From ListPurchases.js
  'LISTPURCHASE_SPANISH': 'You have purchased Spanish 21. What else can I help you with?',
  'LISTPURCHASE_NONE': 'You haven\'t purchased any products for Blackjack Game. What else can I help you with?',
  'LISTPURCHASE_REPROMPT': 'What else can I help you with?',
  // From Purchase.js
  'PURCHASE_ONLY_SPANISH': 'We only offer the Spanish 21 expansion product, and you\'ve already purchased it. What else can I help you with?',
  'PURCHASE_SPANISH': 'We have a Spanish 21 game available for purchase. Would you like to buy it? ',
  'PURCHASE_CONFIRM_REPROMPT': 'Say yes to buy Spanish 21',
  'PURCHASE_NO_PURCHASE': 'What else can I help you with?',
  'PURCHASE_REPROMPT': 'What else can I help you with?',
  // From Reminder.js
  'REMINDER_ALREADY_SET': 'You already have a reminder set for the upcoming tournament. What else can I help you with?',
  'REMINDER_ALREADY_SET_REPROMPT': 'What else can I help you with?',
  'REMINDER_SET_REMINDER': 'Would you like me to set a weekly reminder for the tournament every {Time} {Timezone}?',
  'REMINDER_SET_REPROMPT': 'Would you like me to set a weekly reminder for the tournament?',
  'REMINDER_REPROMPT': 'What else can I help you with?',
  'REMINDER_TEXT': 'Time to play the Blackjack Game tournament!',
  'REMINDER_GRANT_PERMISSION': 'Please grant this skill permission in the Alexa companion app to set reminders and try again.',
  'REMINDER_ERROR': 'Sorry, there was a problem setting your reminder. Please try again.',
  'REMINDER_ERROR_EXPLICIT': 'Sorry, there was a problem setting your reminder. What else can I help you with?',
  'REMINDER_SET': 'Great. I set a weekly reminder for the tournament round every {Time} {Timezone} <break time=\'200ms\'/> See you then!',
  'REMINDER_SET_EXPLICIT': 'Great. I set a weekly reminder for the tournament round every {Time} {Timezone} <break time=\'200ms\'/> What else can I help you with?',
  // From Refund.js
  'REFUND_SPANISH': 'OK, as a reminder you will no longer be able to access Spanish 21 and will lose your progress on that game. Would you like to refund Spanish 21?',
  'REFUND_SPANISH_REPROMPT': 'Would you like to refund Spanish 21?',
  'REFUND_REPROMPT': 'What else can I help you with?',
  // From Reset.js
  'RESET_CONFIRM': 'Would you like to reset the game? This will reset your bankroll and rules of the game.',
  'RESET_REPROMPT': 'Say bet to start a new game.',
  'RESET_ABORTED': 'Game not reset. Say bet to start a new game.',
  // From Rules.js
  'RULES_CARD_TITLE': 'Blackjack Rules',
  // From Training.js
  'TRAINING_ON': 'Training mode turned on. I will let you know when your play differs from Basic Strategy. ',
  'TRAINING_OFF': 'Training mode turned off. ',
  'TRAINING_REPROMPT': 'What can I help you with?',
  // From PlayGame.js
  'PROMPT_TRAINING': 'You can say enter training mode if you would like me to tell you when your play differs from Basic Strategy',
  'PROMPT_LEADER_BOARD': 'You can say read high scores to hear the leader board. ',
  'PROACTIVE_SUGGESTION': ' I\'ve noticed you haven\'t {0} recently and wanted to remind you that the book would say you should {1} on this hand.',
  'SUGGEST_OPTIONS': 'You should {0}|The book says you should {0}|The book would tell you to {0}|According to Basic Strategy you should {0}|The book would suggest that you {0}|I think you should {0}|Basic Strategy would suggest you {0}',
  'SUGGEST_TURNOVER': 'I can\'t give a suggestion when the game is over',
  'SUGGESTED_PLAY_REPROMPT': 'Would you like to {0}?',
  'REPORT_ERROR': 'There was an error: {0}',
  'INVALID_ACTION': 'I\'m sorry, {0} is not a valid action at this time. ',
  'READ_ABOUT_LEADER_BOARD': 'Say read high scores to hear the leader board. ',
  'HELP_TAKE_INSURANCE': 'You can say yes to take insurance or no to decline insurance.',
  'HELP_INSURANCE_INSUFFICIENT_BANKROLL': 'You don\'t have enough money to take insurance - say no to decline insurance.',
  'HELP_YOU_CAN_SAY': 'You can say {0}.',
  'HELP_YOU_CAN_SAY_LEADER': 'read high scores',
  'HELP_YOU_CAN_SAY_ENABLE_TRAINING': 'enable training mode',
  'HELP_YOU_CAN_SAY_YESNO': 'You can say yes or no',
  'HELP_MORE_OPTIONS': ' For more options, please check the Alexa companion application.<break time=\'300ms\'/> What can I help you with?',
  'INTERNAL_ERROR': 'Sorry, internal error. What else can I help with?',
  'CHANGERULES_REPROMPT': 'Would you like to bet?',
  'CHANGERULES_CHECKAPP': ' Check the Alexa companion application for the full set of rules. ',
  'CHANGERULES_CHECKAPP_BET': 'Would you like to bet?',
  'SPEECH_ERROR_CODE': 'Error code {0}',
  'ASK_TAKE_INSURANCE': 'Do you want to take insurance?  Say yes or no.',
  'ASK_TAKE_INSURANCE_BLACKJACK': 'Even money?  Say yes or no.',
  'ASK_POSSIBLE_ACTIONS': 'Would you like to {0}?',
  'ASK_WHAT_TO_DO': 'What would you like to do?',
  'ASK_PLAY_AGAIN': 'Play again?|One more hand?|One more time?',
  'ASK_SAY_BET': 'Say bet to start the game.',
  'RESULT_AFTER_HIT_BUST': 'You got {0} and busted. ',
  'RESULT_AFTER_HIT_NOBUST': 'You got {0} for a total of {1}. ',
  'RESULT_BANKROLL_RESET': 'Bankroll reset',
  'RESULT_DECK_SHUFFLED': 'Deck shuffled',
  'DEALER_BUSTED': ' and busted.',
  'DEALER_TOTAL': ' for a total of {0}.',
  'SPLIT_TENS': 'You split tens. ',
  'SPLIT_PAIR': 'You split a pair of {0}. ',
  'SURRENDER_RESULT': 'You surrendered. ',
  'READHAND_PLAYER_TOTAL_ACTIVE_BLACKJACK': 'You have {0} for a blackjack. ',
  'READHAND_PLAYER_TOTAL_END_BLACKJACK': 'You had {0} for a blackjack. ',
  'READHAND_PLAYER_BUSTED_SOFT': 'You busted with {0} for a total of soft {1}. ',
  'READHAND_PLAYER_TOTAL_ACTIVE_SOFT': 'You have {0} for a total of soft {1}.  ',
  'READHAND_PLAYER_TOTAL_END_SOFT': 'You had {0} for a total of soft {1}.  ',
  'READHAND_PLAYER_BUSTED': 'You busted with {0} for a total of {1}.  ',
  'READHAND_PLAYER_TOTAL_ACTIVE': 'You have {0} for a total of {1}.  ',
  'READHAND_PLAYER_TOTAL_END': 'You had {0} for a total of {1}.  ',
  'RULES_SPANISH21': 'Spanish 21 has bonus payouts for a 21 with five or more cards and other special rules you can hear by saying Help. ',
  'RULES_DECKS': '{0} deck game. ',
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
  'SIDEBET_LOST': 'Your side bet lost. ',
  'LOST_SINGLEHAND_AND_SIDEBET': 'You lost your hand and your side bet. ',
  'LOST_MULTIPLEHANDS_AND_SIDEBET': 'You lost all your hands and your side bet. ',
  'WINNING_STREAK': '{1} points for {0} wins in a row',
  'FIRST_DAILY_HAND': '10 points for your first hand of the day',
  'NATURAL_BLACKJACK': '5 points for a natural blackjack ',
  'POINTS_EARNED_NOSCORE': 'You earned {0}. ',
  'LEADER_RANKING': 'You have {0} achievement points ranking you as <say-as interpret-as="ordinal">{1}</say-as> of {2} players. ',
  'LEADER_NO_SCORES': 'Sorry, I\'m unable to read the current leader board',
  'LEADER_TOP_SCORES': 'The top {0} achievement scores are ',
  'LEADER_TOP_BANKROLLS': 'The top {0} bankrolls are ',
  'LEADER_ACHIEVEMENT_FORMAT': '{0} points',
  'LEADER_ACHIEVEMENT_FORMAT_NAME': '{1} with {0} points',
  'MORE_THAN_PLAYERS': 'over {0}',
  // From Tournament.js
  'TOURNAMENT_DEFAULT_TIMEZONE': 'Pacific time',
  'TOURNAMENT_NOCHANGERULES': 'Sorry, you can\'t change the rules on this game. ',
  'TOURNAMENT_NORESET': 'Sorry, you can\'t reset your bankroll on this game. What else can I help you with?',
  'TOURNAMENT_HANDS_REMAINING': 'You have {0} hands remaining. ',
  'TOURNAMENT_BANKRUPT': 'You lost all your money and are out of the tournament. Thanks for playing! Check back tomorrow for the results. ',
  'TOURNAMENT_INVALIDACTION_REPROMPT': 'What else can I help you with?',
  'TOURNAMENT_REMINDER': 'Come back Tuesday for the weekly tournament. ',
  'TOURNAMENT_LAUNCH_WELCOMEBACK': '{0} You are currently playing in an active blackjack tournament. Would you like to continue? |{0} You are currently playing in a blackjack tournament. Care to continue? |{0} The tournament is still underway. Want to continue playing? ',
  'TOURNAMENT_LAUNCH_WELCOMEBACK_REPROMPT': 'Would you like to continue with the tournament? ',
  'TOURNAMENT_LAUNCH_INFORM': 'Welcome to Blackjack Game. There is currently a tournament going on. Would you like to join?|{0} Welcome to Blackjack Game. Would you like to join our weekly tournament?|{0} Let\'s play Blackjack Game! <break time=\'500ms\'/> Ooh <break time=\'500ms\'/> There\'s a tournament today. Care to join?',
  'TOURNAMENT_LAUNCH_INFORM_REPROMPT': 'Would you like to join the tournament?',
  'TOURNAMENT_OUTOFHANDS': 'That was your last hand. Thanks for playing! Check back tomorrow for the results. ',
  'TOURNAMENT_WELCOME_BACK': 'Welcome back to the Blackjack Tournament! You have {0} hands remaining. ',
  'TOURNAMENT_WELCOME_REPROMPT': 'Place your bets!',
  'TOURNAMENT_STANDING_FIRST': 'You are currently in <say-as interpret-as="ordinal">1</say-as> place. ',
  'TOURNAMENT_HELP': 'You are playing in the Blackjack Game tournament. You can say select another game to change to the standard game. ',
  'TOURNAMENT_HELP_CARD_TEXT': 'You are playing in the Blackjack Game tournament. You can place up to {0} bets on a four deck shoe. Whoever has the highest bankroll at the end of the tournament wins 100 achievement points.\nYou can say BET to place a bet. If no amount is mentioned, the game will use the last amount bet. You can say READ HIGH SCORES to hear the current leader board.\nDuring a hand, ask WHAT SHOULD I DO to hear the Basic Strategy suggestion.\nSay READ THE RULES if you would like to hear the rules currently in play. Note that you cannot change the rules of the game during tournament play.',
};

const formal = {
  // This file
  'OUTCOME_TWOHAND_PUSH': 'Both hands tied.',
  'OUTCOME_MULTIPLE_PUSH': 'You tied on all your hands.',
  // From PlayGame.js
  'SUGGESTED_PLAY': 'The book would tell you to {0}. |Basic Strategy would suggest you {0}. ',
  'HELP_TAKE_INSURANCE_BLACKJACK': 'Since you have a blackjack, can you say yes to get paid your bet, or no in which case you push if the dealer has blackjack.',
  'DEALER_HOLE_CARD': 'The dealer had {0} down',
  'DEALER_BLACKJACK': ' and has Blackjack.',
  'DEALER_DRAW': '. The dealer drew ',
  'DEALER_HAD_BLACKJACK': 'The dealer had a blackjack. ',
  'DEALER_NO_BLACKJACK': 'The dealer didn\'t have a blackjack. ',
  'PLAYER_HIT_BUSTED': 'You got {0} and busted. ',
  'DEALER_SHOWING': ' The dealer is showing {0}.',
  'READHAND_DEALER_ACTIVE': 'The dealer has {0} showing.',
  'READHAND_DEALER_DONE': 'The dealer had {0} showing. ',
  'PLAYER_HIT_NOTBUSTED_SOFT': 'You got {0} for a total of soft {1}. |Here\'s {0} for a total of soft {1}. |The dealer has {0} for you giving you soft {1}. ',
  'PLAYER_HIT_NOTBUSTED': 'You got {0} for a total of {1}. |Here\'s {0} for a total of {1}. |The dealer has {0} for you giving you {1}. ',
  'GOOD_HIT_OPTIONS': 'The dealer has {0} for you giving you {1}. Not bad! |You got {0} for a total of {1}. Good hit. |Here\'s {0} for a total of {1}. ',
  'GREAT_HIT_OPTIONS': 'The dealer has {0} giving you {1}. Brilliant! |Yes, it\'s {0} for a total of {1}! |Here\'s a good one, {0} for a total of {1}. ',
};

const informal = {
  // This file
  'OUTCOME_TWOHAND_PUSH': 'Both hands pushed.',
  'OUTCOME_MULTIPLE_PUSH': 'You pushed on all your hands.',
  // From PlayGame.js
  'SUGGESTED_PLAY': 'I would recommend you {0}. |The book would tell you to {0}. |Basic Strategy would suggest you {0}. |Maybe you should {0} instead. ',
  'HELP_TAKE_INSURANCE_BLACKJACK': 'Since you have a blackjack, can you say yes to get paid your bet, or no in which case you push if I have blackjack.',
  'DEALER_HOLE_CARD': 'I have {0} down',
  'DEALER_BLACKJACK': ' and have Blackjack.',
  'DEALER_DRAW': '. I drew ',
  'DEALER_HAD_BLACKJACK': 'I had a blackjack. ',
  'DEALER_NO_BLACKJACK': 'I didn\'t have a blackjack. ',
  'PLAYER_HIT_BUSTED': 'Sorry, it\'s a {0}. You busted. |You got {0} and busted. |You got {0} and busted. ',
  'DEALER_SHOWING': ' I am showing {0}.',
  'READHAND_DEALER_ACTIVE': 'I have {0} showing.',
  'READHAND_DEALER_DONE': 'I had {0} showing. ',
  'PLAYER_HIT_NOTBUSTED_SOFT': 'You got {0} for a total of soft {1}. |Here\'s {0} for a total of soft {1}. |I have {0} for you giving you soft {1}. ',
  'PLAYER_HIT_NOTBUSTED': 'You got {0} for a total of {1}. |Here\'s {0} for a total of {1}. |I have {0} for you giving you {1}. ',
  'GOOD_HIT_OPTIONS': 'I have {0} for you giving you {1}. Not bad! |You got {0} for a total of {1}. Good hit. |Here\'s {0} for a total of {1}. ',
  'GREAT_HIT_OPTIONS': 'Look at this, I have {0} giving you {1}. |It\'s {0} for a total of {1}! Nice hit! |Here\'s a beauty, {0} for a total of {1}. ',
};

const dollar = {
  // From BlackjackUtils.js
  'READ_BANKROLL_WITH_ACHIEVEMENT': 'You have ${0} and {1} achievement points. ',
  // From SideBet.js
  'SIDEBET_PLACED': '${0} side bet placed for the ${1} progressive jackpot. The side bet will remain in play until you say remove side bet. ',
  // From Exit.js
  'EXIT_BANKROLL': 'You are leaving with ${0}.',
  // From Help.js
  'HELP_CARD_SUPERBONUS': 'Spanish 21 features a super bonus of $1000 for bets under $25 and $5000 for bets of $25 and over when three suited sevens are dealt against a dealer seven.\n',
  'HELP_CARD_PROGRESSIVE_TEXT': 'This game features a progressive triple seven jackpot. Place a side bet of $5 by saying PLACE SIDE BET which will stay in effect until you say REMOVE SIDE BET.\nThe side bet pays out $25 if your first card is a seven, $100 if your first two cards are both seven, and the progressive jackpot if your first three cards are seven. The progressive jackpot is based on aggregate play across all users of this skill.\n',
  // From Launch.js
  'LAUNCH_START_PLACE_SIDEBET': 'place side bet to bet $5 towards the jackpot',
  // From Reset.js
  'RESET_COMPLETED': 'You have $5000. Say bet to start a new game.',
  // From PlayGame.js
  'YOU_BET_TEXT': 'You bet ${0}. ',
  'YOUR_BANKROLL_TEXT': 'You have ${0}. ',
  'READ_JACKPOT_AFTER_LAUNCH': 'The triple seven progressive jackpot is currently ${0}. ',
  'READ_JACKPOT_AFTER_LAUNCH_NOSIDEBET': 'The triple seven progressive jackpot is currently ${0}. Say place side bet to place a $5 side bet. ',
  'RULES_BET_RANGE': 'Bet from ${0} to ${1}. ',
  'SIDEBET_ONESEVEN': 'You won ${0} on the side bet. ',
  'SIDEBET_TWOSEVENS': 'You won ${0} on the side bet. ',
  'SIDEBET_PROGRESSIVE': '<audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/jackpot.mp3\"/> Your first three cards were sevens! You won the progressive jackpot of ${0}! ',
  'SUPERBONUS_WIN': '<audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/jackpot.mp3\"/> Your hand was three suited sevens against a dealer seven winning you a super bonus payout of ${0}! ',
  'LEADER_BANKROLL_RANKING': 'You have ${0} ranking you as <say-as interpret-as="ordinal">{1}</say-as> of {2} players. ',
  'LEADER_BANKROLL_FORMAT': '${0}',
  'LEADER_BANKROLL_FORMAT_NAME': '{1} with ${0}',
  // From Tournament.js
  'TOURNAMENT_BANKROLL': 'You have ${0} and {1} hands remaining. ',
  'TOURNAMENT_WINNER': 'Congratulations, you won the tournament with ${0}! ',
  'TOURNAMENT_LOSER': 'Sorry, you didn\'t win the tournament. The high score was ${0} and you had ${1}. ',
  'TOURNAMENT_WELCOME_NEWPLAYER': 'Welcome to the Blackjack Tournament! You start the tournament with ${0} and have {1} hands to earn as high a bankroll as possible. At the end of the tournament, the highest bankroll will receive 100 achievement points. Note that this tournament is separate from your normal bankroll. ',
  'TOURNAMENT_STANDING_TOGO': '<say-as interpret-as="ordinal">1</say-as> place has ${0}. ',
  // This file
  'MAP_ERROR_TOOSMALL': 'Your bet is below the minimum of $5',
  'MAP_ERROR_TOOLARGE': 'Your bet is above the maximum of $1000',
};

const pound = {
  // From BlackjackUtils.js
  'READ_BANKROLL_WITH_ACHIEVEMENT': 'You have £{0} and {1} achievement points. ',
  // From SideBet.js
  'SIDEBET_PLACED': '£{0} side bet placed for the £{1} progressive jackpot. The side bet will remain in play until you say remove side bet. ',
  // From Exit.js
  'EXIT_BANKROLL': 'You are leaving with £{0}.',
  // From Help.js
  'HELP_CARD_SUPERBONUS': 'Spanish 21 features a super bonus of £1000 for bets under £25 and £5000 for bets of £25 and over when three suited sevens are dealt against a dealer seven.\n',
  'HELP_CARD_PROGRESSIVE_TEXT': 'This game features a progressive triple seven jackpot. Place a side bet of £5 by saying PLACE SIDE BET which will stay in effect until you say REMOVE SIDE BET.\nThe side bet pays out £25 if your first card is a seven, £100 if your first two cards are both seven, and the progressive jackpot if your first three cards are seven. The progressive jackpot is based on aggregate play across all users of this skill.\n',
  // From Launch.js
  'LAUNCH_START_PLACE_SIDEBET': 'place side bet to bet £5 towards the jackpot',
  // From Reset.js
  'RESET_COMPLETED': 'You have £5000. Say bet to start a new game.',
  // From PlayGame.js
  'YOU_BET_TEXT': 'You bet £{0}. ',
  'YOUR_BANKROLL_TEXT': 'You have £{0}. ',
  'READ_JACKPOT_AFTER_LAUNCH': 'The triple seven progressive jackpot is currently £{0}. ',
  'READ_JACKPOT_AFTER_LAUNCH_NOSIDEBET': 'The triple seven progressive jackpot is currently £{0}. Say place side bet to place a £5 side bet. ',
  'RULES_BET_RANGE': 'Bet from £{0} to £{1}. ',
  'SIDEBET_ONESEVEN': 'You won £{0} on the side bet. ',
  'SIDEBET_TWOSEVENS': 'You won £{0} on the side bet. ',
  'SIDEBET_PROGRESSIVE': '<audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/jackpot.mp3\"/> Your first three cards were sevens! You won the progressive jackpot of £{0}! ',
  'SUPERBONUS_WIN': '<audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/jackpot.mp3\"/> Your hand was three suited sevens against a dealer seven winning you a super bonus payout of £{0}! ',
  'LEADER_BANKROLL_RANKING': 'You have £{0} ranking you as <say-as interpret-as="ordinal">{1}</say-as> of {2} players. ',
  'LEADER_BANKROLL_FORMAT': '£{0}',
  'LEADER_BANKROLL_FORMAT_NAME': '{1} with £{0}',
  // From Tournament.js
  'TOURNAMENT_BANKROLL': 'You have £{0} and {1} hands remaining. ',
  'TOURNAMENT_WINNER': 'Congratulations, you won the tournament with £{0}! ',
  'TOURNAMENT_LOSER': 'Sorry, you didn\'t win the tournament. The high score was £{0} and you had £{1}. ',
  'TOURNAMENT_WELCOME_NEWPLAYER': 'Welcome to the Blackjack Tournament! You start the tournament with £{0} and have {1} hands to earn as high a bankroll as possible. At the end of the tournament, the highest bankroll will receive 100 achievement points. Note that this tournament is separate from your normal bankroll. ',
  'TOURNAMENT_STANDING_TOGO': '<say-as interpret-as="ordinal">1</say-as> place has £{0}. ',
  // This file
  'MAP_ERROR_TOOSMALL': 'Your bet is below the minimum of £5',
  'MAP_ERROR_TOOLARGE': 'Your bet is above the maximum of £1000',
};

const resources = {
  'en-US': {
    'translation': Object.assign({}, common, informal, dollar),
  },
  'en-IN': {
    'translation': Object.assign({}, common, formal, dollar),
  },
  'en-GB': {
    'translation': Object.assign({}, common, formal, pound),
  },
};

const utils = (locale) => {
  let translation;
  if (resources[locale]) {
    translation = resources[locale].translation;
  } else {
    translation = resources['en-US'].translation;
  }

  return {
    strings: translation,
    pickRandomOption: function(res) {
      if (res && translation[res]) {
        const options = translation[res].split('|');
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
      const errorMapping = {'bettoosmall': translation['MAP_ERROR_TOOSMALL'],
                          'bettoolarge': translation['MAP_ERROR_TOOLARGE'],
                          'betoverbankroll': 'Your bet is more than your available bankroll',
                          'sidebettoosmall': 'Your bankroll is too low to place the side bet and continue playing'};
      return (errorMapping[error] ? errorMapping[error] : 'Internal error');
    },
    readCard: function(card, withArticle, readSuit) {
      const names = ['none', 'ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];
      const suits = {'C': 'clubs', 'D': 'diamonds', 'H': 'hearts', 'S': 'spades'};
      const articleNames = ['none', 'an ace', 'a two', 'a three', 'a four', 'a five', 'a six', 'a seven', 'an eight', 'a nine', 'a ten', 'a jack', 'a queen', 'a king'];
      let result;

      if (withArticle === 'article') {
        result = articleNames[card.rank];
      } else {
        result = names[card.rank];
      }

      if (readSuit) {
        result += (' of ' + suits[card.suit]);
      }

      return result;
    },
    pluralCardRanks: function(card) {
      const names = ['none', 'aces', 'twos', 'threes', 'fours', 'fives', 'sixes', 'sevens', 'eights', 'nines', 'tens', 'jacks', 'queens', 'kings'];
      return names[card.rank];
    },
    mapPlayOption: function(option) {
      const optionMapping = {'resetbankroll': 'bet',
                            'shuffle': 'bet',
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
                 'push': translation['OUTCOME_TWOHAND_PUSH'],
                 'surrender': 'You surrendered both hands.'};
      const multipleHandMapping = {'win': 'You won all your hands!',
                 'loss': 'You lost all your hands.',
                 'push': translation['OUTCOME_MULTIPLE_PUSH'],
                 'surrender': 'You surrendered all your hands.'};
      return (numHands == 2) ? twoHandMapping[outcome] : multipleHandMapping[outcome];
    },
    mapHandNumber: function(hand) {
      const mapping = ['First hand ', 'Second hand ', 'Third hand ', 'Fourth hand '];
      return mapping[hand];
    },
    mapDouble: function(rule) {
      const doubleMapping = {'any': 'on any cards',
                            'anyCards': 'on any number of cards',
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
    buildUnhandledResponse: function(intent, state) {
      const stateMapping = {'SUGGESTION': 'during the middle of a hand',
        'CONFIRMRESET': 'while I\'m waiting to hear if you want to reset the game',
        'NEWGAME': 'before the hand has started',
        'FIRSTTIMEPLAYER': 'before the hand has started',
        'INSURANCEOFFERED': 'while I\'m waiting to hear if you want insurance',
        'INGAME': 'during the middle of a hand',
        'JOINTOURNAMENT': 'before you decide if you want to join the tournament',
        'SELECTGAME': 'while selecting a new game',
      };
      let response = 'I can\'t ';

      // What are they trying to do?
      switch (intent.name) {
        case 'BlackjackIntent':
          // This one is a little more involved - need to get the ActionSlot
          if (intent.slots && intent.slots.Action && intent.slots.Action.value) {
            response += (intent.slots.Action.value + ' ');
          } else {
            // Really shouldn't happen
            console.log('Error - unhandled BlackjackIntent with no action in ' + state);
            response += 'do that ';
          }
          break;
        case 'SuggestIntent':
          response += 'give a suggestion ';
          break;
        case 'ResetIntent':
          response += 'reset the game ';
          break;
        case 'ChangeRulesIntent':
          response += 'change the rules ';
          break;
        case 'AMAZON.YesIntent':
          response = 'Yes doesn\'t make sense ';
          break;
        case 'AMAZON.NoIntent':
          response = 'No doesn\'t make sense ';
          break;
        case 'BettingIntent':
          response += 'place a new bet ';
          break;
        case 'PlaceSideBetIntent':
          response += 'place a side bet ';
          break;
        case 'RemoveSideBetIntent':
          response += 'remove your side bet ';
          break;
        case 'RulesIntent':
          response += 'read the rules ';
          break;
        case 'HighScoreIntent':
          response += 'read the leader board ';
          break;
        case 'EnableTrainingIntent':
          response += 'turn on training mode ';
          break;
        case 'DisableTrainingIntent':
          response += 'turn off training mode ';
          break;
        case 'SelectIntent':
          response += 'select a new game ';
          break;

        // These should be handled - so log an error
        case 'AMAZON.RepeatIntent':
        case 'AMAZON.HelpIntent':
        case 'AMAZON.StopIntent':
        case 'AMAZON.CancelIntent':
        case 'SessionEndedRequest':
        default:
          console.log('Error - unhandled ' + intent.name + ' in state ' + state);
          response += 'do that ';
          break;
      }

      // Get the state
      if (stateMapping[state]) {
        response += stateMapping[state];
      } else {
        response += 'at this time';
      }
      response += '. ';

      return response;
    },
    sayGame: function(game) {
      const games = {'standard': 'standard blackjack',
        'tournament': 'the tournament round',
        'spanish': 'spanish 21'};

      return (games[game] ? games[game] : game);
    },
  };
};

module.exports = utils;

