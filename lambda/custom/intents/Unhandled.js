//
// Handles "unhandled" intents - often because the user is trying to
// do an action that isn't allowed at this point in the flow
//

'use strict';

const playgame = require('../PlayGame');
const bjUtils = require('../BlackjackUtils');
const ri = require('@jargon/alexa-skill-sdk').ri;

module.exports = {
  canHandle: function(handlerInput) {
    return true;
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if (!event.request.intent) {
      // Something we really don't handle
      console.log('Error - Unhandled didn\'t get an intent');
      return handlerInput.jrb
        .speak(ri('INTERNAL_ERROR'))
        .reprompt(ri('ERROR_REPROMPT'))
        .getResponse();
    } else {
      return buildUnhandledResponse(handlerInput, bjUtils.getState(attributes))
      .then((speechParams) => {
        let format = 'UNHANDLED_FORMAT';
        if ((handlerInput.requestEnvelope.request.intent === 'AMAZON.YesIntent') ||
            (handlerInput.requestEnvelope.request.intent === 'AMAZON.NoIntent')) {
          format = 'UNHANDLED_YESNO_FORMAT';
        }

        return handlerInput.jrm.render(ri(format, speechParams));
      }).then((speech) => {
        return playgame.getContextualHelp(handlerInput)
        .then((reprompt) => {
          return handlerInput.responseBuilder
            .speak(speech + reprompt)
            .reprompt(reprompt)
            .getResponse();
        });
      });
    }
  },
};

function buildUnhandledResponse(handlerInput, state) {
  const event = handlerInput.requestEnvelope;
  const intent = event.request.intent;
  const params = {};

  return handlerInput.jrm.renderObject(ri('UNHANDLED_DATA'))
  .then((data) => {
    // What are they trying to do?
    switch (intent.name) {
      case 'BlackjackIntent':
        // This one is a little more involved - need to get the ActionSlot
        if (intent.slots && intent.slots.Action && intent.slots.Action.value) {
          params.Value = intent.slots.Action.value;
        } else {
          params.Value = data.VALUE.GENERIC;
        }
        break;
      case 'SuggestIntent':
        params.Value = data.VALUE.SUGGEST;
        break;
      case 'ResetIntent':
        params.Value = data.VALUE.RESET;
        break;
      case 'ChangeRulesIntent':
        params.Value = data.VALUE.CHANGERULES;
        break;
      case 'AMAZON.YesIntent':
        params.Value = data.VALUE.YES;
        format = res.strings.UNHANDLED_YESNO_FORMAT;
        break;
      case 'AMAZON.NoIntent':
        params.Value = data.VALUE.NO;
        format = res.strings.UNHANDLED_YESNO_FORMAT;
        break;
      case 'BettingIntent':
        params.Value = data.VALUE.BET;
        break;
      case 'PlaceSideBetIntent':
        params.Value = data.VALUE.SIDEBET;
        break;
      case 'RemoveSideBetIntent':
        params.Value = data.VALUE.REMOVESIDEBET;
        break;
      case 'RulesIntent':
        params.Value = data.VALUE.RULES;
        break;
      case 'HighScoreIntent':
        params.Value = data.VALUE.HIGHSCORE;
        break;
      case 'EnableTrainingIntent':
        params.Value = data.VALUE.ENABLETRAINING;
        break;
      case 'DisableTrainingIntent':
        params.Value = data.VALUE.DISABLETRAINING;
        break;
      case 'SelectIntent':
        params.Value = data.VALUE.SELECT;
        break;
      default:
        params.Value = data.VALUE.GENERIC;
        break;
    }

    // Get the state
    if (data.STATE[state]) {
      params.State = data.STATE[state];
    } else {
      params.State = data.STATE.GENERIC;
    }

    return params;
  });
}
