//
// Handles "unhandled" intents - often because the user is trying to
// do an action that isn't allowed at this point in the flow
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');

module.exports = {
  canHandle: function(handlerInput) {
    return true;
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(event.request.locale);

    if (!event.request.intent) {
      // Something we really don't handle
      console.log('Error - Unhandled didn\'t get an intent');
      return handlerInput.responseBuilder
        .speak(res.strings.INTERNAL_ERROR)
        .reprompt(res.strings.ERROR_REPROMPT)
        .getResponse();
    } else {
      let speech = buildUnhandledResponse(handlerInput, bjUtils.getState(attributes));
      const reprompt = playgame.getContextualHelp(event, attributes);

      speech += reprompt;
      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt(reprompt)
        .getResponse();
    }
  },
};

function buildUnhandledResponse(handlerInput, state) {
  const event = handlerInput.requestEnvelope;
  const res = require('../resources')(event.request.locale);
  const intent = event.request.intent;
  let format = res.strings.UNHANDLED_FORMAT;
  let action;
  let stateValue;

  // What are they trying to do?
  switch (intent.name) {
    case 'BlackjackIntent':
      // This one is a little more involved - need to get the ActionSlot
      if (intent.slots && intent.slots.Action && intent.slots.Action.value) {
        action = intent.slots.Action.value;
      } else {
        action = res.strings.UNHANDLED_VALUE_GENERIC;
      }
      break;
    case 'SuggestIntent':
      action = res.strings.UNHANDLED_VALUE_SUGGEST;
      break;
    case 'ResetIntent':
      action = res.strings.UNHANDLED_VALUE_RESET;
      break;
    case 'ChangeRulesIntent':
      action = res.strings.UNHANDLED_VALUE_CHANGERULES;
      break;
    case 'AMAZON.YesIntent':
      action = res.strings.UNHANDLED_VALUE_YES;
      format = res.strings.UNHANDLED_YESNO_FORMAT;
      break;
    case 'AMAZON.NoIntent':
      action = res.strings.UNHANDLED_VALUE_NO;
      format = res.strings.UNHANDLED_YESNO_FORMAT;
      break;
    case 'BettingIntent':
      action = res.strings.UNHANDLED_VALUE_BET;
      break;
    case 'PlaceSideBetIntent':
      action = res.strings.UNHANDLED_VALUE_SIDEBET;
      break;
    case 'RemoveSideBetIntent':
      action = res.strings.UNHANDLED_VALUE_REMOVESIDEBET;
      break;
    case 'RulesIntent':
      action = res.strings.UNHANDLED_VALUE_RULES;
      break;
    case 'HighScoreIntent':
      action = res.strings.UNHANDLED_VALUE_HIGHSCORE;
      break;
    case 'EnableTrainingIntent':
      action = res.strings.UNHANDLED_VALUE_ENABLETRAINING;
      break;
    case 'DisableTrainingIntent':
      action = res.strings.UNHANDLED_VALUE_DISABLETRAINING;
      break;
    case 'SelectIntent':
      action = res.strings.UNHANDLED_VALUE_SELECT;
      break;
    default:
      action = res.strings.UNHANDLED_VALUE_GENERIC;
      break;
  }

  // Get the state
  if (res.strings['UNHANDLED_STATE_' + state]) {
    stateValue = res.strings['UNHANDLED_STATE_' + state];
  } else {
    stateValue = res.strings.UNHANDLED_STATE_GENERIC;
  }

  return format.replace('{0}', action).replace('{1}', stateValue);
}
