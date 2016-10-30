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

var http = require('http');
var requestify = require('requestify');

//const gameEndpoint = "http://blackjacktutor-env.us-west-2.elasticbeanstalk.com/";
const gameEndpoint = "http://localhost:3000/";
const cardRanks = ["none", "ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "jack", "queen", "king"];

module.exports = {
    //Plays a given action, returning either an error or a response string
    PlayBlackjackAction: function (userID, action, amount, callback)
    {
        var speechError;
        var speech = "Sorry, internal error. What else can I help with?";

        // Get the game state so we can take action (the latest should be stored tied to this user ID)
        GetGameState(userID, function(error, gameState) {
            if (error)
            {
                speechError = "There was an error: " + error;
                callback(speechError, null, null);
                return;
            }

            // Is this a valid option?
            if (!gameState.possibleActions || (gameState.possibleActions.indexOf(action) < 0))
            {
                // Probably need a way to read out the game state better
                speechError = "I'm sorry, " + action + " is not a valid action at this time. ";
                speechError += ReadHand(gameState);
                speechError += " " + ListValidActions(gameState);
                speechError += "What else can I help with?";
                callback(speechError, null, gameState);
            }
            else {
                // OK, let's post this action and get a new game state
                PostUserAction(gameState.userID, action, amount, function(error, newGameState) {
                    if (error)
                    {
                        speechError = error;
                    }
                    else
                    {
                        speech = TellResult(action, gameState, newGameState);
                    }

                    callback(speechError, speech, newGameState);
                });
            }
        });
    }
};

/*
 * Internal functions
 */
function GetGameState(userID, callback)
{
    var queryString = 'get?userID=' + userID;

    http.get(gameEndpoint + queryString, function (res) {
        if (res.statusCode == 200)
        {
            // Great, we should have a game!
            var fulltext = '';

            res.on('data', function(data) {
                fulltext += data;
            });

            res.on('end', function() {
                callback(null, JSON.parse(fulltext));
            });
        }
        else
        {
            // Sorry, there was an error calling the HTTP endpoint
            callback("Unable to call endpoint", null);
        }
    }).on('error', function (e) {
        callback("Communications error: " + e.message, null);
    });
}

function PostUserAction(userID, action, amount, callback)
{
    var payload = {userID: userID, action: action};

    if (action == "bet")
    {
        payload.value = amount;
    }
    requestify.post(gameEndpoint, payload)
    .then(function(response) {
        // Get the response body (JSON parsed or jQuery object for XMLs)
        response.getBody();

        // Get the raw response body
        callback(null, JSON.parse(response.body));
    })
    .fail(function(response) {
        callback(response.getCode(), null);
    });;
}

function ActionToText(action)
{
    var index;
    var mapping = ["resetbankroll", "Reset Bankroll",
                   "shuffle", "Shuffle",
                   "bet", "Bet",
                   "insurance", "Take Insurance",
                   "noinsurance", "Don't take Insurance",
                   "hit", "Hit",
                   "stand", "Stand",
                   "split", "Split",
                   "double", "Double Down",
                   "surrender", "Surrender"];

    index = mapping.indexOf(action);
    return (index > -1) ? mapping[index + 1] : "";
}

function ListValidActions(gameState)
{
    var i;
    var result = "";

    if (gameState.possibleActions)
    {
        result = "You can ";
        for (i = 0; i < gameState.possibleActions.length; i++)
        {
            result += ActionToText(gameState.possibleActions[i]);
            if (i < gameState.possibleActions.length - 1)
            {
                // There's more to come
                result += ", or ";
            }
        }

        result += ". ";
    }

    return result;
}

function TellResult(action, gameState, newGameState)
{
    var result;

    // First repeat what they did
    result = "You " + ActionToText(action) + ". ";

    // So what happened?
    switch (action)
    {
        case "resetbankroll":
            result += "Bankroll reset";
            break;
        case "shuffle":
            result += "Deck shuffled";
            break;
        case "bet":
            // A new hand was dealt
            result += ReadHand(newGameState);
            break;
        case "hit":
        case "stand":
            // Just read the whole hand
            result += ReadHand(newGameState);
        case "insurance":
        case "noinsurance":
        case "split":
        case "double":
        case "surrender":
            break;
    }

    return result;
}

function ReadHand(gameState)
{
    var result;
    var i;
    var handTotal = HandTotal(gameState.playerHands[0].cards);

    // Read the full hand
    if (handTotal.total > 21)
    {
        result = "You busted with ";
    }
    else
    {
        result = "You have ";
    }

    for (i = 0; i < gameState.playerHands[0].cards.length; i++)
    {
        result += cardRanks[gameState.playerHands[0].cards[i].rank];
        if (i < gameState.playerHands[0].cards.length - 1)
        {
            result += " and ";
        }
    }

    result += " for a total of " + handTotal.speech;
    result += ". The dealer has a ";
    result += cardRanks[gameState.dealerHand.cards[1].rank];
    result += " showing.";

    return result;
}

 function HandTotal(cards)
 {
    var result = {speech: "", total: 0, soft: false};
    var hasAces = false;

    for (var i = 0; i < cards.length; i++)
    {
        if (cards[i].rank > 10)
        {
            result.total += 10;
        }
        else
        {
            result.total += cards[i].rank;
        }

        // Note if there's an ace
        if (cards[i].rank == 1)
        {
            hasAces = true;
        }
    }

    // If there are aces, add 10 to the total (unless it would go over 21)
    // Note that in this case the hand is soft
    if ((result.total <= 11) && hasAces)
    {
        result.speech = "soft ";
        result.total += 10;
        result.soft = true;
    }

    result.speech += result.total;
    return result;
}