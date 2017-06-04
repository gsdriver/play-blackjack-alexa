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

// Spit out some interesting stats
getEntriesFromDB((err, results) => {
  if (results) {
    let totalRounds = 0;
    let maxRounds = 0;
    let i;
    const players = {};
    let csvString = '';

    console.log(JSON.stringify(results));
    console.log('There are ' + results.length + ' registered players.');
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

      csvString += (results[i].locale + ',' + results[i].numRounds + '\r\n');
    }

    console.log('There are ' + players['en-US'] + ' American players');
    console.log('There are ' + players['en-GB'] + ' English players');
    console.log('There are ' + players['de-DE'] + ' German players');

    console.log('There has been a total of ' + totalRounds + ' rounds played.');
    console.log('The most rounds played by one person is ' + maxRounds);

    const fs = require('fs');
    fs.writeFile('summary.csv', csvString, (err) => {
      console.log('Written');
    });
  }
});

