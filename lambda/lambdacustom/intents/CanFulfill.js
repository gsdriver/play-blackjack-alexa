//
// Checks whether we can fulfill this intent
// Note that this is processed outside of the normal Alexa SDK
// So we cannot use alexa-sdk functionality here
//

'use strict';

module.exports = {
  check: function(event) {
    const noSlotIntents = ['HighScoreIntent', 'AMAZON.RepeatIntent', 'AMAZON.FallbackIntent',
      'AMAZON.HelpIntent', 'AMAZON.YesIntent', 'AMAZON.NoIntent', 'AMAZON.StopIntent',
      'AMAZON.CancelIntent', 'SuggestIntent', 'ResetIntent', 'PlaceSideBetIntent',
      'RemoveSideBetIntent', 'RulesIntent', 'EnableTrainingIntent', 'DisableTrainingIntent',
      'PurchaseIntent', 'RefundIntent'];

    // Default to a negative response
    const response = {
    'version': '1.0',
      'response': {
        'canFulfillIntent': {
          'canFulfill': 'NO',
          'slots': {},
        },
      },
    };

    // If this is one we understand regardless of attributes,
    // then we can just return immediately
    let valid;
    if (noSlotIntents.indexOf(event.request.intent.name) > -1) {
      valid = true;
    } else {
      const res = require('../resources')(event.request.locale);

      if (event.request.intent.name == 'BettingIntent') {
        let amount = 0;

        // Need to validate Amount
        if (event.request.intent.slots && event.request.intent.slots.Amount
          && event.request.intent.slots.Amount.value) {
          amount = parseInt(event.request.intent.slots.Amount.value);
        }

        if (!isNaN(amount)) {
          // Valid bet
          valid = true;
        }
      } else if (event.request.intent.name == 'BlackjackIntent') {
        if (event.request.intent.slots && event.request.intent.slots.Action
          && event.request.intent.slots.Action.value) {
          valid = res.getBlackjackAction(event.request.intent.slots.Action);
        }
      } else if (event.request.intent.name == 'ChangeRulesIntent') {
        // Need change slot and change option slot
        const changeSlot = event.request.intent.slots.Change;
        const optionSlot = event.request.intent.slots.ChangeOption;

        if (changeSlot && changeSlot.value && optionSlot && optionSlot.value) {
          const ruleValue = res.mapChangeValue(optionSlot.value.toLowerCase());
          const ruleOption = res.mapChangeRule(changeSlot.value.toLowerCase());
          valid = (ruleValue && ruleOption);
        }
      }
    }

    if (valid) {
      // We can fulfill it - all slots are good
      let slot;

      response.response.canFulfillIntent.canFulfill = 'YES';
      for (slot in event.request.intent.slots) {
        if (slot) {
          response.response.canFulfillIntent.slots[slot] =
              {'canUnderstand': 'YES', 'canFulfill': 'YES'};
        }
      }
    }

    console.log('CanFulfill: ' + JSON.stringify(response));
    return response;
  },
};
