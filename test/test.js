const conversation = require('alexa-conversation');
const app = require('../src/index.js'); // your Alexa skill main file. `app.handle` needs to exist
 
const opts = { // those will be used to generate the requests to your skill 
  name: 'Conversation Name',
  app: app,
  appId: "amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce",
  userId: "stubbed"
  // Other optional parameters (see below) 
};
 
opts.name = 'Ask for help';
conversation(opts)
  .userSays('AMAZON.HelpIntent')
    .plainResponse
      .shouldEqual("You can play a game by saying Deal, or you can hear the table rules by saying Read Rules, or you can change the rules by saying Change or, you can say exit... Now, what can I help you with?", "You can play a game by saying Deal, or you can say exit... Now, what can I help you with?")
  .end();

opts.name = 'Take insurance';
conversation(opts)
  .userSays('BettingIntent', {Amount: 10})
    .plainResponse
      .shouldEqual("Do you want to take insurance?  Say yes or no.")
  .userSays('AMAZON.YesIntent')
    .plainResponse
      .shouldEqual("The dealer had a blackjack. ")
  .end();