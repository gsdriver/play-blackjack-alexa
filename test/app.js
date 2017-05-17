var mainApp = require('../index');

function BuildEvent(argv)
{
    // Templates that can fill in the intent
    var blackjackIntent = {"name": "BlackjackIntent", "slots": {"Action": {"name": "Action", "value": ""}}};
    var suggestIntent = {"name": "SuggestIntent", "slots": {}};
    var changeRulesIntent = {"name": "ChangeRulesIntent", "slots": {"ChangeOption": {"name": "ChangeOption", "value": ""}, "Change": {"name": "Change", "value": ""}}};
    var readRulesIntent = {"name": "RulesIntent", "slots": {}};
    var betIntent = {"name": "BettingIntent", "slots": {"Amount": {"name": "Amount", "value": ""}}};
    var yesIntent = {"name": "AMAZON.YesIntent", "slots": {}};
    var noIntent = {"name": "AMAZON.NoIntent", "slots": {}};
    var repeatIntent = {"name": "AMAZON.RepeatIntent", "slots": {}};
    var helpIntent = {"name": "AMAZON.HelpIntent", "slots": {}};
    var exitIntent = {"name": "AMAZON.CancelIntent", "slots": {}};

    var lambda = {
       "session": {
         "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
         "application": {
           "applicationId": "amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce"
         },
         "attributes": {'STATE':'NEWGAME'},
         "user": {
           "userId": "amzn1.ask.account.AFLJ3RYNI3X6MQMX4KVH52CZKDSI6PMWCQWRBHSPJJPR2MKGDNJHW36XF2ET6I2BFUDRKH3SR2ACZ5VCRLXLGJFBTQGY4RNYZA763JED57USTK6F7IRYT6KR3XYO2ZTKK55OM6ID2WQXQKKXJCYMWXQ74YXREHVTQ3VUD5QHYBJTKHDDH5R4ALQAGIQKPFL52A3HQ377WNCCHYI"
         },
         "new": true
       },
       "request": {
         "type": "IntentRequest",
         "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
         "locale": "en-US",
         "timestamp": "2016-11-03T21:31:08Z",
         "intent": {}
       },
       "version": "1.0"
     };

    var openEvent = {
       "session": {
         "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
         "application": {
           "applicationId": "amzn1.ask.skill.8fb6e399-d431-4943-a797-7a6888e7c6ce"
         },
         "attributes": {},
         "user": {
           "userId": "amzn1.ask.account.AFLJ3RYNI3X6MQMX4KVH52CZKDSI6PMWCQWRBHSPJJPR2MKGDNJHW36XF2ET6I2BFUDRKH3SR2ACZ5VCRLXLGJFBTQGY4RNYZA763JED57USTK6F7IRYT6KR3XYO2ZTKK55OM6ID2WQXQKKXJCYMWXQ74YXREHVTQ3VUD5QHYBJTKHDDH5R4ALQAGIQKPFL52A3HQ377WNCCHYI"
         },
         "new": true
       },
       "request": {
         "type": "LaunchRequest",
         "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
         "locale": "en-US",
         "timestamp": "2016-11-03T21:31:08Z",
         "intent": {}
       },
       "version": "1.0"
    };

    // If there is no argument, then we'll just ask for the rules
    if ((argv.length <= 2) || (argv[2] == "rules"))
    {
        lambda.request.intent = readRulesIntent;
    }
    else if (argv[2] == "suggest")
    {
        lambda.request.intent = suggestIntent;
    }
    else if (argv[2] == "help")
    {
        lambda.request.intent = helpIntent;;
    }
    else if (argv[2] == "bet")
    {
        betIntent.slots.Amount.value = (argv.length > 3) ? argv[3] : 100;
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
  if (result.response.outputSpeech.ssml) {
    console.log('AS SSML: ' + result.response.outputSpeech.ssml);
  } else {
    console.log(result.response.outputSpeech.text);
  }
  if (result.response.card && result.response.card.content) {
    console.log('Card Content: ' + result.response.card.content);
  }
  console.log('The session ' + ((!result.response.shouldEndSession) ? 'stays open.' : 'closes.'));
  if (result.sessionAttributes) {
    console.log('Attributes: ' + JSON.stringify(result.sessionAttributes));
  }
}

myResponse.fail = function(e) {
  console.log(e);
}

// Build the event object and call the app
var event = BuildEvent(process.argv);
if (event) {
    mainApp.handler(event, myResponse);
}
