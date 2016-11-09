# play-blackjack-alexa
Alexa skill that allows you to play a game of blackjack
This skill leverages a Blackjack server (blackjack-game-server)
to maintain state of the game, and is effectively a speech UI
on top of the game server.  You can play the game via the following voice commands:

* `deal` or `bet` - Deals a round.  You can specify an optional dollar amount between 5 and 1000
* `hit` - Takes another card
* `stand` - Stands with the current hand
* `double down` - Allows you to double your bet and take one additional card
* `split` - Splits a pair of like-valued cards into two hands
* `surrender` - Surrender half your bet and give up the game

If the dealer has an ace showing, you will be offered insurance and can either say `yes` to take
insurance or `no` to not take insurance.  In addition, you can interact with the skill with
these commands at any time:

* `read rules` - Reads the set of rules currently in play
* `change` - Changes one of the rules, for example, `change hit seventeen to on` will make the dealer hit soft 17
* `what should I do` - Provides a suggestion for the current hand based on Basic Strategy
* `repeat` - Repeats the hand and possible actions

Please feel free to reach out to me and let me know if you enjoy this game or encounter any issues!