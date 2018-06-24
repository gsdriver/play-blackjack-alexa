var mainApp = require('../lambda/custom/index');

const attributeFile = 'attributes.txt';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const USERID = 'not-amazon';
const DEVICEID = 'not-amazon';
const LOCALE = 'en-US';

function BuildEvent(argv)
{
    // Templates that can fill in the intent
    var blackjackIntent = {"name": "BlackjackIntent", "slots": {"Action": {"name": "Action", "value": ""}}};
    var suggestIntent = {"name": "SuggestIntent", "slots": {}};
    var changeRulesIntent = {"name": "ChangeRulesIntent", "slots": {"ChangeOption": {"name": "ChangeOption", "value": ""}, "Change": {"name": "Change", "value": ""}}};
    var readRulesIntent = {"name": "RulesIntent", "slots": {}};
    var betIntent = {"name": "BettingIntent", "slots": {"Amount": {"name": "Amount", "value": ""}}};
    var placeSideBetIntent = {"name": "PlaceSideBetIntent", "slots": {}};
    var removeSideBetIntent = {"name": "RemoveSideBetIntent", "slots": {}};
    var yesIntent = {"name": "AMAZON.YesIntent", "slots": {}};
    var noIntent = {"name": "AMAZON.NoIntent", "slots": {}};
    var resetIntent = {"name": "ResetIntent", "slots": {}};
    var repeatIntent = {"name": "AMAZON.RepeatIntent", "slots": {}};
    var helpIntent = {"name": "AMAZON.HelpIntent", "slots": {}};
    var exitIntent = {"name": "SessionEndedRequest", "slots": {}};
    var highScore = {'name': 'HighScoreIntent', 'slots': {}};
    var enableTraining = {'name': 'EnableTrainingIntent', 'slots': {}};
    var disableTraining = {'name': 'DisableTrainingIntent', 'slots': {}};
    var selectIntent = {'name': 'SelectIntent', 'slots': {}};

    var lambda = {
       "session": {
         "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
         "application": {
           "applicationId": "amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce"
         },
         "attributes": {},
        "user": {
          "userId": USERID,
         },
         "new": false
       },
       "request": {
         "type": "IntentRequest",
         "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
         "locale": LOCALE,
         "timestamp": "2016-11-03T21:31:08Z",
         "intent": {}
       },
       "version": "1.0",
       "context": {
         "AudioPlayer": {
           "playerActivity": "IDLE"
         },
         "Display": {},
         "System": {
           "application": {
             "applicationId": "amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce"
           },
           "user": {
             "userId": USERID,
           },
           "device": {
             "deviceId": DEVICEID,
             "supportedInterfaces": {
               "AudioPlayer": {},
               "Display": {
                 "templateVersion": "1.0",
                 "markupVersion": "1.0"
               }
             }
           },
           "apiEndpoint": "https://api.amazonalexa.com",
           "apiAccessToken": "",
         }
       },
   };

    var openEvent = {
       "session": {
         "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
         "application": {
           "applicationId": "amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce"
         },
         "attributes": {},
         "user": {
            "userId": USERID,
         },
         "new": true
       },
       "request": {
         "type": "LaunchRequest",
         "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
         "locale": LOCALE,
         "timestamp": "2016-11-03T21:31:08Z",
         "intent": {}
       },
       "version": "1.0",
       "context": {
         "AudioPlayer": {
           "playerActivity": "IDLE"
         },
         "Display": {},
         "System": {
           "application": {
             "applicationId": "amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce"
           },
           "user": {
             "userId": USERID,
           },
           "device": {
             "deviceId": DEVICEID,
             "supportedInterfaces": {
               "AudioPlayer": {},
               "Display": {
                 "templateVersion": "1.0",
                 "markupVersion": "1.0"
               }
             }
           },
           "apiEndpoint": "https://api.amazonalexa.com",
           "apiAccessToken": "",
         }
       },
    };

    const canFulfill = {
     "session":{
       "new": true,
       "sessionId":"SessionId.12",
       "application":{
         "applicationId":"amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce"
       },
       "attributes":{
         "key": "string value"
       },
       "user":{
         "userId": USERID,
       }
     },
     "request":{
       "type":"CanFulfillIntentRequest",
       "requestId":"EdwRequestId.12",
       "intent":{
         "name":"ChangeRulesIntent",
         "slots":{
           "Change":{
             "name":"Change",
             "value":"decks"
           },
           "ChangeOption":{
             "name":"ChangeOption",
             "value":"4"
           },
         }
       },
       "locale":"en-US",
       "timestamp":"2017-10-03T22:02:29Z"
     },
     "context":{
       "AudioPlayer":{
         "playerActivity":"IDLE"
       },
       "System":{
         "application":{
           "applicationId":"amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce"
         },
         "user":{
           "userId":USERID,
         },
         "device":{
           "supportedInterfaces":{

           }
         }
       }
     },
     "version":"1.0"
    };

    // If there is an attributes.txt file, read the attributes from there
    const fs = require('fs');
    if (fs.existsSync(attributeFile)) {
      data = fs.readFileSync(attributeFile, 'utf8');
      if (data) {
        lambda.session.attributes = JSON.parse(data);
      }
    }

    // If there is no argument, then we'll just ask for the rules
    if ((argv.length <= 2) || (argv[2] == "rules"))
    {
        lambda.request.intent = readRulesIntent;
    }
    else if (argv[2] == "seed") {
      if (fs.existsSync("seed.txt")) {
        data = fs.readFileSync("seed.txt", 'utf8');
        if (data) {
          return JSON.parse(data);
        }
      }
    }
    else if (argv[2] == "canfulfill")
    {
        return canFulfill;
    }
    else if (argv[2] == "suggest")
    {
        lambda.request.intent = suggestIntent;
    }
    else if (argv[2] == "help")
    {
        lambda.request.intent = helpIntent;;
    }
    else if (argv[2] == "select")
    {
        lambda.request.intent = selectIntent;;
    }
    else if (argv[2] == "bet")
    {
        if (argv.length > 3)
        {
            betIntent.slots.Amount.value = argv[3];
        }
        lambda.request.intent = betIntent;
    }
    else if (argv[2] == "change")
    {
        changeRulesIntent.slots.Change.value = (argv.length > 3) ? argv[3] : "hit soft 17";
        changeRulesIntent.slots.ChangeOption.value = (argv.length > 4) ? argv[4] : "on";
        lambda.request.intent = changeRulesIntent;
    }
    else if (argv[2] == "open")
    {
        // Return the launch request
        return openEvent;
    }
    else if (argv[2] == "reset")
    {
        lambda.request.intent = resetIntent;
    }
    else if (argv[2] == "placesidebet")
    {
        lambda.request.intent = placeSideBetIntent;
    }
    else if (argv[2] == "removesidebet")
    {
        lambda.request.intent = removeSideBetIntent;
    }
    else if (argv[2] == "yes")
    {
        lambda.request.intent = yesIntent;
    }
    else if (argv[2] == "no")
    {
        lambda.request.intent = noIntent;
    }
    else if (argv[2] == "repeat")
    {
        lambda.request.intent = repeatIntent;
    }
    else if (argv[2] == "highscore")
    {
        lambda.request.intent = highScore;
    }
    else if (argv[2] == "enabletraining")
    {
        lambda.request.intent = enableTraining;
    }
    else if (argv[2] == "disabletraining")
    {
        lambda.request.intent = disableTraining;
    }
    else if (argv[2] == "exit")
    {
        lambda.request.intent = exitIntent;
    }
    else
    {
        blackjackIntent.slots.Action.value = argv[2];
        lambda.request.intent = blackjackIntent;
    }

    return lambda;
}


// Simple response - just print out what I'm given
function myResponse(appId) {
  this._appId = appId;
}

myResponse.succeed = function(result) {
  if (!result.response || !result.response.outputSpeech) {
    console.log(JSON.stringify(result));
  } else {
    if (result.response.outputSpeech.ssml) {
      console.log('AS SSML: ' + result.response.outputSpeech.ssml);
    } else {
      console.log(result.response.outputSpeech.text);
    }
    if (result.response.card && result.response.card.content) {
      console.log('Card Content: ' + result.response.card.content);
    }
    console.log('The session ' + ((!result.response.shouldEndSession) ? 'stays open.' : 'closes.'));
    if (result.sessionAttributes && !process.env.NOLOG) {
      console.log('"attributes": ' + JSON.stringify(result.sessionAttributes));
    }
    if (result.sessionAttributes) {
      // Output the attributes too
      const fs = require('fs');
      fs.writeFile(attributeFile, JSON.stringify(result.sessionAttributes), (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
  }
}

myResponse.fail = function(e) {
  console.log(e);
}

// Build the event object and call the app
if ((process.argv.length == 3) && (process.argv[2] == 'clear')) {
  const fs = require('fs');

  // Clear is a special case - delete this entry from the DB and delete the attributes.txt file
  dynamodb.deleteItem({TableName: 'PlayBlackjack', Key: { userId: {S: USERID}}}, function (error, data) {
    console.log("Deleted " + error);
    if (fs.existsSync(attributeFile)) {
      fs.unlinkSync(attributeFile);
    }
  });
} else {
  var event = BuildEvent(process.argv);
  if (event) {
      mainApp.handler(event, myResponse);
  }
}
