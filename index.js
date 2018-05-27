'use strict';

const Alexa = require('alexa-sdk');
const Launch = require('./intents/Launch');
const Blackjack = require('./intents/Blackjack');
const Betting = require('./intents/Betting');
const SideBet = require('./intents/SideBet');
const Suggest = require('./intents/Suggest');
const TakeSuggestion = require('./intents/TakeSuggestion');
const Rules = require('./intents/Rules');
const ChangeRules = require('./intents/ChangeRules');
const TakeInsurance = require('./intents/TakeInsurance');
const DeclineInsurance = require('./intents/DeclineInsurance');
const Repeat = require('./intents/Repeat');
const HighScore = require('./intents/HighScore');
const Help = require('./intents/Help');
const Exit = require('./intents/Exit');
const Reset = require('./intents/Reset');
const Select = require('./intents/Select');
const Training = require('./intents/Training');
const Unhandled = require('./intents/Unhandled');
const gameService = require('./GameService');
const bjUtils = require('./BlackjackUtils');
const tournament = require('./tournament');
const playgame = require('./PlayGame');
const request = require('request');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const APP_ID = 'amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce';
let newUser;

const selectGameHandlers = Alexa.CreateStateHandler('SELECTGAME', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'ElementSelected': Select.handleYesIntent,
  'GameIntent': Select.handleYesIntent,
  'SelectIntent': Select.handleNoIntent,
  'AMAZON.YesIntent': Select.handleYesIntent,
  'AMAZON.NextIntent': Select.handleNoIntent,
  'AMAZON.NoIntent': Select.handleNoIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': Unhandled.handleIntent,
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
  },
});

const suggestHandlers = Alexa.CreateStateHandler('SUGGESTION', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'LaunchRequest': TakeSuggestion.handleNoIntent,
  'BlackjackIntent': Blackjack.handleIntent,
  'SuggestIntent': Suggest.handleIntent,
  'HighScoreIntent': HighScore.handleIntent,
  'EnableTrainingIntent': Training.handleEnableIntent,
  'DisableTrainingIntent': Training.handleDisableIntent,
  'RulesIntent': Rules.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.FallbackIntent': Repeat.handleIntent,
  'AMAZON.YesIntent': TakeSuggestion.handleYesIntent,
  'AMAZON.NoIntent': TakeSuggestion.handleNoIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': Unhandled.handleIntent,
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
  },
});

const resetHandlers = Alexa.CreateStateHandler('CONFIRMRESET', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'LaunchRequest': Reset.handleNoReset,
  'HighScoreIntent': HighScore.handleIntent,
  'EnableTrainingIntent': Training.handleEnableIntent,
  'DisableTrainingIntent': Training.handleDisableIntent,
  'AMAZON.FallbackIntent': Reset.handleRepeat,
  'AMAZON.RepeatIntent': Reset.handleRepeat,
  'AMAZON.HelpIntent': Reset.handleRepeat,
  'AMAZON.YesIntent': Reset.handleYesReset,
  'AMAZON.NoIntent': Reset.handleNoReset,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': Unhandled.handleIntent,
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
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
  'EnableTrainingIntent': Training.handleEnableIntent,
  'DisableTrainingIntent': Training.handleDisableIntent,
  'SelectIntent': Select.handleIntent,
  'AMAZON.YesIntent': Betting.handleIntent,
  'AMAZON.NoIntent': Exit.handleIntent,
  'AMAZON.FallbackIntent': Repeat.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': Unhandled.handleIntent,
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
  },
});

const firstTimeHandlers = Alexa.CreateStateHandler('FIRSTTIMEPLAYER', {
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
  'EnableTrainingIntent': Training.handleEnableIntent,
  'DisableTrainingIntent': Training.handleDisableIntent,
  'SelectIntent': Select.handleIntent,
  'AMAZON.YesIntent': Betting.handleIntent,
  'AMAZON.NoIntent': Exit.handleIntent,
  'AMAZON.FallbackIntent': Repeat.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': Unhandled.handleIntent,
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
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
  'EnableTrainingIntent': Training.handleEnableIntent,
  'DisableTrainingIntent': Training.handleDisableIntent,
  'AMAZON.YesIntent': TakeInsurance.handleIntent,
  'AMAZON.NoIntent': DeclineInsurance.handleIntent,
  'AMAZON.FallbackIntent': Repeat.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': Unhandled.handleIntent,
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
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
  'EnableTrainingIntent': Training.handleEnableIntent,
  'DisableTrainingIntent': Training.handleDisableIntent,
  'AMAZON.FallbackIntent': Repeat.handleIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'AMAZON.YesIntent': Blackjack.handleYesIntent,
  'Unhandled': Unhandled.handleIntent,
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
  },
});

// These states are only accessible during tournament play
const joinHandlers = Alexa.CreateStateHandler('JOINTOURNAMENT', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'LaunchRequest': tournament.handlePass,
  'EnableTrainingIntent': Training.handleEnableIntent,
  'DisableTrainingIntent': Training.handleDisableIntent,
  'AMAZON.YesIntent': tournament.handleJoin,
  'AMAZON.NoIntent': tournament.handlePass,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': Unhandled.handleIntent,
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
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
            bjUtils.emitResponse(this, null, null, result + speech, reprompt);
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
  'EnableTrainingIntent': Training.handleEnableIntent,
  'DisableTrainingIntent': Training.handleDisableIntent,
  'AMAZON.RepeatIntent': Repeat.handleIntent,
  'AMAZON.HelpIntent': Help.handleIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': Unhandled.handleIntent,
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
  },
};

if (process.env.DASHBOTKEY) {
  const dashbot = require('dashbot')(process.env.DASHBOTKEY).alexa;
  exports.handler = dashbot.handler(runGame);
} else {
  exports.handler = runGame;
}

function runGame(event, context, callback) {
  const alexa = Alexa.handler(event, context);

  alexa.appId = APP_ID;
  if (!event.session.sessionId || event.session['new']) {
    const doc = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
    doc.get({TableName: 'PlayBlackjack',
            ConsistentRead: true,
            Key: {userId: event.session.user.userId}},
            (err, data) => {
      if (err || (data.Item === undefined)) {
        if (err) {
          console.log('Error reading attributes ' + err);
        } else {
          newUser = true;
          request.post({url: process.env.SERVICEURL + 'blackjack/newUser'}, (err, res, body) => {
          });
        }
      } else {
        Object.assign(event.session.attributes, data.Item.mapAttr);
      }

      execute();
    });
  } else {
    execute();
  }

  function execute() {
    event.session.attributes.userId = event.session.user.userId;
    bjUtils.setEvent(event);
    bjUtils.readSuggestions(event.session.attributes, () => {
      alexa.registerHandlers(handlers, resetHandlers, newGameHandlers, firstTimeHandlers,
        insuranceHandlers, joinHandlers, inGameHandlers, suggestHandlers, selectGameHandlers);
      alexa.execute();
    });
  }
}

function initialize(attributes, locale, userId, callback) {
  // Some initiatlization
  attributes.playerLocale = locale;
  attributes.numRounds = (attributes.numRounds + 1) || 1;
  attributes.newUser = newUser;
  attributes.temp = {firsthand: true};

  // If they don't have a game, create one
  if (!attributes.currentGame) {
    gameService.initializeGame('standard', attributes, userId);

    // Now read the progressive jackpot amount
    bjUtils.getProgressivePayout(attributes, (jackpot) => {
      attributes[attributes.currentGame].progressiveJackpot = jackpot;
      callback();
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

      // You should also be able to reset the standard game
      game.canReset = true;
      game.canChangeRules = true;
    }
    game.bankroll = Math.floor(game.bankroll);

    // It's possible you are stuck in shuffle state if you ran out of cards
    // and money at the same time - if so, let's fix that here
    if (attributes && attributes.standard && attributes.standard.possibleActions
      && (attributes.standard.possibleActions.indexOf('shuffle') > -1)) {
      console.log('Player stuck in shuffle state!');
      playgame.playBlackjackAction(attributes, locale, userId, {action: 'shuffle'}, () => {
        getProgressive();
      });
    } else {
      getProgressive();
    }

    function getProgressive() {
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
}

function saveState(userId, attributes) {
  const formData = {};

  formData.savedb = JSON.stringify({
    userId: userId,
    attributes: attributes,
  });

  const params = {
    url: process.env.SERVICEURL + 'blackjack/saveState',
    formData: formData,
  };

  request.post(params, (err, res, body) => {
    if (err) {
      console.log(err);
    }
  });
}
