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

var APP_ID = undefined; //"amzn1.ask.skill.74ea63e3-3295-463f-8ea5-cd80f4b6cfc9";

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
    response.ask(speechText, repromptText);
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
        response.tellWithCard(speechOutput, cardTitle, "Hit or stand");
    }
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

exports.handler = function (event, context) 
{
    var bj = new Blackjack();
    bj.execute(event, context);
};
