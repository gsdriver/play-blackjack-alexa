/*
 * MIT License

 * Copyright (c) 2016 Garrett Vargas

 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

var AlexaSkill = require('./AlexaSkill');
var playgame = require('./PlayGame');

var APP_ID = "amzn1.ask.skill.94d09885-df32-4bf9-88c4-4670dbc14140";

var Blackjack = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
Blackjack.prototype = Object.create(AlexaSkill.prototype);
Blackjack.prototype.constructor = Blackjack;

Blackjack.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) 
{
    var speechText = "Welcome to the Blackjack player. You can start a blackjack game by saying start game ... Now, what can I help you with.";
    
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "For instructions on what you can say, please say help me.";

    // If they opened the session, flush the previous state if any
    playgame.FlushGame(session.user.userId, function(error, result)
    {
        // I don't care if this succeeds or not
        response.ask(speechText, repromptText);
    });
};

Blackjack.prototype.intentHandlers = {
    // Basic Strategy Intent
    "BlackjackIntent": function (intent, session, response) {
        // First make sure we have an action
        var actionSlot = intent.slots.Action;
        var error;

        if (!actionSlot) {
            error = "I'm sorry, I didn't catch that action. Please say what you want to do on this hand like hit or stand. What else can I help with?";
            SendAlexaResponse(error, null, response);
        }
        else if (!actionSlot.value) {
            speechError = "I'm sorry, I don't understand how to " + actionSlot.value + ". Please provide an action like hit or stand. What else can I help with?";
            SendAlexaResponse(error, null, response);
        }
        else
        {
            // Let's play this action
            playgame.PlayBlackjackAction(session.user.userId, GetBlackjackAction(actionSlot), 0, function(speechError, speech, gameState) {
                if (gameState)
                {
                    session.attributes = gameState;
                }

                SendAlexaResponse(speechError, speech, response);
            });
        }
    },
    // Betting intent
    "BettingIntent" : function (intent, session, response) {
        var amountSlot = intent.slots.Amount;
        var amount = (!amountSlot || !amountSlot.value) ? 0 : amountSlot.value;
        var error;

        // Take the bet
        playgame.PlayBlackjackAction(session.user.userId, "bet", amount, function(speechError, speech, gameState)
        {
            if (gameState)
            {
                session.attributes = gameState;
            }

            SendAlexaResponse(speechError, speech, response);
        });
    },
    // Suggestion intent
    "SuggestIntent" : function (intent, session, response) {
        // Get a suggestion
        playgame.PlayBlackjackAction(session.user.userId, "suggest", 0, function(speechError, speech, gameState) {
            SendAlexaResponse(speechError, speech, response);
        });
    },
    // Rules intent
    "RulesIntent" : function (intent, session, response) {
        // Just read the rules
        playgame.ReadRules(session.user.userId, function(speechError, speech, gameState)
        {
            if (gameState)
            {
                session.attributes = gameState;
            }

            SendAlexaResponse(speechError, speech, response);
        });
    },
    // Change rules intent
    "ChangeRulesIntent" : function (intent, session, response) {
        // Which rule should we change?
        var changeSlot = intent.slots.Change;
        var optionSlot = intent.slots.ChangeOption;
        var speechError;

        if (!changeSlot)
        {
            speechError = "I'm sorry, I didn't catch a rule to change. Please provide a rule to change like Surrender or Hit Soft 17. What else can I help with?";
            SendAlexaResponse(speechError, null, response);
        }
        else if (!changeSlot.value) {
            speechError = "I'm sorry, I don't understand how to change " + changeSlot.value + ". Please provide a rule to change like Surrender or Hit Soft 17. What else can I help with?";
            SendAlexaResponse(speechError, null, response);
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
                SendAlexaResponse(speechError, null, response);
            }
            else
            {
                playgame.ChangeRules(session.user.userId, rules, function(speechError, speech, gameState)
                {
                    if (gameState)
                    {
                        session.attributes = gameState;
                    }

                    SendAlexaResponse(speechError, speech, response);
                });
            }
        }
    },
    // Stop intent
    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },
    // Cancel intent - for now we are session-less so does the same as goodbye
    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },
    // Yes intent - wihch we'll assume means take insurance
    "AMAZON.YesIntent": function (intent, session, response) {
        playgame.PlayBlackjackAction(session.user.userId, "insurance", 0, function(speechError, speech, gameState)
        {
            if (gameState)
            {
                session.attributes = gameState;
            }

            SendAlexaResponse(speechError, speech, response);
        });
    },
    // No intent - which we'll assume means don't take insurance
    "AMAZON.NoIntent": function (intent, session, response) {
        playgame.PlayBlackjackAction(session.user.userId, "noinsurance", 0, function(speechError, speech, gameState)
        {
            if (gameState)
            {
                session.attributes = gameState;
            }

            SendAlexaResponse(speechError, speech, response);
        });
    },
    // Repeat intent - read the hand
    "AMAZON.RepeatIntent": function (intent, session, response) {
        // Re-read the hand and possible actions
        playgame.ReadCurrentHand(session.user.userId, function(speechError, speech, gameState)
        {
            if (gameState)
            {
                session.attributes = gameState;
            }

            SendAlexaResponse(speechError, speech, response);
        });
    },
    // Help intent - provide help
    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "You can ask questions such as, what should I do with a 14 against dealer 10, or, you can say exit... Now, what can I help you with?";
        var repromptText = "You can say things like, what should I do with a 14 against dealer 10, or you can say exit... Now, what can I help you with?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    }
};

function SendAlexaResponse(speechError, speech, response)
{
    var speechOutput;
    var repromptOutput;
    var cardTitle = "Blackjack Game";

    if (speechError)
    {
        speechOutput = {
            speech: speechError,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        repromptOutput = {
            speech: "What else can I help with?",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    }
    else {
        speechOutput = {
            speech: speech,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tellWithCard(speechOutput, cardTitle, speech);
    }

    console.log(speechOutput.speech);
}

/*
 * Maps whatever the user said to the appropriate action
 */
function GetBlackjackAction(actionSlot)
{
    var actionMapping = {"hit": "hit", "take a hit": "hit", "hit me": "hit", "take one": "hit",
            "stand": "stand", "stay": "stand", "done": "stand",
            "surrender": "surrender", "give up": "surrender",
            "double": "double", "double down": "double",
            "split": "split",
            "shuffle": "shuffle", "shuffle deck": "shuffle",
            "reset": "resetbankroll", "reset bankroll": "resetbankroll",
            "bet": "bet", "deal": "bet"};
    var action = actionMapping[actionSlot.value.toLowerCase()];

    // Look it up in lowercase
    return (action == undefined) ? null : action;
}

/*
 * Determines which rules to change
 */
function BuildRulesObject(option, value)
{
    var valueMapping = {"on": true, "off": false, "enable": true, "disable": false, "enabled": true, "disabled": false,
                "3 to 2": 0.5, "three to two": 0.5, "6 to 5": 0.2, "six to five": 0.2, "even": 0, "even money": 0,
                "one deck": 1, "two decks": 2, "four decks": 4, "six decks": 6, "eight decks": 8,
                "two deck": 2, "four deck": 4, "six deck": 6, "eight deck": 8,
                "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "eight": 8,
                 "1": 1, "2": 2, "3": 3, "4": 4, "6": 6, "8": 8};
    var ruleMapping = {"hit soft seventeen": "hitSoft17", "soft seventeen": "hitSoft17", "dealer hits seventeen": "hitSoft17",
                "hit seventeen": "hitSoft17", "hits seventeen": "hitSoft17",
                "dealer hit seventeen": "hitSoft17", "dealer hits soft seventeen": "hitSoft17", "dealer hit soft seventeen": "hitSoft17",
                "hit soft 17": "hitSoft17", "soft 17": "hitSoft17", "dealer hits 17": "hitSoft17",
                "hit 17": "hitSoft17", "hits 17": "hitSoft17",
                "dealer hit 17": "hitSoft17", "dealer hits soft 17": "hitSoft17", "dealer hit soft 17": "hitSoft17",
                "surrender": "surrender",
                "double": "double", "double down": "double", "double after split": "doubleaftersplit",
                "resplit aces": "resplitAces",
                "blackjack pays": "blackjackBonus", "blackjack bonus": "blackjackBonus", "number of decks": "numberOfDecks",
                "decks": "numberOfDecks", "deck count": "numberOfDecks", "number of splits": "maxSplitHands",
                "number of split hands": "maxSplitHands", "split hands": "maxSplitHands"};
    var ruleValue = valueMapping[value.toLowerCase()];
    var ruleOption = ruleMapping[option.toLowerCase()];
    var rules = {};

    if ((ruleValue == undefined) || (ruleOption == undefined))
    {
        return null;
    }

    // OK, now we can set the rule object appropriately
    switch (ruleOption)
    {
        case "hitSoft17":
        case "doubleaftersplit":
        case "resplitAces":
            // True or false
            rules[ruleOption] = (ruleValue) ? true : false;
            break;
        case "surrender":
            // Late or none
            rules[ruleOption] = (ruleValue) ? "late" : "none";
            break;
        case "double":
            // None or any
            rules[ruleOption] = (ruleValue) ? "any" : "none";
            break;
        case "blackjackBonus":
            // 0, 0.2, or 0.5 (0.5 is "true")
            if ((ruleValue === 0) || (ruleValue === 0.2))
            {
                rules[ruleOption] = ruleValue;
            }
            else if (ruleValue === false)
            {
                rules[ruleOption] = 0;
            }
            else
            {
                rules[ruleOption] = 0.5;
            }
            break;
        case "numberOfDecks":
            // 1, 2, 4, 6, or 8
            if (ruleValue < 1)
            {
                ruleValue = 1;
            }
            else if (ruleValue > 8)
            {
                ruleValue = 8;
            }
            else if (ruleValue == 3)
            {
                ruleValue = 4;
            }
            else if ((ruleValue == 5) || (ruleValue == 7))
            {
                ruleValue = 6;
            }
            rules[ruleOption] = ruleValue;
            break;
        case "maxSplitHands":
            // 1-4 only
            if (ruleValue < 1)
            {
                ruleValue = 1;
            }
            else if (ruleValue > 4)
            {
                ruleValue = 4;
            }
            rules[ruleOption] = ruleValue;
            break;
    }

    return rules;
}

exports.handler = function (event, context) 
{
    var bj = new Blackjack();
    bj.execute(event, context);
};
