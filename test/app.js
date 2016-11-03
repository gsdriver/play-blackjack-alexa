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

function BuildRulesObject(option, value)
{
    var valueMapping = {"on": true, "off": false, "enable": true, "disable": false,
                "3 to 2": 0.5, "three to two": 0.5, "6 to 5": 0.2, "six to five": 0.2, "even": 0, "even money": 0,
                "one deck": 1, "two decks": 2, "four decks": 4, "six decks": 6, "eight decks": 8,
                "two deck": 2, "four deck": 4, "six deck": 6, "eight deck": 8,
                "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "eight": 8,
                "1": 1, "2": 2, "3": 3, "4": 4, "6": 6, "8": 8};
    var ruleMapping = {"hit soft seventeen": "hitSoft17", "soft seventeen": "hitSoft17", "surrender": "surrender",
                "double": "double", "double down": "double", "double after split": "doubleaftersplit", "resplit aces": "resplitAces",
                "blackjack pays": "blackjackBonus", "blackjack bonus": "blackjackBonus", "number of decks": "numberOfDecks",
                "decks": "numberOfDecks", "minimum bet": "minBet", "table minimum": "minBet", "maximum bet": "maxBet",
                "table maximum": "maxBet", "number of splits": "maxSplitHands", "number of split hands": "maxSplitHands",
                "split hands": "maxSplitHands"};
    var ruleValue = valueMapping[value.toLowerCase()];
    var ruleOption = ruleMapping[option.toLowerCase()];
    var rules = {};

    if ((ruleValue == undefined) || (ruleOption == undefined))
    {
        return null;
    }

    // OK, now we can set the rule object appropriately
    rules[ruleOption] = ruleValue;
    console.log(JSON.stringify(rules));
    return rules;
}

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
            "noinsurance", "noinsurance", "no insurance", "noinsurance", "never take insurance", "noinsurance",
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
//console.log(JSON.stringify(gameState));
            }

            PrintResults(speechError, speech, response);
        });
    }
}

function ChangeRulesIntent(intent, session, response) {
    // Which rule should we change?
    var changeSlot = intent.slots.Change;
    var optionSlot = intent.slots.ChangeOption;
    var speechError;

    if (!changeSlot)
    {
        speechError = "I'm sorry, I didn't catch a rule to change. Please provide a rule to change like Surrender or Hit Soft 17. What else can I help with?";
        PrintResults(speechError, null, response);
    }
    else if (!changeSlot.value) {
        speechError = "I'm sorry, I don't understand how to change " + changeSlot.value + ". Please provide a rule to change like Surrender or Hit Soft 17. What else can I help with?";
        PrintResults(speechError, null, response);
    }
    else if (!optionSlot || !optionSlot.value)
    {
        speechError = "I'm sorry, I didn't catch how to change " + changeSlot.value;
    }
    else
    {
        // Build the appropriate rules object and set it
        var rules = BuildRulesObject(changeSlot.value, optionSlot.value);

        if (!rules)
        {
            speechError = "I'm sorry, I was unable to change " + changeSlot.value + " to " + optionSlot.value;
            PrintResults(speechError, null, response);
        }
        else
        {
            playgame.ChangeRules(session.user.userId, rules, function(speechError, speech, gameState)
            {
                if (gameState)
                {
                    session.attributes = gameState;
                }

                PrintResults(speechError, speech, response);
            });
        }
    }
 }

function SuggestIntent(intent, session, response) {
    // Get a suggestion
    playgame.PlayBlackjackAction(session.user.userId, "suggest", 0, function(speechError, speech, gameState) {
        PrintResults(speechError, speech, response);
    });
}

function PrintResults(speechError, speech, gameState)
{
    if (speech)
    {
        console.log(speech);
    }
    if (speechError)
    {
        console.log("Error " + speechError);
    }
}

const userID = "9c7fc59c-29c6-49ca-9c20-9c9324849460";

//playgame.ReadRules(userID, PrintResults);
var thisSession = {
                      "sessionId": "SessionId.d9a53cc2-638f-4f08-bb62-4a3cf970fcc2",
                      "application": {
                        "applicationId": "amzn1.ask.skill.74ea63e3-3295-463f-8ea5-cd80f4b6cfc9"
                      },
                      "attributes": {},
                      "user": {
                        "userId": userID //"amzn1.ask.account.AFLJ3RYNI3X6MQMX4KVH52CZKDSI6PMWCQWRBHSPJJPR2MKGDNJHW36XF2ET6I2BFUDRKH3SR2ACZ5VCRLXLGJFBTQGY4RNYZA763JED57USTK6F7IRYT6KR3XYO2ZTKK55OM6ID2WQXQKKXJCYMWXQ74YXREHVTQ3VUD5QHYBJTKHDDH5R4ALQAGIQKPFL52A3HQ377WNCCHYI"
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
var suggestAction = {
                          "name": "SuggestIntent",
                          "slots": {}
                        };
var changeRules = {
                        "name": "ChangeRulesIntent",
      "slots": {
        "ChangeOption": {
          "name": "ChangeOption",
          "value": "6"
        },
        "Change": {
          "name": "Change",
          "value": "number of decks"
        }
      }
                        };

ChangeRulesIntent(changeRules, thisSession, null);
return;

if ((process.argv.length > 2) && (process.argv[2] == "suggest"))
{
    SuggestIntent(suggestAction, thisSession, null);
}
else
{
    if (process.argv.length > 2)
    {
        jackAction.slots.Action.value = process.argv[2];
    }

    BlackjackIntent(jackAction, thisSession, null);
}

//playgame.PlayBlackjackAction(userID, "suggest", 0, PrintResults);

