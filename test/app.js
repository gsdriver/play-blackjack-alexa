var playgame = require('../src/PlayGame');

   /*
var endpoint = "http://localhost:3000";

requestify.post(endpoint, {userID: "d4360c70-814c-446b-a712-511c3231b144", action: "bet", value:"100"})
.then(function(response) {
    // Get the response body (JSON parsed or jQuery object for XMLs)
    response.getBody();

    // Get the raw response body
    console.log(JSON.stringify(response.body));
})
.fail(function(response) {
    console.log("ERROR " + response.getCode());
    console.log(JSON.stringify(response));
});

http://blackjacktutor-env.us-west-2.elasticbeanstalk.com/get?userID=amzn1.ask.account.AFLJ3RYNI3X6MQMX4KVH52CZKDSI6PMWCQWRBHSPJJPR2MKGDNJHW36XF2ET6I2BFUDRKH3SR2ACZ5VCRLXLGJFBTQGY4RNYZA763JED57USTK6F7IRYT6KR3XYO2ZTKK55OM6ID2WQXQKKXJCYMWXQ74YXREHVTQ3VUD5QHYBJTKHDDH5R4ALQAGIQKPFL52A3HQ377WNCCHYI
*/

/*
 * Maps whatever the user said to the appropriate action
 */
function GetBlackjackAction(actionSlot)
{
    var mapping = ["hit", "hit", "take a hit", "hit", "hit me", "hit", "take one", "hit",
            "stand", "stand", "stay", "stand", "done", "stand",
            "surrender", "surrender", "give up", "surrender",
            "double", "double", "double down", "double",
            "split", "split",
            "insurance", "insurance", "take insurance", "insurance", "insure me", "insurance",
            "no insurance", "noinsurance", "never take insurance", "noinsurance",
            "don't take insurance", "noinsurance",
            "shuffle", "shuffle", "shuffle deck", "shuffle",
            "reset", "resetbankroll", "reset bankroll", "resetbankroll",
            "bet", "bet", "deal", "bet"];
    var index, action;

    // Look it up in lowercase
    index = mapping.indexOf(actionSlot.value.toLowerCase());
    action = (index > -1) ? mapping[index + 1] : actionSlot.value;
    return action;
}

function BlackjackIntent(intent, session, response) {
    // First make sure we have an action
    var actionSlot = intent.slots.Action;
    var error;

    if (!actionSlot) {
        error = "I'm sorry, I didn't catch that action. Please say what you want to do on this hand like hit or stand. What else can I help with?";
        PrintResults(error, null, response);
    }
    else if (!actionSlot.value) {
        speechError = "I'm sorry, I don't understand how to " + actionSlot.value + ". Please provide an action like hit or stand. What else can I help with?";
        PrintResults(error, null, response);
    }
    else
    {
        // Let's play this action
        playgame.PlayBlackjackAction(session.user.userId, GetBlackjackAction(actionSlot), 0, function(speechError, speech, gameState) {
            if (gameState)
            {
                session.attributes = gameState;
            }

            PrintResults(speechError, speech, response);
        });
    }
}

function PrintResults(speechError, speech, gameState)
{
    if (speech)
    {
        console.log("I say " + speech);
    }
    if (speechError)
    {
        console.log("Error " + speechError);
    }

    if (gameState)
    {
        console.log(); //JSON.stringify(gameState));
    }
}

const userID = "d0fb4421-3686-4a7a-866b-c69e1a3318f5";

//playgame.ReadRules(userID, PrintResults);
var thisSession = {
                      "sessionId": "SessionId.d9a53cc2-638f-4f08-bb62-4a3cf970fcc2",
                      "application": {
                        "applicationId": "amzn1.ask.skill.74ea63e3-3295-463f-8ea5-cd80f4b6cfc9"
                      },
                      "attributes": {},
                      "user": {
                        "userId": "amzn1.ask.account.AFLJ3RYNI3X6MQMX4KVH52CZKDSI6PMWCQWRBHSPJJPR2MKGDNJHW36XF2ET6I2BFUDRKH3SR2ACZ5VCRLXLGJFBTQGY4RNYZA763JED57USTK6F7IRYT6KR3XYO2ZTKK55OM6ID2WQXQKKXJCYMWXQ74YXREHVTQ3VUD5QHYBJTKHDDH5R4ALQAGIQKPFL52A3HQ377WNCCHYI"
                      },
                      "new": true
                    };
var jackAction =  {
                       "name": "BlackjackIntent",
                       "slots": {
                         "Action": {
                           "name": "Action",
                           "value": "stand"
                         }
                       }
                     };

if (process.argv.length > 2)
{
    jackAction.slots.Action.value = process.argv[2];
}

BlackjackIntent(jackAction, thisSession, null);

