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
  'LaunchRequest': Reset.handleNoReset,
  'AMAZON.YesIntent': Reset.handleYesReset,
  'AMAZON.NoIntent': Reset.handleNoReset,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    bjUtils.prepareToSave(this.attributes, this.event.request.locale);
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    this.emit(':ask', res.strings.UNKNOWNINTENT_RESET, res.strings.UNKNOWNINTENT_RESET_REPROMPT);
  },
});

const newGameHandlers = Alexa.CreateStateHandler('NEWGAME', {
  'LaunchRequest': Launch.handleIntent,
  'BettingIntent': Betting.handleIntent,
  'ResetIntent': Reset.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'ChangeRulesIntent': ChangeRules.handleIntent,
  'AMAZON.YesIntent': Betting.handleIntent,
  'AMAZON.NoIntent': Exit.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    bjUtils.prepareToSave(this.attributes, this.event.request.locale);
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    this.emit(':ask', res.strings.UNKNOWNINTENT_NEWGAME, res.strings.UNKNOWNINTENT_NEWGAME_REPROMPT);
  },
});

const insuranceHandlers = Alexa.CreateStateHandler('INSURANCEOFFERED', {
  'LaunchRequest': Launch.handleIntent,
  'SuggestIntent': Suggest.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'AMAZON.YesIntent': TakeInsurance.handleIntent,
  'AMAZON.NoIntent': DeclineInsurance.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    bjUtils.prepareToSave(this.attributes, this.event.request.locale);
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    this.emit(':ask', res.strings.UNKNOWNINTENT_INSURANCE, res.strings.UNKNOWNINTENT_INSURANCE_REPROMPT);
  },
});

const inGameHandlers = Alexa.CreateStateHandler('INGAME', {
  'LaunchRequest': Launch.handleIntent,
  'BlackjackIntent': Blackjack.handleIntent,
  'SuggestIntent': Suggest.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    bjUtils.prepareToSave(this.attributes, this.event.request.locale);
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    this.emit(':ask', res.strings.UNKNOWNINTENT_INGAME, res.strings.UNKNOWNINTENT_INGAME_REPROMPT);
  },
});

// Handlers for our skill
const handlers = {
  'NewSession': function() {
    if (this.event.request.type === 'IntentRequest') {
      // Set the state and route accordingly
      console.log('New session started: ' + JSON.stringify(this.event.request.intent));
      playgame.readCurrentHand(undefined, this.event.request.locale,
        this.event.session.user.userId,
        (error, response, speech, reprompt, gameState) => {
        this.attributes['gameState'] = gameState;
        if (gameState) {
          this.attributes['firsthand'] = true;
          this.handler.state = bjUtils.getState(gameState);
        }
        this.emit(this.event.request.intent.name);
      });
    } else {
      console.log('New session started: Launch');
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
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    bjUtils.prepareToSave(this.attributes, this.event.request.locale);
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    this.emit(':ask', res.strings.UNKNOWNINTENT_INGAME, res.strings.UNKNOWNINTENT_INGAME_REPROMPT);
  },
};

exports.handler = function(event, context, callback) {
  const AWS = require('aws-sdk');
  AWS.config.update({region: 'us-east-1'});

  if (event) {
    console.log(JSON.stringify(event));
  }

  const alexa = Alexa.handler(event, context);

  alexa.appId = APP_ID;
  alexa.dynamoDBTableName = 'PlayBlackjack';
  alexa.registerHandlers(handlers, resetHandlers, newGameHandlers,
    insuranceHandlers, inGameHandlers);
  alexa.execute();
};
