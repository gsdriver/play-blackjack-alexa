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

// const APP_ID = 'amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce';
const APP_ID = 'amzn1.ask.skill.cb6939d9-2dac-4a8c-af5e-eb94563053f3';

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
      this.emit(this.event.request.intent.name);
    } else {
      this.emit('LaunchRequest');
    }
  },
  'LaunchRequest': Launch.handleIntent,
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
  alexa.registerHandlers(handlers, newGameHandlers, insuranceHandlers, inGameHandlers);
  alexa.execute();
};
