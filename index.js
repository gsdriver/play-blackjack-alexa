'use strict';

const Alexa = require('alexa-sdk');
const Launch = require('./intents/Launch');
const Blackjack = require('./intents/Blackjack');
const Betting = require('./intents/Betting');
const Suggest = require('./intents/Suggest');
const Rules = require('./intents/Rules');
const ChangeRules = require('./intents/ChangeRules');
const TakeInsurance = require('./intents/TakeInsurance');
const DeclineInsurance = require('./intents/DeclineInsurance');
const Repeat = require('./intents/Repeat');
const Help = require('./intents/Help');
const Exit = require('./intents/Exit');
const Reset = require('./intents/Reset');
const playgame = require('./PlayGame');
const bjUtils = require('./BlackjackUtils');

const APP_ID = 'amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce';

const resetHandlers = Alexa.CreateStateHandler('CONFIRMRESET', {
  'AMAZON.YesIntent': Reset.handleYesReset,
  'AMAZON.NoIntent': Reset.handleNoReset,
  'SessionEndedRequest': Exit.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': function() {
    this.emit(':ask', 'Sorry, I didn\'t get that. Try saying Yes or No.', 'Try saying Yes or No.');
  },
});

const newGameHandlers = Alexa.CreateStateHandler('NEWGAME', {
  'BettingIntent': Betting.handleIntent,
  'ResetIntent': Reset.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'ChangeRulesIntent': ChangeRules.handleIntent,
  'AMAZON.YesIntent': Betting.handleIntent,
  'AMAZON.NoIntent': Exit.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'SessionEndedRequest': Exit.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': function() {
    this.emit(':ask', 'Sorry, I didn\'t get that. Try saying Bet.', 'Try saying Bet.');
  },
});

const insuranceHandlers = Alexa.CreateStateHandler('INSURANCEOFFERED', {
  'SuggestIntent': Suggest.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'AMAZON.YesIntent': TakeInsurance.handleIntent,
  'AMAZON.NoIntent': DeclineInsurance.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'SessionEndedRequest': Exit.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': function() {
    this.emit(':ask', 'Sorry, I didn\'t get that. Try saying Yes or No.', 'Try saying Yes or No.');
  },
});

const inGameHandlers = Alexa.CreateStateHandler('INGAME', {
  'BlackjackIntent': Blackjack.handleIntent,
  'SuggestIntent': Suggest.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'SessionEndedRequest': Exit.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': function() {
    this.emit(':ask', 'Sorry, I didn\'t get that. Try saying Repeat to hear the current status.', 'Try saying Repeat.');
  },
});

// Handlers for our skill
const handlers = {
  'NewSession': function() {
    if (this.event.request.type === 'IntentRequest') {
      // Set the state and route accordingly
      playgame.readCurrentHand(this.event.session.user.userId,
        (error, response, speech, reprompt, gameState) => {
        if (gameState) {
          this.attributes['firsthand'] = true;
          this.handler.state = bjUtils.getState(gameState);
        }
        this.emit(this.event.request.intent.name);
      });
    } else {
      this.emit('LaunchRequest');
    }
  },
  // Some intents don't make sense for a new session - so just launch instead
  'LaunchRequest': Launch.handleIntent,
  'SuggestIntent': Launch.handleIntent,
  'ResetIntent': Launch.handleIntent,
  'ChangeRulesIntent': Launch.handleIntent,
  'AMAZON.YesIntent': Launch.handleIntent,
  'AMAZON.NoIntent': Launch.handleIntent,
  'BettingIntent': Betting.handleIntent,
  'BlackjackIntent': Blackjack.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'SessionEndedRequest': Exit.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': function() {
    this.emit(':ask', 'Sorry, I didn\'t get that. Try saying Repeat to hear the current status.', 'Try saying Repeat.');
  },
};

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);

  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers, resetHandlers, newGameHandlers,
    insuranceHandlers, inGameHandlers);
  alexa.execute();
};
