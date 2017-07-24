'use strict';

const Alexa = require('alexa-sdk');
const Launch = require('./intents/Launch');
const Blackjack = require('./intents/Blackjack');
const Betting = require('./intents/Betting');
const SideBet = require('./intents/SideBet');
const Suggest = require('./intents/Suggest');
const Rules = require('./intents/Rules');
const ChangeRules = require('./intents/ChangeRules');
const TakeInsurance = require('./intents/TakeInsurance');
const DeclineInsurance = require('./intents/DeclineInsurance');
const Repeat = require('./intents/Repeat');
const HighScore = require('./intents/HighScore');
const Help = require('./intents/Help');
const Exit = require('./intents/Exit');
const Reset = require('./intents/Reset');
const gameService = require('./GameService');
const bjUtils = require('./BlackjackUtils');
const tournament = require('./tournament');

const APP_ID = 'amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce';

const resetHandlers = Alexa.CreateStateHandler('CONFIRMRESET', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'LaunchRequest': Reset.handleNoReset,
  'HighScoreIntent': HighScore.handleIntent,
  'AMAZON.YesIntent': Reset.handleYesReset,
  'AMAZON.NoIntent': Reset.handleNoReset,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    this.emit(':ask', res.strings.UNKNOWNINTENT_RESET, res.strings.UNKNOWNINTENT_RESET_REPROMPT);
  },
});

const newGameHandlers = Alexa.CreateStateHandler('NEWGAME', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'LaunchRequest': Launch.handleIntent,
  'BettingIntent': Betting.handleIntent,
  'PlaceSideBetIntent': SideBet.handlePlaceIntent,
  'RemoveSideBetIntent': SideBet.handleRemoveIntent,
  'ResetIntent': Reset.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'ChangeRulesIntent': ChangeRules.handleIntent,
  'HighScoreIntent': HighScore.handleIntent,
  'AMAZON.YesIntent': Betting.handleIntent,
  'AMAZON.NoIntent': Exit.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    this.emit(':ask', res.strings.UNKNOWNINTENT_NEWGAME, res.strings.UNKNOWNINTENT_NEWGAME_REPROMPT);
  },
});

const insuranceHandlers = Alexa.CreateStateHandler('INSURANCEOFFERED', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'LaunchRequest': Launch.handleIntent,
  'SuggestIntent': Suggest.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'HighScoreIntent': HighScore.handleIntent,
  'AMAZON.YesIntent': TakeInsurance.handleIntent,
  'AMAZON.NoIntent': DeclineInsurance.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    this.emit(':ask', res.strings.UNKNOWNINTENT_INSURANCE, res.strings.UNKNOWNINTENT_INSURANCE_REPROMPT);
  },
});

const inGameHandlers = Alexa.CreateStateHandler('INGAME', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'LaunchRequest': Launch.handleIntent,
  'BlackjackIntent': Blackjack.handleIntent,
  'SuggestIntent': Suggest.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'HighScoreIntent': HighScore.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    this.emit(':ask', res.strings.UNKNOWNINTENT_INGAME, res.strings.UNKNOWNINTENT_INGAME_REPROMPT);
  },
});

// These states are only accessible during tournament play
const joinHandlers = Alexa.CreateStateHandler('JOINTOURNAMENT', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'LaunchRequest': tournament.handlePass,
  'AMAZON.YesIntent': tournament.handleJoin,
  'AMAZON.NoIntent': tournament.handlePass,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': tournament.handlePass,
  'SessionEndedRequest': function() {
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    const res = require('./' + this.event.request.locale + '/resources');
    this.emit(':ask', res.strings.UNKNOWNINTENT_RESET, res.strings.UNKNOWNINTENT_RESET_REPROMPT);
  },
});

// Handlers for our skill
const handlers = {
  'NewSession': function() {
    initialize(this.attributes, this.event.request.locale, this.event.session.user.userId, () => {
      tournament.getTournamentComplete(this.event.request.locale, this.attributes, (result) => {
        // If there is an active tournament, go to the start tournament state
        if (tournament.canEnterTournament(this.attributes)) {
          // Great, enter the tournament!
          this.handler.state = 'JOINTOURNAMENT';
          tournament.promptToEnter(this.event.request.locale,
              this.attributes, (speech, reprompt) => {
            this.emit(':ask', result + speech, reprompt);
          });
        } else {
          if (result && (result.length > 0)) {
            this.attributes.tournamentResult = result;
          }
          if (this.event.request.type === 'IntentRequest') {
            this.emit(this.event.request.intent.name);
          } else {
            this.emit('LaunchRequest');
          }
        }
      });
    });
  },
  // Some intents don't make sense for a new session - so just launch instead
  'LaunchRequest': Launch.handleIntent,
  'SuggestIntent': Launch.handleIntent,
  'ResetIntent': Launch.handleIntent,
  'ChangeRulesIntent': Launch.handleIntent,
  'AMAZON.YesIntent': Launch.handleIntent,
  'AMAZON.NoIntent': Launch.handleIntent,
  'BettingIntent': Betting.handleIntent,
  'PlaceSideBetIntent': SideBet.handlePlaceIntent,
  'RemoveSideBetIntent': SideBet.handleRemoveIntent,
  'BlackjackIntent': Blackjack.handleIntent,
  'RulesIntent': Rules.handleIntent,
  'HighScoreIntent': HighScore.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'SessionEndedRequest': function() {
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

  if (event && !process.env.NOLOG) {
    console.log(JSON.stringify(event));
  }

  const alexa = Alexa.handler(event, context);

  alexa.APP_ID = APP_ID;
  alexa.dynamoDBTableName = 'PlayBlackjack';
  alexa.registerHandlers(handlers, resetHandlers, newGameHandlers,
    insuranceHandlers, joinHandlers, inGameHandlers);
  alexa.execute();
};

function initialize(attributes, locale, userId, callback) {
  // Some initiatlization
  attributes.playerLocale = locale;
  attributes.numRounds = (attributes.numRounds)
            ? (attributes.numRounds + 1) : 1;
  attributes.firsthand = true;
  attributes.readProgressive = undefined;

  // If they don't have a game, create one
  if (!attributes.currentGame) {
    gameService.initializeGame(attributes, userId, () => {
      // Now read the progressive jackpot amount
      bjUtils.getProgressivePayout(attributes, (jackpot) => {
        attributes[attributes.currentGame].progressiveJackpot = jackpot;
        callback();
      });
    });
  } else {
    // Standard should have progressive; some customers will have this game
    // without progressive, so set it for them
    const game = attributes[attributes.currentGame];
    if (attributes.currentGame === 'standard') {
      if (!game.progressive) {
        game.progressive = {bet: 5, starting: 2500, jackpotRate: 1.25};

        // Also stuff sidebet in as a possible action if bet is there
        if (game.possibleActions &&
          (game.possibleActions.indexOf('bet') >= 0) &&
          (game.possibleActions.indexOf('sidebet') < 0)) {
          game.possibleActions.push('sidebet');
        }
      }
    }

    // Now read the progressive jackpot amount
    if (game.progressive) {
      bjUtils.getProgressivePayout(attributes, (jackpot) => {
        game.progressiveJackpot = jackpot;
        callback();
      });
    } else {
      callback();
    }
  }
}
