'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const Lambda = new AWS.Lambda();

function ssmlToText(ssml) {
  let text = ssml;

  // Replace break with ...
  text = text.replace(/<break[^>]+>/g, ' ... ');

  // Some specific Alexa text
  text = text.replace('Check the Alexa companion app for rules you can change.', '');
  text = text.replace('Check the Alexa companion app for available rules you can change.', '');
  text = text.replace('Check the Alexa companion application for the full set of rules.', '');

  // Remove all other angle brackets
  text = text.replace(/<\/?[^>]+(>|$)/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function mapDeck(deck) {
  // To keep size of attributes down, this function maps the deck to a string
  let text = '';

  deck.forEach((card) => {
    text += ('.' + card.rank + '-' + card.suit);
  });

  return text.substr(1);
}

function parseDeck(text) {
  const cards = text.split('.');
  const deck = [];

  cards.forEach((card) => {
    const thisCard = card.split('-');
    deck.push({rank: parseInt(thisCard[0], 10), suit: thisCard[1]});
  });

  return deck;
}

function passToAlexa(intentRequest, intentName, callback) {
  // Just pass this to Alexa
  const lambda = {
    'session': {
      'sessionId': 'SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7',
      'application': {
        'applicationId': 'amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce',
      },
      'attributes': {'bot': true},
      'user': {
        'userId': 'LEX-' + intentRequest.userId,
      },
    },
    'request': {
      'requestId': 'EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921',
      'timestamp': Date.now(),
    },
    'version': '1.0',
  };
  let game;

  // Is this a LaunchRequest or intent?
  if (intentName == 'LaunchRequest') {
    lambda.request.type = 'LaunchRequest';
  } else {
    lambda.request.type = 'IntentRequest';
    lambda.request.intent = {
      'name': intentName,
      'slots': {},
    };

    let slot;
    for (slot in intentRequest.currentIntent.slots) {
      if (slot) {
        lambda.request.intent.slots[slot] = {
          'name': slot,
          'value': intentRequest.currentIntent.slots[slot],
        };
      }
    }
  }

  // Do we have Alexa attributes
  if (!intentRequest.sessionAttributes || !intentRequest.sessionAttributes.alexa) {
    lambda.session.new = true;
    lambda.request.locale = 'en-US';
  } else {
    const attributes = JSON.parse(intentRequest.sessionAttributes.alexa);
    for (game in attributes) {
      if (game && attributes[game] && attributes[game].deck && attributes[game].deck.cards) {
        attributes[game].deck.cards = parseDeck(attributes[game].deck.cards);
      }
    }
    lambda.session.attributes = Object.assign(lambda.session.attributes, attributes);
    lambda.session.new = false;
    lambda.request.locale = lambda.session.attributes.playerLocale;
  }

  const start = Date.now();
  Lambda.invoke({FunctionName: 'Play_Blackjack_v10', Payload: JSON.stringify(lambda)}, (err, data) => {
    console.log('Invoking Lambda took ' + (Date.now() - start) + ' ms');
    if (err) {
      console.log(err);
      callback({
        dialogAction: {
          type: 'Close',
          fulfillmentState: 'Fulfilled',
          message: {
            contentType: 'PlainText',
            content: 'Sorry, I encountered a problem. Please try again later.',
          },
        },
      });
    } else {
      // Is the session open or closed?
      const alexaResponse = JSON.parse(data.Payload);

      if (!alexaResponse.response) {
        console.log(JSON.stringify(alexaResponse));
        callback({
          dialogAction: {
            type: 'Close',
            fulfillmentState: 'Fulfilled',
            message: {
              contentType: 'PlainText',
              content: 'Sorry, I encountered a problem. Please try again later.',
            },
          },
        });
        return;
      }

      for (game in alexaResponse.sessionAttributes) {
        if (game && alexaResponse.sessionAttributes[game] && alexaResponse.sessionAttributes[game].deck
            && alexaResponse.sessionAttributes[game].deck.cards) {
          alexaResponse.sessionAttributes[game].deck.cards =
            mapDeck(alexaResponse.sessionAttributes[game].deck.cards);
        }
      }

      const response = {
        sessionAttributes: {'alexa': JSON.stringify(alexaResponse.sessionAttributes)},
        dialogAction: {
          message: {
            contentType: 'PlainText',
            content: ssmlToText(alexaResponse.response.outputSpeech.ssml),
          },
        },
      };

      if (alexaResponse.response.shouldEndSession) {
        response.dialogAction.type = 'Close';
        response.dialogAction.fulfillmentState = 'Fulfilled';
      } else {
        response.dialogAction.type = 'ElicitIntent';
      }

      callback(response);
    }
  });
}

function dispatch(intentRequest, callback) {
  const intentName = intentRequest.currentIntent.name;
  const mapping = {'Betting': 'BettingIntent', 'Blackjack_Stop': 'AMAZON.StopIntent', 'Blackjack_Help': 'AMAZON.HelpIntent',
    'Blackjack_HighScore': 'HighScoreIntent', 'Blackjack_No': 'AMAZON.NoIntent', 'Blackjack_Launch': 'LaunchRequest',
    'Blackjack': 'BlackjackIntent', 'Blackjack_Yes': 'AMAZON.YesIntent', 'Blackjack_PlaceSideBet': 'PlaceSideBetIntent',
    'Blackjack_RemoveSideBet': 'RemoveSideBetIntent', 'ChangeRules': 'ChangeRulesIntent', 'DisableTraining': 'DisableTrainingIntent',
    'EnableTraining': 'EnableTrainingIntent', 'Reset': 'ResetIntent', 'Rules': 'RulesIntent', 'Suggest': 'SuggestIntent',
    'Blackjack_Repeat': 'AMAZON.RepeatIntent',
  };
  const alexaIntent = mapping[intentName];

  if (!process.env.NOLOG) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
  }

  if (alexaIntent) {
    passToAlexa(intentRequest, alexaIntent, callback);
  } else {
    throw new Error(`Intent ${intentName} not supported`);
  }
}

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
  try {
    if (!process.env.NOLOG) {
      console.log(JSON.stringify(event));
      console.log(`event.bot.name=${event.bot.name}`);
    }

    if (event.bot.name !== 'Blackjack') {
      callback('Invalid Bot Name');
    }

    dispatch(event, (response) => callback(null, response));
  } catch (err) {
    callback(err);
  }
};
