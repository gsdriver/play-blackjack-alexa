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
var config = require('./config');

const cardRanks = ["none", "ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "jack", "queen", "king"];

module.exports = {
    //Plays a given action, returning either an error or a response string
    PlayBlackjackAction: function (userID, action, value, callback)
    {
        var speechError = null;
        var speech = "Sorry, internal error. What else can I help with?";

        // Special case if this is suggest
        if (action == "suggest")
        {
            PostUserAction(userID, action, 0, function(error, suggestion)
            {
                var mapping = ["insurance", "You should take Insurance",
                               "noinsurance", "You shouldn't take Insurance",
                               "hit", "You should hit",
                               "stand", "You should stand",
                               "split", "You should split",
                               "double", "You should Double Down",
                               "surrender", "You should surrender"];
                var index;
                var speechError = (suggestion.error) ? suggestion.error : error;
                var suggestText = suggestion.suggestion;

                if (suggestText)
                {
                    index = mapping.indexOf(suggestText);
                    if (index > -1)
                    {
                        suggestText = mapping[index + 1];
                    }
                }

                callback(speechError, suggestText, null);
            });
        }
        else
        {
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
                    SendUserCallback(gameState, speechError, null, callback);
                }
                else {
                    // OK, let's post this action and get a new game state
                    PostUserAction(gameState.userID, action, (value ? value : gameState.lastBet), function(error, newGameState) {
                        if (error)
                        {
                            speechError = error;
                        }
                        else
                        {
                            speech = TellResult(action, gameState, newGameState);
                        }

                        SendUserCallback(newGameState, speechError, speech, callback);
                    });
                }
            });
        }
    },
    // Reads back the rules in play
    ReadRules: function (userID, callback)
    {
        // Get the game state, which will have the rules
        var speechError = null;
        var speech = "Sorry, internal error. What else can I help with?";

        // Get the game state so we can take action (the latest should be stored tied to this user ID)
        GetGameState(userID, function(error, gameState) {
            if (error)
            {
                speechError = "There was an error: " + error;
                callback(speechError, null, null);
                return;
            }

            // Convert the rules to text
            speech = RulesToText(gameState.houseRules);
            callback(speechError, speech, gameState);
        });
    },
    // Changes the rules in play
    ChangeRules : function (userID, rules, callback)
    {
        var speechError = null;
        var speech = "Sorry, internal error. What else can I help with?";

        // OK, let's post the rule change and get a new game state
        PostUserAction(userID, "setrules", rules, function(error, newGameState) {
            if (error)
            {
                speechError = error;
            }
            else
            {
                // Read the new rules
                speech = RulesToText(newGameState.houseRules);
            }

            // If this is shuffle, we'll do the shuffle for them
            SendUserCallback(newGameState, error, speech, callback);
        });
    }
};

/*
 * It's possible the game gets to a state where you have to reset the bankroll
 * or shuffle the deck.  Let's do that automatically for the user
 */
function SendUserCallback(gameState, error, speech, callback)
{
    // If this is shuffle, we'll do the shuffle for them
    if (gameState && gameState.possibleActions)
    {
        if (gameState.possibleActions.indexOf("shuffle") > -1)
        {
            // Simplify things and just shuffle for them
            PostUserAction(gameState.userID, "shuffle", 0, function(nextError, nextGameState) {
                callback(error, speech, nextGameState);
            });
            return;
        }
        // If this is resetbankroll, we'll do that for them too
        else if (gameState.possibleActions.indexOf("resetbankroll") > -1)
        {
            // Simplify things and just shuffle for them
            PostUserAction(gameState.userID, "resetbankroll", 0, function(nextError, nextGameState) {
                callback(error, speech, nextGameState);
            });
            return;
        }
    }

    // Nope, just do a regular callback
    callback(error, speech, gameState);
}

/*
 * Internal functions
 */
function GetGameState(userID, callback)
{
    var queryString = 'get?userID=' + userID;

    http.get(config.serviceEndpoint + queryString, function (res) {
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

function PostUserAction(userID, action, value, callback)
{
    var payload = {userID: userID, action: action};

    if (action == "bet")
    {
        payload.value = value;
    }
    else if (action == "setrules")
    {
        for (var attrname in value) { payload[attrname] = value[attrname]; }
    }
    requestify.post(config.serviceEndpoint, payload)
    .then(function(response) {
        // Get the response body (JSON parsed or jQuery object for XMLs)
        response.getBody();

        // Get the raw response body
        callback(null, JSON.parse(response.body));
    })
    .fail(function(response) {
        callback(GetSpeechError(response), null);
    });;
}

function GetSpeechError(response)
{
    var errorMapping = ["bettoosmall", "Your bet is below the minimum of five dollars",
                        "bettoolarge", "Your bet is below the maximum of one thousand dollars",
                        "betoverbankroll", "Your bet is more than your available bankroll"];
    var errorText = "Internal error";
    var error;
    var index;

    error = response.getBody();
    if (error && error.error)
    {
        index = errorMapping.indexOf(error.error);
        errorText = (index > -1) ? errorMapping[index + 1] : error.error;
    }
    else
    {
        errorText = "Error code " + response.getCode();
    }

    return errorText;
}

function ActionToText(action)
{
    var index;
    var mapping = ["resetbankroll", "Deal",
                   "shuffle", "Deal",
                   "bet", "Deal",
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
        result = "You can say ";
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
    var result = "";

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
            // Tell them the new card, the total, and the dealer up card
            result += ReadHit(newGameState);
            break;
        case "stand":
            // OK, let's read what the dealer had, what they drew, and what happened
            result += ReadStand(newGameState);
            break;
        case "double":
            // Tell them the new card, and what the dealer did
            result += ReadDouble(newGameState);
            break;
        case "insurance":
        case "noinsurance":
            // Say whether the dealer had blackjack, and what the next thing is to do
            result += ReadInsurance(newGameState);
            break;
        case "split":
            // OK, now you have multiple hands - makes reading the game state more interesting
            result += ReadSplit(newGameState);
            break;
        case "surrender":
            result += ReadSurrender(newGameState);
            break;
    }

    // And what can they do next?
    result += " " + ListValidActions(newGameState);
    return result;
}

/*
 * Recaps what the dealer has done now that he played his turn
 */
function ReadDealerAction(gameState)
{
    var result, i;

    result = "The dealer had a " + cardRanks[gameState.dealerHand.cards[0].rank] + " down.";
    if (gameState.dealerHand.cards.length > 2)
    {
        result += " The dealer drew ";
        for (i = 2; i < gameState.dealerHand.cards.length; i++)
        {
            result += "a " + cardRanks[gameState.dealerHand.cards[i].rank];
            if (i < gameState.dealerHand.cards.length - 1)
            {
                result += " and ";
            }
        }

        result += ".";
    }

    if (gameState.dealerHand.total > 21)
    {
        result += " The dealer busted.";
    }
    else
    {
        result += " The dealer had a total of " + gameState.dealerHand.total + ".";
    }

    return result;
}

/*
 * Read the result of the game
 */
function ReadGameResult(gameState)
{
    var outcomeMapping = ["blackjack", "You win with a Natural Blackjack!",
               "dealerblackjack", "The dealer has Blackjack.",
               "nodealerblackjack", "The dealer doesn't have Blackjack.",
               "win", "You won!",
               "loss", "You lost.",
               "push", "It's a tie.",
               "surrender", "You surrendered."];
    var i, index;
    var outcome = "";

    // If multiple hands, say so
    for (i = 0; i < gameState.playerHands.length; i++)
    {
        outcome += ReadHandNumber(gameState, i);
        index = outcomeMapping.indexOf(gameState.playerHands[i].outcome);
        outcome += (index > -1) ? outcomeMapping[index + 1] : "";
        outcome += " ";
    }

    // What was the outcome?
    return outcome;
}

/*
 * We will read the new card, the total, and the dealer up card
 */
function ReadHit(gameState)
{
    var currentHand = gameState.playerHands[gameState.currentPlayerHand];
    var result;

    result = "You got a " + cardRanks[currentHand.cards[currentHand.cards.length - 1].rank];
    if (currentHand.total > 21)
    {
        result += " and busted. ";
    }
    else
    {
        result += " for a total of " + (currentHand.soft ? "soft " : "") + currentHand.total + ".";
        result += " The dealer is showing a " + cardRanks[gameState.dealerHand.cards[1].rank];
        result += ".";
    }

    if (gameState.activePlayer != "player")
    {
        result += ReadDealerAction(gameState);
        result += " " + ReadGameResult(gameState);
    }

    return result;
}

/*
 * We read the card that the player got, then the dealer's hand, action, and final outcome
 */
function ReadDouble(gameState)
{
    var currentHand = gameState.playerHands[gameState.currentPlayerHand];
    var result;

    result = "You got a " + cardRanks[currentHand.cards[currentHand.cards.length - 1].rank];
    if (currentHand.total > 21)
    {
        result += " and busted.";
    }
    else
    {
        result += " for a total of " + (currentHand.soft ? "soft " : "") + currentHand.total + ". ";
    }

    if (gameState.activePlayer != "player")
    {
        result += ReadDealerAction(gameState);
        result += " " + ReadGameResult(gameState);
    }

    return result;
}

/*
 * We will read the dealer's hand, action, and what the final outcome was
 */
function ReadStand(gameState)
{
    var result;

    // If they are still playing, then read the next hand, otherwise read
    // the dealer action
    if (gameState.activePlayer == "player")
    {
        result = ReadHand(gameState);
    }
    else
    {
        result = ReadDealerAction(gameState);
        result += " " + ReadGameResult(gameState);
    }

    return result;
}

/*
 * You split, so now let's read the result
 */
function ReadSplit(gameState)
{
    var result;

    result = "You split a pair of " + cardRanks[gameState.playerHands[gameState.currentPlayerHand].cards[0].rank];
    result += ". ";

    // Now read the current hand
    result += ReadHand(gameState);

    return result;
}

/*
 * You surrendered, so the game is over
 */
function ReadSurrender(gameState)
{
    var result = "You surrendered. ";

    // Rub it in by saying what the dealer had
    result += ReadDealerAction(gameState);

    return result;
}

/*
 * Say whether the dealer had blackjack - if not, reiterate the current hand,
 * if so then we're done and let them know to bet
 */
function ReadInsurance(gameState)
{
    var result = "";

    if (gameState.dealerHand.outcome == "dealerblackjack")
    {
        // Game over
        result += "The dealer had a blackjack. ";
        result += ReadGameResult(gameState);
    }
    else if (gameState.dealerHand.outcome == "nodealerblackjack")
    {
        // No blackjack - so what do you want to do now?
        result += "The dealer didn't have a blackjack. ";
        result += ReadHand(gameState);
    }

    return result;
}

/*
 * Reads the state of the hand - your cards and total, and the dealer up card
 */
function ReadHand(gameState)
{
    var result = "";
    var i;
    var currentHand;

    // It's possible there is no hand
    if (gameState.playerHands.length == 0)
    {
        return "";
    }
    currentHand = gameState.playerHands[gameState.currentPlayerHand];

    // If they have more than one hand, then say the hand number
    result += ReadHandNumber(gameState, gameState.currentPlayerHand);

    // Read the full hand
    if (currentHand.total > 21)
    {
        result += "You busted with ";
    }
    else
    {
        // If no active player, use past tense
        result += (gameState.activePlayer == "none") ? "You had " : "You have ";
    }

    for (i = 0; i < currentHand.cards.length; i++)
    {
        result += cardRanks[currentHand.cards[i].rank];
        if (i < currentHand.cards.length - 1)
        {
            result += " and ";
        }
    }

    result += " for a total of " + (currentHand.soft ? "soft " : "") + currentHand.total;
    result += ". The dealer ";
    result += (gameState.activePlayer == "none") ? "had a " : "has a ";
    result += cardRanks[gameState.dealerHand.cards[1].rank];
    result += " showing.";

    return result;
}

/*
 * Returns a string if you have more than one hand in play
 */
function ReadHandNumber(gameState, handNumber)
{
    var result = "";
    var mapping = ["First hand ", "Second hand ", "Third hand ", "Fourth hand "];

    if (gameState.playerHands.length > 1)
    {
        result = mapping[handNumber];
    }

    return result;
}

function RulesToText(rules)
{
    var text = "";

    // Say the decks and betting range
    text += rules.numberOfDecks + " deck game, bet from " + rules.minBet + " to " + rules.maxBet + " dollars. ";

    // Hit or stand on soft 17
    text += "Dealer " + (rules.hitSoft17 ? "hits" : "stands") + " on soft 17. ";

    // Double rules
    var doubleMapping = ["any", "any cards",
                          "10or11", "10 or 11 only",
                          "9or10o11", "9 thru 11 only",
                          "none", "not allowed"];
    var iDouble = doubleMapping.indexOf(rules.double);
    if (iDouble > -1)
    {
        text += "Double on " + doubleMapping[iDouble + 1] + ". ";
        text += "Double after split " + (rules.doubleaftersplit ? "allowed. " : "not allowed. ");
    }

    // Splitting (only metion if you can resplit aces 'cuz that's uncommon)
    if (rules.resplitAces)
    {
        text += "Can resplit Aces. ";
    }

    // Surrender rules
    var surrenderMapping = ["none", "Surrender not offered. ",
                          "early", "Surrender allowed. ",
                          "late", "Surrender allowed. "];
    var iSurrender = surrenderMapping.indexOf(rules.surrender);
    if (iSurrender > -1) {
        text += surrenderMapping[iSurrender + 1];
    }

    // Blackjack payout
    var blackjackPayout = ["0.5", "3 to 2",
                           "0.2", "6 to 5",
                           "0", "even money"];
    var iBlackjack = blackjackPayout.indexOf(rules.blackjackBonus.toString());
    if (iBlackjack > -1) {
        text += "Blackjack pays " + blackjackPayout[iBlackjack + 1];
    }

    return text;
};