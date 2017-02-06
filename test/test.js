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

opts.name = 'Surrender';
conversation(opts)
  .userSays('BettingIntent', {Amount: 20})
    .plainResponse
      .shouldEqual('You have king and six for a total of 16. The dealer has a queen showing. Would you like to Hit, or Stand, or Surrender, or Double Down?')
  .userSays('BlackjackIntent', {Action: 'surrender'})
    .plainResponse
      .shouldEqual('You surrendered. The dealer had a queen down. The dealer had a total of 20. You have 4790 dollars. Say Deal to play again betting 20 dollars or Bet and the amount you would like to bet.')
  .end();

opts.name = 'Hit to Tie';
conversation(opts)
  .userSays('BettingIntent', {Amount: 30})
    .plainResponse
      .shouldEqual('You have two and ace for a total of soft 13. The dealer has a queen showing. Would you like to Hit, or Stand, or Surrender, or Double Down?')
  .userSays('BlackjackIntent', {Action: 'hit'})
    .plainResponse
      .shouldEqual('You got a three for a total of soft 16. The dealer is showing a queen. Would you like to Hit, or Stand?')
  .userSays('BlackjackIntent', {Action: 'hit'})
    .plainResponse
      .shouldEqual('You got a ten for a total of 16. The dealer is showing a queen. Would you like to Hit, or Stand?')
  .userSays('BlackjackIntent', {Action: 'hit'})
    .plainResponse
      .shouldEqual('You got a four for a total of 20. The dealer is showing a queen. Would you like to Hit, or Stand?')
  .userSays('BlackjackIntent', {Action: 'stand'})
    .plainResponse
      .shouldEqual('The dealer had a king down. The dealer had a total of 20. It\'s a tie.  You have 4790 dollars. Say Deal to play again betting 30 dollars or Bet and the amount you would like to bet.')
  .end();
