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
    const res = require('../' + this.event.request.locale + '/resources');

    if (!this.attributes[this.attributes.currentGame].canChangeRules) {
      // Sorry, you can't reset this or change the rules
      ruleError = res.strings.TOURNAMENT_NOCHANGERULES;
    } else if (!changeSlot) {
      ruleError = res.strings.CHANGERULES_NO_RULE;
    } else if (!changeSlot.value) {
      ruleError = res.strings.CHANGERULES_NO_RULE_VALUE.replace('{0}', changeSlot.value);
    } else if (!optionSlot || !optionSlot.value) {
      ruleError = res.strings.CHANGERULES_NO_RULE_OPTION.replace('{0}', changeSlot.value);
    } else {
      // Build the appropriate rules object and set it
      const rules = buildRulesObject(res, changeSlot.value, optionSlot.value);
      if (!rules) {
        ruleError = res.strings.CHANGERULES_CANT_CHANGE_RULE.replace('{0}', changeSlot.value).replace('{1}', optionSlot.value);
      } else {
        playgame.changeRules(this.attributes,
          this.event.request.locale, rules,
          (error, response, speech, reprompt) => {
          // Now get the full set of rules for the card
          if (!error) {
            playgame.readRules(this.attributes, this.event.request.locale,
                      (readSpeech, readPrompt) => {
              let cardText = '';

              if (readSpeech) {
                cardText = res.strings.FULL_RULES.replace('{0}', readSpeech);
              }

              bjUtils.emitResponse(this, null, null,
                      speech, res.strings.ERROR_REPROMPT,
                      res.strings.CHANGERULES_CARD_TITLE, cardText);
            });
          } else {
            bjUtils.emitResponse(this, error, response, speech, reprompt);
          }
        });
      }
    }

    // If there was a rule error, then let's get the rules and display those
    if (ruleError) {
      let cardText = '';

      // Prepare card text with a full set of rules that can be changed
      playgame.readRules(this.attributes, this.event.request.locale, (speech, reprompt) => {
        if (speech) {
          cardText = res.strings.FULL_RULES.replace('{0}', speech);
          cardText += '\n';
        }

        if (this.attributes[this.attributes.currentGame].canReset) {
          cardText += res.strings.CHANGE_CARD_TEXT;
        }
        bjUtils.emitResponse(this, null, null,
                ruleError, res.strings.ERROR_REPROMPT,
                res.strings.CHANGERULES_CARD_TITLE, cardText);
      });
    }
  },
};

//
// Determines which rules to change
//
function buildRulesObject(res, option, value) {
  let ruleValue = res.mapChangeValue(value.toLowerCase());
  const ruleOption = res.mapChangeRule(option.toLowerCase());
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
