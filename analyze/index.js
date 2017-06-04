//
// Utility functions
//

'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

// Function to get all the entries from the Database
function getEntriesFromDB(callback) {
  const results = [];

  // Loop thru to read in all items from the DB
  (function loop(firstRun, startKey) {
   const params = {TableName: 'PlayBlackjack'};

   if (firstRun || startKey) {
     params.ExclusiveStartKey = startKey;

     const scanPromise = dynamodb.scan(params).promise();
     return scanPromise.then((data) => {
       let i;

       for (i = 0; i < data.Items.length; i++) {
         if (data.Items[i].mapAttr && data.Items[i].mapAttr.M) {
           const entry = {};

           entry.numRounds = parseInt(data.Items[i].mapAttr.M.numRounds.N);
           entry.locale = data.Items[i].mapAttr.M.playerLocale.S;
           entry.adplayed = (data.Items[i].mapAttr.M.adStamp != undefined);
           results.push(entry);
         }
       }

       if (data.LastEvaluatedKey) {
         return loop(false, data.LastEvaluatedKey);
       }
     });
   }
  })(true, null).then(() => {
    callback(null, results);
  }).catch((err) => {
    console.log('Error scanning: ' + err);
    callback(err, null);
  });
}

// Let's look at Roulette too while we're at it
function getRouletteData(callback) {
  const american = {high: 0, spins: 0, players: 0};
  const european = {high: 0, spins: 0, players: 0};
  let spins;

  // Loop thru to read in all items from the DB
  (function loop(firstRun, startKey) {
   const params = {TableName: 'RouletteWheel'};

   if (firstRun || startKey) {
     params.ExclusiveStartKey = startKey;

     const scanPromise = dynamodb.scan(params).promise();
     return scanPromise.then((data) => {
       // OK, let's see where you rank among American and European players
       let i;

       for (i = 0; i < data.Items.length; i++) {
         if (data.Items[i].mapAttr && data.Items[i].mapAttr.M
           && data.Items[i].mapAttr.M.highScore
           && data.Items[i].mapAttr.M.highScore.M) {
          // Only counts if they spinned
          const score = data.Items[i].mapAttr.M.highScore.M;
          if (score.spinsAmerican && score.spinsAmerican.N) {
            spins = parseInt(score.spinsAmerican.N);
            american.spins += spins;
            if (spins) {
              american.players++;
            }
            if (parseInt(score.highAmerican.N) > american.high) {
              american.high = parseInt(score.highAmerican.N);
            }
          }

          if (score.spinsEuropean && score.spinsEuropean.N) {
            spins = parseInt(score.spinsEuropean.N);
            european.spins += spins;
            if (spins) {
              european.players++;
            }
            if (parseInt(score.highEuropean.N) > european.high) {
              european.high = parseInt(score.highEuropean.N);
            }
          }
         }
       }

       if (data.LastEvaluatedKey) {
         return loop(false, data.LastEvaluatedKey);
       }
     });
   }
  })(true, null).then(() => {
    callback(null, american, european);
  }).catch((err) => {
    console.log('Error scanning: ' + err);
    callback(err, null, null);
  });
}

// Spit out some interesting stats
getEntriesFromDB((err, results) => {
  if (results) {
    let totalRounds = 0;
    let maxRounds = 0;
    let multiplePlays = 0;
    let i;
    const players = {};
    let csvString = '';
    let ads = 0;
    let text;

    for (i = 0; i < results.length; i++) {
      if (players[results[i].locale]) {
        players[results[i].locale]++;
      } else {
        players[results[i].locale] = 1;
      }

      totalRounds += results[i].numRounds;
      if (results[i].numRounds > maxRounds) {
        maxRounds = results[i].numRounds;
      }
      if (results[i].numRounds > 1) {
        multiplePlays++;
      }

      if (results[i].adplayed) {
        ads++;
      }

      csvString += (results[i].locale + ',' + results[i].numRounds + '\r\n');
    }

    text = 'There are ' + results.length + ' registered players: ';
    text += (players['en-US'] ? players['en-US'] : 'no') + ' American, ';
    text += (players['en-GB'] ? players['en-GB'] : 'no') + ' English, ';
    text += 'and ' + (players['de-DE'] ? players['de-DE'] : 'no') + ' German.';
    console.log(text);

    console.log('There have been a total of ' + totalRounds + ' rounds played.');
    text = multiplePlays + ' people have played more than one round. ' + maxRounds + ' is the most rounds played by one person.';
    console.log(text);

    console.log(ads + ' people have heard your ad.');

    const fs = require('fs');
    fs.writeFile('summary.csv', csvString, (err) => {
      if (!err) {
        console.log('CSV file written');
      }
    });

    getRouletteData((err, american, european) => {
      if (!err) {
        console.log('');
        console.log('On roulette, you have ' + american.players + ' people who have done ' + american.spins + ' total spins on an American wheel with a high score of ' + american.high + ' units.');
        console.log('On roulette, you have ' + european.players + ' people who have done ' + european.spins + ' total spins on a European wheel with a high score of ' + european.high + ' units.');
      }
    });
  }
});

