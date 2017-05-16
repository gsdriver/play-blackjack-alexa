//
// Handles the intent to process help
//

'use strict';

module.exports = {
  handleIntent: function() {
    const speech = 'You can play a game by saying Deal, or you can hear the table rules by saying Read Rules, or you can change the rules by saying Change or, you can say exit... Now, what can I help you with?';
    const reprompt = 'You can play a game by saying Deal, or you can say exit... Now, what can I help you with?';

    this.emit(':ask', speech, reprompt);
  },
};
