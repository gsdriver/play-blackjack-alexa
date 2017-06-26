//
// Set of utility functions
//

'use strict';

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
  prepareToSave: function(attributes, locale) {
    if (attributes) {
      attributes['playerLocale'] = locale;
      if (attributes['numRounds']) {
        attributes['numRounds']++;
      } else {
        attributes['numRounds'] = 1;
      }
      attributes['firsthand'] = undefined;
    }
  },
};
