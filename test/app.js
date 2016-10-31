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
playgame.PlayBlackjackAction(userID, (process.argv.length > 2) ? process.argv[2] : "stand", 100, PrintResults);
