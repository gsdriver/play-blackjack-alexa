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

// Initial Game State
const initialState = {"userID":"stubbed","activePlayer":"none","currentPlayerHand":0,
        "bankroll":5000,"possibleActions":["bet"],"dealerHand":{"cards":[],"total":0,"soft":false},
        "playerHands":[],"lastBet":100,
        "houseRules":{"hitSoft17":false,"surrender":"late","double":"any","doubleaftersplit":true,
                      "resplitAces":false,"blackjackBonus":0.5,"numberOfDecks":1,"minBet":5,"maxBet":1000,"maxSplitHands":4}};

// Flow - dealer has Ace with a 10 underneath
const dealerAceState = [
    // First - deal the hand with an Ace
    {"userID":"stubbed","activePlayer":"player","currentPlayerHand":0,
    "bankroll":5000,"possibleActions":["insurance","noinsurance"],"dealerHand":{"cards":[{"rank":0, "suit":"none"}, {"rank":1, "suit":"clubs"}],"total":11,"soft":true},
    "playerHands":[{"cards":[{"rank":11, "suit":"spades"}, {"rank":9, "suit":"clubs"}],"total":19,"soft":false}],"lastBet":100,
    "houseRules":{"hitSoft17":false,"surrender":"late","double":"any","doubleaftersplit":true,
                  "resplitAces":false,"blackjackBonus":0.5,"numberOfDecks":1,"minBet":5,"maxBet":1000,"maxSplitHands":4}},
    // Then flip over the 10 and end the game
    {"userID":"stubbed","activePlayer":"none","currentPlayerHand":0,
    "bankroll":5000,"possibleActions":["bet"],"dealerHand":{"outcome":"dealerblackjack","cards":[{"rank":10, "suit":"hearts"}, {"rank":1, "suit":"clubs"}],"total":21,"soft":true},
    "playerHands":[{"cards":[{"rank":11, "suit":"spades"}, {"rank":9, "suit":"clubs"}],"total":19,"soft":false}],"lastBet":100,
    "houseRules":{"hitSoft17":false,"surrender":"late","double":"any","doubleaftersplit":true,
                  "resplitAces":false,"blackjackBonus":0.5,"numberOfDecks":1,"minBet":5,"maxBet":1000,"maxSplitHands":4}}
    ];

var lastGameFlow = null;
var lastGameFlowIndex = 0;

module.exports = {
    GetGameState : function (callback)
    {
        if (lastGameFlow)
        {
            // Return the state from the last flow
            callback(null, lastGameFlow[lastGameFlowIndex]);
        }
        else
        {
            // Starting over
            callback(null, initialState);
        }
    },
    FlushGameState : function (callback)
    {
        lastGameFlow = null;
        lastGameFlowIndex = 0;
        callback(null, "OK");
    },
    PostUserAction : function (action, value, callback)
    {
        if (action == "bet")
        {
            // The hand we return depends on the bet amount
            callback(null, DealStubbedHand(value));
        }
        else
        {
            // Just advance the game flow
            if (!lastGameFlow)
            {
                callback("No game flow", null);
            }
            else
            {
                if (lastGameFlowIndex < lastGameFlow.length - 1)
                {
                    lastGameFlowIndex++;
                    callback(null, lastGameFlow[lastGameFlowIndex]);
                }
            }
        }
    }
};

/*
 * Internal functions
 */

function DealStubbedHand(value)
{
    lastGameFlowIndex = 0;

    switch (value)
    {
        // 10 - dealerAceState flow
        case 10:
            lastGameFlow = dealerAceState;
            break;
    }

    return lastGameFlow[0];
}
