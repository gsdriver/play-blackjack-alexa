//
// Set of utility functions
//

'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

module.exports = {
  emitResponse: function(emit, locale, error, response, speech, reprompt) {
    if (error) {
      const res = require('./' + locale + '/resources');
      console.log('Speech error: ' + error);
      emit(':ask', error, res.ERROR_REPROMPT);
    } else if (response) {
      emit(':tell', response);
    } else {
      emit(':ask', speech, reprompt);
    }
  },
  // Figures out what state of the game we're in
  getState: function(attributes) {
    const game = attributes[attributes.currentGame];

    // New game - ready to start a new game
    if (game.possibleActions.indexOf('bet') >= 0) {
      return 'NEWGAME';
    } else if (game.possibleActions.indexOf('noinsurance') >= 0) {
      return 'INSURANCEOFFERED';
    } else {
      return 'INGAME';
    }
  },
  getProgressivePayout: function(attributes, callback) {
    // Read from Dynamodb
    const STARTING_JACKPOT = 500;
    const JACKPOT_RATE = 0.25;

    dynamodb.getItem({TableName: 'PlayBlackjack', Key: {userId: {S: 'game-' + attributes.currentGame}}},
            (err, data) => {
      if (err || (data.Item === undefined)) {
        console.log(err);
        callback((attributes[attributes.currentGame].progressiveJackpot)
              ? attributes[attributes.currentGame].progressiveJackpot
              : STARTING_JACKPOT);
      } else {
        let hands;

        if (data.Item.hands && data.Item.hands.N) {
          hands = parseInt(data.Item.hands.N);
        } else {
          hands = 0;
        }

        callback(Math.floor(STARTING_JACKPOT + (hands * JACKPOT_RATE)));
      }
    });
  },
  incrementProgressive: function(attributes) {
    const game = attributes[attributes.currentGame];

    if (game.sideBet) {
      const params = {
          TableName: 'PlayBlackjack',
          Key: {userId: {S: 'game-' + attributes.currentGame}},
          AttributeUpdates: {hands: {
              Action: 'ADD',
              Value: {N: game.sideBet.toString()}},
          }};

      dynamodb.updateItem(params, (err, data) => {
        if (err) {
          console.log(err);
        }
      });
    }
  },

};
