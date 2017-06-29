//
// Localized resources
//

const resources = {
  // From index.js
  'UNKNOWNINTENT_RESET': 'Tut mir leid, dass ich nicht bekommen, dass. Sagen ja oder nein.',
  'UNKNOWNINTENT_RESET_REPROMPT': 'Sagen ja oder nein.',
  'UNKNOWNINTENT_NEWGAME': 'Tut mir leid, dass ich nicht bekommen, dass. Sagen sie wetten.',
  'UNKNOWNINTENT_NEWGAME_REPROMPT': 'Sagen sie wetten.',
  'UNKNOWNINTENT_INSURANCE_RESET': 'Tut mir leid, dass ich nicht bekommen, dass. Sagen ja oder nein.',
  'UNKNOWNINTENT_INSURANCE_REPROMPT': 'Sagen ja oder nein.',
  'UNKNOWNINTENT_INGAME': 'Tut mir leid, dass ich nicht bekommen, dass. Sagen sie wiederholen.',
  'UNKNOWNINTENT_INGAME_REPROMPT': 'Sagen sie wiederholen.',
  // From BlackjackUtils.js
  'ERROR_REPROMPT': 'Wie kann ich helfen?',
  'CHANGE_CARD_TEXT': 'Sie können die folgenden optionen ändern:\n\n - SCHLÄGT SOFT SIEBZEHN: Ob der händler eine weiche 17 summe treffen wird. Kann AN or AUS sein.\n - AUFGEBEN: Ob eine aufgeben angeboten wird. Kann AN or AUS sein\n - EINSATZ VERDOPPELN: Ob eine einsatz verdoppeln angeboten wird.  Kann AN or AUS sein.\n - VERDOPPLUNG NACH SPLIT: Ob sie nach dem spalten verdoppeln können.  Kann AN or AUS sein.\n - RESPLIT ACES: Ob sie Asse wieder spalten können oder nicht.  Kann AN or AUS sein.\n - ANZAHL DER KARTENDECKS: die anzahl der kartendecks im spiel. Kann EINS, ZWEI, VIER, SECHS oder ACHT sein.\n - ANZAHL DER SPIELHANDS SPLATEN: Die maximale anzahl an spielhands, die sie haben können. Kann EINS, ZWEI, DREI oder VIER sein.\n\nZum beispiel sagen "Ändere anzahl der kartendecks zu zwei" wenn du mit zwei kartendecks spielen möchtest.\nBeachten sie, dass das kartendeck gemischt wird, wenn sie die spielregeln ändern',
  // From Betting.js
  'BAD_BET_FORMAT': 'Nicht wette für {0}',
  // From Blackjack.js
  'BLACKJACKINTENT_NO_ACTION': 'Tut mir leid, dass ich diese Aktion nicht fangen. Bitte sagen Sie, was Sie wollen, zu tun auf dieser Seite wie Hit oder stehen. Wie kann ich helfen?',
  'BLACKJACKINTENT_UNKNOWN_ACTION': 'Tut mir leid, ich weiß nicht, wie {0}. Bitte sagen Sie, was Sie wollen, zu tun auf dieser Seite wie Hit oder stehen. Wie kann ich helfen?',
  // From ChangeRules.js
  'CHANGERULES_NO_RULE': 'Es tut mir leid, ich weiß nicht, welche Regel sich ändern muss. Überprüfen Sie die Alexa-Anwendung für Regeln, die Sie ändern können. Wie kann ich helfen?',
  'CHANGERULES_NO_RULE_VALUE': 'Es tut mir leid, ich verstehe nicht, wie man die Anzahl {0}. Überprüfen Sie die Alexa-Anwendung für Regeln, die Sie ändern können. Wie kann ich helfen?',
  'CHANGERULES_NO_RULE_OPTION': 'Es tut mir leid, ich verstehe nicht, wie man die Anzahl {0}. Überprüfen Sie die Alexa-Anwendung für Regeln, die Sie ändern können. Wie kann ich helfen?',
  'CHANGERULES_CANT_CHANGE_RULE': 'Es tut mir leid, ich konnte die Anzahl {0} auf {1}. Überprüfen Sie die Alexa-Anwendung für Regeln, die Sie ändern können. Wie kann ich helfen?',
  'CHANGERULES_CARD_TITLE': 'Spielen Sie blackjack',
  'FULL_RULES': 'Die vollständigen Regeln sind {0}',
  // From Exit.js
  'EXIT_BANKROLL': 'Verlassen Sie mit €{0}.',
  'EXIT_GOODBYE': 'Auf Wiedersehen.',
  // From Help.js
  'HELP_GENERIC_HELP': 'Sie können ein Spiel spielen, indem Sie sagen wetten, oder Sie können sagen Ausfahrt<break time=\'300ms\'/>Wie kann ich Ihnen helfen?',
  'HELP_CARD_TITLE': 'Blackjack Befehle',
  'HELP_CARD_TEXT': 'Sie können sagen WETTEN um eine wette zu platzieren. Wenn kein betrag erwähnt wird, wird das spiel die letzte wette verwenden.\nWährend einer Hand, fragen WAS SOLLTE ICH TUN um die grundlegende Strategie Vorschlag zu hören.\nSagen SPIELREGELN ZU LESEN wenn du die regeln hören willst.\nÄNDERE wird die Spielregeln ändern. Sie können die folgenden optionen ändern:\n\n - SCHLÄGT SOFT SIEBZEHN: Ob der händler eine weiche 17 summe treffen wird. Kann AN or AUS sein.\n - AUFGEBEN: Ob eine aufgeben angeboten wird. Kann AN or AUS sein\n - EINSATZ VERDOPPELN: Ob eine einsatz verdoppeln angeboten wird.  Kann AN or AUS sein.\n - VERDOPPLUNG NACH SPLIT: Ob sie nach dem spalten verdoppeln können.  Kann AN or AUS sein.\n - RESPLIT ACES: Ob sie Asse wieder spalten können oder nicht.  Kann AN or AUS sein.\n - ANZAHL DER KARTENDECKS: die anzahl der kartendecks im spiel. Kann EINS, ZWEI, VIER, SECHS oder ACHT sein.\n - ANZAHL DER SPIELHANDS SPLATEN: Die maximale anzahl an spielhands, die sie haben können. Kann EINS, ZWEI, DREI oder VIER sein.\n\nZum beispiel sagen "Ändere anzahl der kartendecks zu zwei" wenn du mit zwei kartendecks spielen möchtest.\nBeachten sie, dass das kartendeck gemischt wird, wenn sie die spielregeln ändern',
  // From Launch.js
  'LAUNCH_WELCOME': 'Willkommen bei den Blackjack Spieler. ',
  'LAUNCH_STARTGAME': 'Sie können ein Spiel starten, indem Sie sagen die wort wetten ... Wie kann ich Ihnen helfen?',
  'LAUNCH_DEFAULTSTATE_TEXT': 'Sie haben €{0}. Sie sagen wetten um ein neues spiel zu beginnen. ... Wie kann ich Ihnen helfen?',
  'LAUNCH_NONDEFAULTSTATE_TEXT': 'Sie haben €{0}. Sie sagen wetten sagen um ein neues spiel zu beginnen oder Spiel Zurücksetzen um auf die Standard-Regeln und Bankroll zurücksetzen. ... Wie kann ich Ihnen helfen?',
  // From Reset.js
  'RESET_CONFIRM': 'Möchten Sie das Spiel zurücksetzen? Dies wird Ihre Bankroll und Regeln des Spiels zurücksetzen.',
  'RESET_COMPLETED': 'Sie haben € 5000. Sagen wetten, um ein neues Spiel zu beginnen.',
  'RESET_REPROMPT': 'Sagen wetten, um ein neues Spiel zu beginnen.',
  'RESET_ABORTED': 'Spiel nicht zurückgesetzt. Sagen wetten, um ein neues Spiel zu beginnen.',
  // From Rules.js
  'RULES_CARD_TITLE': 'Blackjack Regeln',
  // From PlayGame.js
  'SUGGEST_OPTIONS': 'Sollten sie {0}|Das Buch sagt, sollten Sie {0}|Das Buch würden Sie sagen {0}|Nach Grundlegende Strategie sollten sie {0}|Das Buch würde vorschlagen dass sie {0}|Ich denke, man sollte {0}|Grundlegende Strategie würde vorschlagen dass Sie {0}',
  'SUGGEST_TURNOVER': 'Ich kann keine Anregung geben, wenn das Spiel vorbei ist',
  'REPORT_ERROR': 'Ein Fehler ist aufgetreten: {0}',
  'INVALID_ACTION': 'Tut mir leid, {0} keine gültige Aktion zu diesem Zeitpunkt ist. ',
  'YOU_BET_TEXT': 'Sie wetten €{0}. ',
  'YOUR_BANKROLL_TEXT': 'Sie haben €{0}. ',
  'HELP_TAKE_INSURANCE': 'Sie können sagen ja um Versicherung zu nehmen oder nein abzulehnen.',
  'HELP_INSURANCE_INSUFFICIENT_BANKROLL': 'Sie haben nicht genug Geld um Versicherung zu nehmen - sagen Sie nein um Versicherung abzulehnen.',
  'HELP_YOU_CAN_SAY': 'Man kann sagen {0}.',
  'HELP_MORE_OPTIONS': ' Überprüfen Sie die Alexa-Anwendung um weitere Optionen anzuzeigen.<break time=\'300ms\'/> Wie kann ich Ihnen helfen?',
  'INTERNAL_ERROR': 'Entschuldigung, interner Fehler. Was kann ich sonst noch helfen?',
  'CHANGERULES_REPROMPT': 'Wollen sie wetten?',
  'CHANGERULES_CHECKAPP': ' Überprüfen Sie die Alexa-Anwendung für den vollständigen Satz von Regeln. Wollen sie wetten?',
  'SPEECH_ERROR_CODE': 'Fehlercode {0}',
  'ASK_TAKE_INSURANCE': 'Möchten Sie Versicherung nehmen? Sag ja oder nein',
  'ASK_POSSIBLE_ACTIONS': 'Sie wollen {0}?',
  'ASK_WHAT_TO_DO': 'Was würdest du gern tun?',
  'ASK_PLAY_AGAIN': 'Würdest du gerne wieder spielen?',
  'RESULT_AFTER_HIT_BUST': 'Du hast eine {0} und überkaufen. ',
  'RESULT_AFTER_HIT_NOBUST': 'Du hast eine {0} für insgesamt {1}. ',
  'RESULT_BANKROLL_RESET': 'Bankroll zurücksetzen',
  'RESULT_DECK_SHUFFLED': 'Kartendeck gemischt',
  'DEALER_HOLE_CARD': 'Der händler hatte eine {0} unten.',
  'DEALER_BUSTED': ' Der Händler überkaufen.',
  'DEALER_BLACKJACK': ' Der Händler hatte einen blackjack.',
  'DEALER_TOTAL': ' Der Händler hatte eine Gesamtmenge von {0}.',
  'DEALER_DRAW': ' Der Händler erhält ',
  'DEALER_CARD_ARTICLE': 'eine {0}',
  'PLAYER_HIT_BUSTED': 'Du hast eine {0} und überkaufen. ',
  'DEALER_SHOWING': ' Der Händler zeigt eine {0}.',
  'SPLIT_TENS': 'Sie teilen Zehner. ',
  'SPLIT_PAIR': 'Sie teilen ein paar {0}. ',
  'SURRENDER_RESULT': 'Sie aufgeben. ',
  'DEALER_HAD_BLACKJACK': 'Der Händler hatte einen blackjack. ',
  'DEALER_NO_BLACKJACK': 'Der Händler haben keinen Blackjack. ',
  'READHAND_PLAYER_TOTAL_ACTIVE_BLACKJACK': 'Sie haben {0} für einen blackjack. ',
  'READHAND_PLAYER_TOTAL_END_BLACKJACK': 'Sie hatten {0} für einen blackjack. ',
  'READHAND_PLAYER_BUSTED_SOFT': 'Sie überkaufen mit {0} für insgesamt weiche {1}. ',
  'READHAND_PLAYER_TOTAL_ACTIVE_SOFT': 'Sie haben {0} für insgesamt weiche {1}.  ',
  'READHAND_PLAYER_TOTAL_END_SOFT': 'Sie hatten {0} für insgesamt weiche {1}.  ',
  'READHAND_PLAYER_BUSTED': 'Sie überkaufen mit {0} für insgesamt {1}.  ',
  'READHAND_PLAYER_TOTAL_ACTIVE': 'Sie haben {0} für insgesamt {1}.  ',
  'READHAND_PLAYER_TOTAL_END': 'Sie hatten {0} für insgesamt {1}.  ',
  'READHAND_DEALER_ACTIVE': 'der Händler zeigt eine {0}.',
  'READHAND_DEALER_DONE': 'der Händler zeigte eine {0}. ',
  'RULES_DECKS': '{0} kartendeck. ',
  'RULES_BET_RANGE': 'Einsatz von €{0} bis €{1}. ',
  'RULES_HIT_SOFT17': 'Händler schlägt bei weichen 17. ',
  'RULES_STAND_SOFT17': 'Händler steht auf weichen 17. ',
  'RULES_RESPLIT_ACES': 'Können Asse resplit. ',
  'RULES_SPLIT_NOT_ALLOWED': 'Spalten von spielhands sind nicht erlaubt. ',
  'RULES_NUMBER_OF_SPLITS': 'Spalten sie bis zu {0} spielhands. ',
  'RULES_DAS_ALLOWED': 'Doppelklicken Sie nach Split erlaubt. ',
  'RULES_DAS_NOT_ALLOWED': 'Doppelklicken Sie nach Split ist nicht möglich. ',
  'RULES_DOUBLE': 'Verdoppeln {0}. ',
  'RULES_BLACKJACK': 'Blackjack zahlt {0}. ',
  'RULES_SURRENDER_OFFERED': 'Aufgeben erlaubt. ',
  'RULES_NO_SURRENDER': 'Aufgeben nicht angeboten. ',
  'PLAYER_HIT_NOTBUSTED_SOFT': 'Du hast eine {0} für insgesamt weiche {1}. ',
  'PLAYER_HIT_NOTBUSTED': 'Du hast eine {0} für insgesamt {1}. ',
  'GOOD_HIT_OPTIONS': 'Du hast eine {0} für insgesamt {1}. ',
  'GREAT_HIT_OPTIONS': 'Du hast eine {0} für insgesamt {1}. ',
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
    const actionMapping = {'hit': 'hit', 'karte': 'hit', 'carte': 'hit', 'nehmen sie eine karte': 'hit',
      'stand': 'stand', 'stay': 'stand', 'keine karte': 'stand', 'reste': 'stand',
      'surrender': 'surrender', 'give up': 'surrender',
      'double': 'double', 'verdoppeln': 'double', 'einsatz verdoppeln': 'double',
      'split': 'split', 'teilen': 'split',
      'shuffle': 'shuffle', 'shuffle deck': 'shuffle',
      'zurücksetzen': 'resetbankroll', 'spiel zurücksetzen': 'resetbankroll',
      'wetten': 'bet', 'austeilen': 'bet'};
    const action = actionMapping[actionSlot.value.toLowerCase()];

    // Look it up in lowercase
    return (action == undefined) ? null : action;
  },
  mapChangeValue: function(value) {
    const valueMapping = {'an': true, 'aus': false, 'aktivieren': true, 'deaktivieren': false, 'aktiviert': true, 'deaktiviert': false,
      '3 to 2': 0.5, 'drei zu zwei': 0.5, '6 to 5': 0.2, 'sechs zu fünf': 0.2, 'gleich': 0, 'gleiches geld': 0,
      'ein kartendeck': 1, 'zwei kartendecks': 2, 'vier kartendecks': 4, 'sechs kartendecks': 6, 'acht kartendecks': 8,
      'zwei kartendeck': 2, 'vier kartendeck': 4, 'sechs kartendeck': 6, 'acht kartendeck': 8,
      'ein': 1, 'zwei': 2, 'drei': 3, 'vier': 4, 'fünf': 5, 'sechs': 6, 'acht': 8,
      '1': 1, '2': 2, '3': 3, '4': 4, '6': 6, '8': 8};
    return valueMapping[value];
  },
  mapChangeRule: function(rule) {
    const ruleMapping = {'hit soft seventeen': 'hitSoft17', 'hit seventeen': 'hitSoft17', 'soft seventeen': 'hitSoft17',
      'händler schlägt seventeen': 'hitSoft17', 'händler schlägt soft seventeen': 'hitSoft17',
      'schlägt soft siebzehn': 'hitSoft17', 'schlägt siebzehn': 'hitSoft17', 'soft siebzehn': 'hitSoft17',
      'händler schlägt siebzehn': 'hitSoft17', 'händler schlägt soft siebzehn': 'hitSoft17',
      'surrender': 'surrender', 'aufgeben': 'surrender',
      'verdoppeln': 'double', 'einsatz verdoppeln': 'double',
      'verdopplung nach split': 'doubleaftersplit', 'verdopplung nach splaten': 'doubleaftersplit',
      'split asse': 'resplitAces', 'splaten asse': 'resplitAces',
      'blackjack zahlt': 'blackjackBonus',
      'anzahl der kartendecks': 'numberOfDecks', 'decks': 'numberOfDecks', 'kartendecks': 'numberOfDecks',
      'die anzahl der kartendecks': 'numberOfDecks', 'die decks': 'numberOfDecks', 'die kartendecks': 'numberOfDecks',
      'splaten spielhands': 'maxSplitHands', 'spielhands splaten': 'maxSplitHands', 'anzahl der splaten spielhands': 'maxSplitHands',
      'die splaten spielhands': 'maxSplitHands', 'die spielhands splaten': 'maxSplitHands', 'die anzahl der splaten spielhands': 'maxSplitHands',
      'anzahl der spielhands splaten': 'maxSplitHands', 'anzahl der splits': 'maxSplitHands',
      'die anzahl der spielhands splaten': 'maxSplitHands', 'die anzahl der splits': 'maxSplitHands'};
    return ruleMapping[rule];
  },
  mapActionToSuggestion: function(action) {
    const actionMapping = {'insurance': 'versicherung', 'noinsurance': 'keine versicherung', 'hit': 'hit',
                    'stand': 'stay', 'split': 'teilen', 'double': 'einsatz verdoppeln', 'surrender': 'aufgeben'};
    return actionMapping[action];
  },
  mapServerError: function(error) {
    const errorMapping = {'bettoosmall': 'Ihre Wette liegt unter dem Mindestwert von €5',
                        'bettoolarge': 'Ihre Wette ist mehr als der Höchstbetrag von €1000',
                        'betoverbankroll': 'Ihre Wette ist mehr als der Ihre verfügbaren bankroll'};
    return (errorMapping[error] ? errorMapping[error] : 'Interner Fehler');
  },
  cardRanks: function(card) {
    const names = ['keine', 'ass', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'buchse', 'königin', 'könig'];
    return names[card.rank];
  },
  pluralCardRanks: function(card) {
    const names = ['keine', 'asse', 'zweien', 'dreier', 'vieren', 'fünfer', 'sechser', 'siebener', 'achter', 'neunen', 'zehnen', 'buben', 'damen', 'könige'];
    return names[card.rank];
  },
  mapPlayOption: function(option) {
    const optionMapping = {'resetbankroll': 'spiel zurücksetzen',
                          'shuffle': 'shuffle',
                          'bet': 'wetten',
                          'hit': 'hit',
                          'stand': 'stay',
                          'double': 'einsatz verdoppeln',
                          'insurance': 'versicherung',
                          'noinsurance': 'keine versicherung',
                          'split': 'teilen',
                          'surrender': 'aufgeben'};
    return (optionMapping[option] ? optionMapping[option] : option);
  },
  mapOutcome: function(outcome) {
    const outcomeMapping = {'blackjack': 'Gewinnen Sie mit einem natürlichen Blackjack!',
               'dealerblackjack': 'Der Händler hat einen Blackjack.',
               'nodealerblackjack': 'Die Händler haben keinen Blackjack.',
               'win': 'Sie gewann!',
               'loss': 'Sie verloren.',
               'push': 'Es ist eine Krawatte.',
               'surrender': 'Sie übergeben.'};
    return outcomeMapping[outcome];
  },
  mapHandNumber: function(hand) {
    const mapping = ['Erste hand ', 'Zweite hand ', 'Dritte hand ', 'Vierte hand '];
    return mapping[hand];
  },
  mapDouble: function(rule) {
    const doubleMapping = {'any': 'auf alle karten',
                          '10or11': 'auf 10 oder 11 nur',
                          '9or10or11': 'auf 9 bis 11 nur',
                          'none': 'nicht erlaubt'};
    return doubleMapping[rule];
  },
  mapBlackjackPayout: function(rule) {
    const blackjackPayout = {'0.5': '3 zu 2',
                           '0.2': '6 zu 5',
                           '0': 'sogar geld'};
    return blackjackPayout[rule];
  },
};

