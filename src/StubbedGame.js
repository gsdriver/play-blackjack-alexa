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

// Flow - deal a 16 against a dealer 10, and surrender
const surrenderState = [
  // First deal the hand with 16 and a 10 showing
  {"userID":"stubbed","activePlayer":"player","currentPlayerHand":0,"bankroll":4780,
  "possibleActions":["hit","stand","surrender","double"],"dealerHand":{"outcome":"playing","cards":[{"rank":0,"suit":"none"},
  {"rank":12,"suit":"diamonds"}],"total":10,"soft":false},"playerHands":[{"bet":20,"busted":false,
  "cards":[{"rank":13,"suit":"clubs"},{"rank":6,"suit":"hearts"}],"outcome":"playing","total":16,"soft":false}],"lastBet":"20",
  "houseRules":{"hitSoft17":false,"surrender":"late","double":"any","doubleaftersplit":true,
                "resplitAces":false,"blackjackBonus":0.5,"numberOfDecks":1,"minBet":5,"maxBet":1000,"maxSplitHands":4}},
  // Then surrender
  {"userID":"stubbed","activePlayer":"none","currentPlayerHand":0,"bankroll":4790,
  "possibleActions":["bet"],"dealerHand":{"outcome":"playing","cards":[{"rank":12,"suit":"hearts"},{"rank":12,"suit":"diamonds"}],
  "total":20,"soft":false},"playerHands":[{"bet":20,"busted":false,"cards":[{"rank":13,"suit":"clubs"},{"rank":6,"suit":"hearts"}],
  "outcome":"surrender","total":16,"soft":false}],"lastBet":"20",
  "houseRules":{"hitSoft17":false,"surrender":"late","double":"any","doubleaftersplit":true,"resplitAces":false,
                "blackjackBonus":0.5,"numberOfDecks":1,"minBet":5,"maxBet":1000,"maxSplitHands":4}}
];

// Flow - several hits before standing
const hittingStreakState = [
  // Deal a soft 13 against dealer 10
  {"userID":"stubbed","activePlayer":"player","currentPlayerHand":0,"bankroll":4760,
  "possibleActions":["hit","stand","surrender","double"],"dealerHand":{"outcome":"playing","cards":[{"rank":0,"suit":"none"},
  {"rank":12,"suit":"spades"}],"total":10,"soft":false},"playerHands":[{"bet":30,"busted":false,"cards":[{"rank":2,"suit":"clubs"},
  {"rank":1,"suit":"spades"}],"outcome":"playing","total":13,"soft":true}],"lastBet":"30",
  "houseRules":{"hitSoft17":false,"surrender":"late","double":"any","doubleaftersplit":true,
                "resplitAces":false,"blackjackBonus":0.5,"numberOfDecks":1,"minBet":5,"maxBet":1000,"maxSplitHands":4}},
  // Draw a 3
  {"userID":"stubbed","activePlayer":"player","currentPlayerHand":0,"bankroll":4760,
  "possibleActions":["hit","stand"],"dealerHand":{"outcome":"playing","cards":[{"rank":0,"suit":"none"},{"rank":12,"suit":"spades"}],
  "total":10,"soft":false},"playerHands":[{"bet":30,"busted":false,"cards":[{"rank":2,"suit":"clubs"},{"rank":1,"suit":"spades"},
  {"rank":3,"suit":"hearts"}],"outcome":"playing","total":16,"soft":true}],"lastBet":"30",
  "houseRules":{"hitSoft17":false,"surrender":"late","double":"any","doubleaftersplit":true,
                "resplitAces":false,"blackjackBonus":0.5,"numberOfDecks":1,"minBet":5,"maxBet":1000,"maxSplitHands":4}},
  // Draw a 10
  {"userID":"stubbed","activePlayer":"player","currentPlayerHand":0,"bankroll":4760,
  "possibleActions":["hit","stand"],"dealerHand":{"outcome":"playing","cards":[{"rank":0,"suit":"none"},{"rank":12,"suit":"spades"}],
  "total":10,"soft":false},"playerHands":[{"bet":30,"busted":false,"cards":[{"rank":2,"suit":"clubs"},{"rank":1,"suit":"spades"},
  {"rank":3,"suit":"hearts"},{"rank":10,"suit":"diamonds"}],"outcome":"playing","total":16,"soft":false}],"lastBet":"30",
  "houseRules":{"hitSoft17":false,"surrender":"late","double":"any","doubleaftersplit":true,
                "resplitAces":false,"blackjackBonus":0.5,"numberOfDecks":1,"minBet":5,"maxBet":1000,"maxSplitHands":4}},
  // Draw a 4
  {"userID":"stubbed","activePlayer":"player","currentPlayerHand":0,"bankroll":4760,"possibleActions":["hit","stand"],
  "dealerHand":{"outcome":"playing","cards":[{"rank":0,"suit":"none"},{"rank":12,"suit":"spades"}],"total":10,"soft":false},
  "playerHands":[{"bet":30,"busted":false,"cards":[{"rank":2,"suit":"clubs"},{"rank":1,"suit":"spades"},{"rank":3,"suit":"hearts"},
  {"rank":10,"suit":"diamonds"},{"rank":4,"suit":"diamonds"}],"outcome":"playing","total":20,"soft":false}],"lastBet":"30",
  "houseRules":{"hitSoft17":false,"surrender":"late","double":"any","doubleaftersplit":true,
                "resplitAces":false,"blackjackBonus":0.5,"numberOfDecks":1,"minBet":5,"maxBet":1000,"maxSplitHands":4}},
  // Stand
  {"userID":"stubbed","activePlayer":"none","currentPlayerHand":0,"bankroll":4790,"possibleActions":["bet"],
  "dealerHand":{"outcome":"playing","cards":[{"rank":13,"suit":"spades"},{"rank":12,"suit":"spades"}],"total":20,"soft":false},
  "playerHands":[{"bet":30,"busted":false,"cards":[{"rank":2,"suit":"clubs"},{"rank":1,"suit":"spades"},{"rank":3,"suit":"hearts"},
  {"rank":10,"suit":"diamonds"},{"rank":4,"suit":"diamonds"}],"outcome":"push","total":20,"soft":false}],"lastBet":"30",
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
        callback(null, "Flushed");
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
        // 20 - surrenderState flow
        case 20:
            lastGameFlow = surrenderState;
            break;
        // 30 - hittingStreak flow
        case 30:
            lastGameFlow = hittingStreakState;
            break;
    }

    return lastGameFlow[0];
}
