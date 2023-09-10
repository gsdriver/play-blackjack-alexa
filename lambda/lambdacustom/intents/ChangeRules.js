//
// Handles the intent to change the rules of the game
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const upsell = require('../UpsellEngine');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    return ((game.possibleActions.indexOf('bet') >= 0)
      && !attributes.temp.joinTournament
      && (request.type === 'IntentRequest')
      && ((request.intent.name === 'ChangeRulesIntent') || (request.intent.name === 'ChangeOptionIntent')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const changeSlotValue = (event.request.intent && event.request.intent.slots && event.request.intent.slots.Change) ? (event.request.intent.slots.Change.value || '') : '';
    const optionSlotValue = (event.request.intent && event.request.intent.slots && event.request.intent.slots.ChangeOption) ? (event.request.intent.slots.ChangeOption.value || '') : '';
    const res = require('../resources')(event.request.locale);
    let ruleError;

    const rules = buildRulesObject(res, changeSlotValue, optionSlotValue);

    return new Promise((resolve, reject) => {
      if (!attributes[attributes.currentGame].canChangeRules) {
        // Sorry, you can't reset this or change the rules
        ruleError = res.strings.TOURNAMENT_NOCHANGERULES;
      } else if (attributes.paid && attributes.paid.changerules && (attributes.paid.changerules.state !== 'PURCHASED')) {
        // Upsell the user to an ability to change the rules
        const directive = upsell.getUpsell(attributes, 'changerules');
        if (directive) {
          directive.token = directive.token + '.launch';
          resolve(handlerInput.responseBuilder
            .addDirective(directive)
            .withShouldEndSession(true)
            .getResponse());
          return;
        }
      } else if (!rules && (!changeSlotValue || !optionSlotValue)) {
        // In this case, there were no rules and not enough slots that were provided
        ruleError = res.strings.CHANGERULES_NO_RULE;
      } else {
        if (!rules) {
          // There were slots but we couldn't find the rule
          ruleError = res.strings.CHANGERULES_CANT_CHANGE_RULE.replace('{0}', changeSlotValue).replace('{1}', optionSlotValue);
        } else {
          playgame.changeRules(attributes,
            event.request.locale, rules,
            (error, response, speech, reprompt) => {
            // Now get the full set of rules for the card
            if (!error) {
              const output = playgame.readRules(attributes, event.request.locale);
              let cardText = '';

              if (output.speech) {
                cardText = res.strings.FULL_RULES.replace('{0}', output.speech);
              }

              resolve(handlerInput.responseBuilder
                .speak(speech)
                .reprompt(res.strings.ERROR_REPROMPT)
                .withSimpleCard(res.strings.CHANGERULES_CARD_TITLE, cardText)
                .getResponse());
            } else {
              resolve(bjUtils.getResponse(handlerInput, error, response, speech, reprompt));
            }
          });
        }
      }

      // If there was a rule error, then let's get the rules and display those
      if (ruleError) {
        let cardText = '';

        if ((attributes.platform === 'google') || attributes.bot) {
          ruleError = ruleError.replace('{2}', '');
        } else {
          ruleError = ruleError.replace('{2}', res.strings.CHANGERULES_ERR_CHECKAPP);
        }

        // Prepare card text with a full set of rules that can be changed
        const output = playgame.readRules(attributes, event.request.locale);
        if (output.speech) {
          cardText = res.strings.FULL_RULES.replace('{0}', output.speech);
          cardText += '\n';
        }

        if (attributes[attributes.currentGame].canReset) {
          cardText += res.strings.CHANGE_CARD_TEXT;
        }

        resolve(handlerInput.responseBuilder
          .speak(ruleError)
          .reprompt(res.strings.ERROR_REPROMPT)
          .withSimpleCard(res.strings.CHANGERULES_CARD_TITLE, cardText)
          .getResponse());
      }
    });
  },
};

//
// Determines which rules to change
//
function buildRulesObject(res, option, value) {
  let ruleValue = res.mapChangeValue(value.toLowerCase());
  const ruleOption = res.mapChangeRule(option.toLowerCase());
  const rules = {};

  // Check double option first .. a bit of a hack
  const doubleValue = getDoubleOption(option, value);
  if (doubleValue !== undefined) {
    rules.double = doubleValue;
    return rules;
  }
  
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
      // Should be 0 (off), 1 (any), 9 (9or10or11), or 10 (10or11)
      if (ruleValue === 1) {
        rules[ruleOption] = 'any';
      } else if (ruleValue === 9) {
        rules[ruleOption] = '9or10or11';
      } else if (ruleValue === 10) {
        rules[ruleOption] = '10or11';
      } else {
        rules[ruleOption] = 'none';
      }
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

// This isn't a proper localized function but f it
function getDoubleOption(option, value) {
  // We throw the change and option slots together for this
  const changes = `${option} ${value}`.toLowerCase().split(' ');

  console.log('testing', changes);

  // Is the word "double" in there?
  if (changes.indexOf('double') >= 0) {
    // If "split" is also mentioned it's something else
    if (changes.indexOf('split') >= 0) {
      return undefined;
    }

    // OK trying to double -- see if the word "any" is in there
    if (changes.indexOf('any') >= 0) {
      return 'any';
    }

    // How about none, not, or no?
    if ((changes.indexOf('none') >= 0) || (changes.indexOf('not') >= 0) || (changes.indexOf('no') >= 0)) {
      return 'none';
    }

    // Do they mention 9?
    if ((changes.indexOf('9') >= 0) || (changes.indexOf('nine') >= 0)) {
      return '9or10or11';
    }

    // And how about 10?
    if ((changes.indexOf('10') >= 0) || (changes.indexOf('ten') >= 0)) {
      return '10or11';
    } 
  }

  return undefined;
}

