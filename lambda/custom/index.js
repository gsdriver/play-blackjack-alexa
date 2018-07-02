'use strict';

const Alexa = require('alexa-sdk');
const CanFulfill = require('./intents/CanFulfill');
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
const Purchase = require('./intents/Purchase');
const Refund = require('./intents/Refund');
const ProductResponse = require('./intents/ProductResponse');
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
  'LaunchRequest': Select.handleIntent,
  'ElementSelected': Select.handleYesIntent,
  'GameIntent': Select.handleYesIntent,
  'SelectIntent': Select.handleNoIntent,
  'PurchaseIntent': Purchase.handleIntent,
  'RefundIntent': Refund.handleIntent,
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
  'PurchaseIntent': Purchase.handleIntent,
  'RefundIntent': Refund.handleIntent,
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
  'PurchaseIntent': Purchase.handleIntent,
  'RefundIntent': Refund.handleIntent,
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

const purchaseHandlers = Alexa.CreateStateHandler('CONFIRMPURCHASE', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'LaunchRequest': Purchase.handleNoIntent,
  'HighScoreIntent': HighScore.handleIntent,
  'EnableTrainingIntent': Training.handleEnableIntent,
  'DisableTrainingIntent': Training.handleDisableIntent,
  'PurchaseIntent': Purchase.handleYesIntent,
  'RefundIntent': Refund.handleIntent,
  'AMAZON.FallbackIntent': Purchase.handleRepeatIntent,
  'AMAZON.RepeatIntent': Purchase.handleRepeatIntent,
  'AMAZON.HelpIntent': Purchase.handleRepeatIntent,
  'AMAZON.YesIntent': Purchase.handleYesIntent,
  'AMAZON.NoIntent': Purchase.handleNoIntent,
  'AMAZON.StopIntent': Exit.handleIntent,
  'AMAZON.CancelIntent': Exit.handleIntent,
  'Unhandled': Unhandled.handleIntent,
  'SessionEndedRequest': function() {
    saveState(this.event.session.user.userId, this.attributes);
  },
});

const refundHandlers = Alexa.CreateStateHandler('CONFIRMREFUND', {
  'NewSession': function() {
    this.handler.state = '';
    this.emitWithState('NewSession');
  },
  'LaunchRequest': Refund.handleNoIntent,
  'HighScoreIntent': HighScore.handleIntent,
  'EnableTrainingIntent': Training.handleEnableIntent,
  'DisableTrainingIntent': Training.handleDisableIntent,
  'PurchaseIntent': Purchase.handleIntent,
  'RefundIntent': Refund.handleIntent,
  'AMAZON.FallbackIntent': Refund.handleRepeatIntent,
  'AMAZON.RepeatIntent': Refund.handleRepeatIntent,
  'AMAZON.HelpIntent': Refund.handleRepeatIntent,
  'AMAZON.YesIntent': Refund.handleYesIntent,
  'AMAZON.NoIntent': Refund.handleNoIntent,
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
  'PurchaseIntent': Purchase.handleIntent,
  'RefundIntent': Refund.handleIntent,
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
  'PurchaseIntent': Purchase.handleIntent,
  'RefundIntent': Refund.handleIntent,
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
  'PurchaseIntent': Purchase.handleIntent,
  'RefundIntent': Refund.handleIntent,
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
  'PurchaseIntent': Purchase.handleIntent,
  'RefundIntent': Refund.handleIntent,
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
  'PurchaseIntent': Purchase.handleIntent,
  'RefundIntent': Refund.handleIntent,
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
    initialize(this, () => {
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
            this.attributes.prependLaunch = result;
          }
          if (this.event.request.type === 'IntentRequest') {
            this.emit(this.event.request.intent.name);
          } else if (this.event.request.type === 'Connections.Response') {
            this.emit('ProductResponse');
          } else {
            this.emit('LaunchRequest');
          }
        }
      });
    });
  },
  // Some intents don't make sense for a new session - so just launch instead
  'LaunchRequest': Launch.handleIntent,
  'ProductResponse': ProductResponse.handleIntent,
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
  'PurchaseIntent': Purchase.handleIntent,
  'RefundIntent': Refund.handleIntent,
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
  if (!process.env.NOLOG) {
    console.log(JSON.stringify(event));
  }

  // If this is a CanFulfill, handle this separately
  if (event.request && (event.request.type == 'CanFulfillIntentRequest')) {
    context.succeed(CanFulfill.check(event));
    return;
  }

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
    bjUtils.readSuggestions(event.session.attributes, () => {
      alexa.registerHandlers(handlers, resetHandlers, newGameHandlers, firstTimeHandlers,
        insuranceHandlers, joinHandlers, inGameHandlers, refundHandlers,
        purchaseHandlers, suggestHandlers, selectGameHandlers);
      alexa.execute();
    });
  }
}

function initialize(context, callback) {
  const attributes = context.attributes;
  const locale = context.event.request.locale;
  const userId = context.event.session.user.userId;

  // Some initialization
  attributes.playerLocale = locale;
  attributes.numRounds = (attributes.numRounds + 1) || 1;
  attributes.newUser = newUser;
  if (!attributes.temp) {
    attributes.temp = {};
  }
  attributes.temp.firsthand = true;
  if (!attributes.prompts) {
    attributes.prompts = {};
  }

  // Load purchased products
  bjUtils.getPurchasedProducts(context, () => {
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
  });
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
