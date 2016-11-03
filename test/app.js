var mainApp = require('../src/index');

function BuildEvent(argv)
{
    // Templates that can fill in the intent
    var blackjackIntent = {"name": "BlackjackIntent", "slots": {"Action": {"name": "Action", "value": ""}}};
    var suggestIntent = {"name": "SuggestIntent", "slots": {}};
    var changeRulesIntent = {"name": "ChangeRulesIntent", "slots": {"ChangeOption": {"name": "ChangeOption", "value": ""}, "Change": {"name": "Change", "value": ""}}};
    var readRulesIntent = {"name": "RulesIntent", "slots": {}};
    var betIntent = {"name": "BetIntent", "slots": {"Amount": {"name": "Amount", "value": ""}}};

    var lambda = {
       "session": {
         "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
         "application": {
           "applicationId": "amzn1.ask.skill.74ea63e3-3295-463f-8ea5-cd80f4b6cfc9"
         },
         "attributes": {},
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

    // If there is no argument, then we'll just ask for the rules
    if ((argv.length <= 2) || (argv[2] == "rules"))
    {
        lambda.request.intent = readRulesIntent;
    }
    else if (argv[2] == "suggest")
    {
        lambda.request.intent = suggestIntent;
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
    console.log(result.response.outputSpeech.text);
}

// Build the event object and call the app
mainApp.handler(BuildEvent(process.argv), myResponse);

