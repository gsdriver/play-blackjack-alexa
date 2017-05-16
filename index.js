'use strict';

const Alexa = require('alexa-sdk');
const Launch = require('./intents/Launch');
const Blackjack = require('./intents/Blackjack');
const Betting = require('./intents/Betting');
const Suggest = require('./intents/Suggest');
const Rules = require('./intents/Rules');
const ChangeRules = require('./intents/ChangeRules');
const Yes = require('./intents/Yes');
const No = require('./intents/No');
const Repeat = require('./intents/Repeat');
const Help = require('./intents/Help');

// var APP_ID = "amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce";

// Handlers for our skill
const handlers = {
  'LaunchRequest': Launch.handleIntent,
  'BlackjackIntent': Blackjack.handleIntent,
  'BettingIntent': Betting.handleIntent,
  'SuggestIntent': Suggest.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'ChangeRulesIntent': ChangeRules.handleIntent,
  'AMAZON.YesIntent': Yes.handleIntent,
  'AMAZON.NoIntent': No.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'SessionEndedRequest': function() {
    this.emit('AMAZON.CancelIntent');
  },
  'AMAZON.StopIntent': function() {
    this.emit('AMAZON.CancelIntent');
  },
  'AMAZON.CancelIntent': function() {
    this.emit(':tell', 'Goodbye');
  },
};

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);

  alexa.registerHandlers(handlers);
  alexa.execute();
};
