//
// Handles the intent to change the rules of the game
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  handleIntent: function() {
    // Which rule should we change?
    const changeSlot = this.event.request.intent.slots.Change;
    const optionSlot = this.event.request.intent.slots.ChangeOption;
    let ruleError;

    if (!changeSlot) {
      ruleError = 'I\'m sorry, I didn\'t catch a rule to change. Check the Alexa companion app for rules you can change. What else can I help with?';
    } else if (!changeSlot.value) {
      ruleError = 'I\'m sorry, I don\'t understand how to change ' + changeSlot.value + '. Check the Alexa companion app for rules you can change. What else can I help with?';
    } else if (!optionSlot || !optionSlot.value) {
      ruleError = 'I\'m sorry, I didn\'t catch how to change ' + changeSlot.value + '. Check the Alexa companion app for rules you can change. What else can I help with?';
    } else {
      // Build the appropriate rules object and set it
      const rules = buildRulesObject(changeSlot.value, optionSlot.value);
      if (!rules) {
        ruleError = 'I\'m sorry, I was unable to change ' + changeSlot.value + ' to ' + optionSlot.value + '. Check the Alexa companion app for available rules you can change. What else can I help with?';
      } else {
        playgame.changeRules(this.event.request.locale,
          this.event.session.user.userId, rules,
          (error, response, speech, reprompt, gameState) => {
          // Now get the full set of rules for the card
          this.attributes['gameState'] = gameState;
          if (!error) {
            playgame.readRules(this.attributes['gameState'],
              this.event.request.locale,
              this.event.session.user.userId,
              (readError, readResponse, readSpeech, readPrompt, newGameState) => {
              let cardText = '';

              if (readSpeech) {
                cardText += 'The full rules are ';
                cardText += readSpeech;
              }

              this.emit(':askWithCard', speech, 'What else can I help with?', 'Play Blackjack', cardText);
            });
          } else {
            bjUtils.emitResponse(this.emit, error, response, speech, reprompt);
          }
        });
      }
    }

    // If there was a rule error, then let's get the rules and display those
    if (ruleError) {
      let cardText = '';

      // Prepare card text with a full set of rules that can be changed
      playgame.readRules(this.attributes['gameState'],
        this.event.request.locale,
        this.event.session.user.userId,
        (error, response, speech, reprompt, gameState) => {
        if (speech) {
          cardText += 'The current rules are ';
          cardText += speech + '\n';
        }

        cardText += bjUtils.getChangeCardText();
        this.emit(':askWithCard', ruleError, 'What else can I help with?', 'Play Blackjack', cardText);
      });
    }
  },
};

//
// Determines which rules to change
//
function buildRulesObject(option, value) {
  const valueMapping = {'on': true, 'off': false, 'enable': true, 'disable': false, 'enabled': true, 'disabled': false,
    '3 to 2': 0.5, 'three to two': 0.5, '6 to 5': 0.2, 'six to five': 0.2, 'even': 0, 'even money': 0,
    'one deck': 1, 'two decks': 2, 'four decks': 4, 'six decks': 6, 'eight decks': 8,
    'two deck': 2, 'four deck': 4, 'six deck': 6, 'eight deck': 8,
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'eight': 8,
    '1': 1, '2': 2, '3': 3, '4': 4, '6': 6, '8': 8};
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
  const ruleValue = valueMapping[value.toLowerCase()];
  const ruleOption = ruleMapping[option.toLowerCase()];
  const rules = {};

  if ((ruleValue == undefined) || (ruleOption == undefined)) {
    return null;
  }

  // OK, now we can set the rule object appropriately
  switch (ruleOption) {
    case 'hitSoft17':
    case 'doubleaftersplit':
    case 'resplitAces':
      // True or false
      rules[ruleOption] = (ruleValue) ? true : false;
      break;
    case 'surrender':
      // Late or none
      rules[ruleOption] = (ruleValue) ? 'late' : 'none';
      break;
    case 'double':
      // None or any
      rules[ruleOption] = (ruleValue) ? 'any' : 'none';
      break;
    case 'blackjackBonus':
      // 0, 0.2, or 0.5 (0.5 is 'true')
      if ((ruleValue === 0) || (ruleValue === 0.2)) {
        rules[ruleOption] = ruleValue;
      } else if (ruleValue === false) {
        rules[ruleOption] = 0;
      } else {
        rules[ruleOption] = 0.5;
      }
      break;
    case 'numberOfDecks':
      // 1, 2, 4, 6, or 8
      if (ruleValue < 1) {
        ruleValue = 1;
      } else if (ruleValue > 8) {
        ruleValue = 8;
      } else if (ruleValue == 3) {
        ruleValue = 4;
      } else if ((ruleValue == 5) || (ruleValue == 7)) {
        ruleValue = 6;
      }

      rules[ruleOption] = ruleValue;
      break;
    case 'maxSplitHands':
    // 1-4 only
    if (ruleValue < 1) {
      ruleValue = 1;
    } else if (ruleValue > 4) {
      ruleValue = 4;
    }

    rules[ruleOption] = ruleValue;
    break;
  }

  return rules;
}
