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
           if (data.Items[i].mapAttr.M.adStamp) {
             entry.adplayed = true;
             entry.adplayedDate = new Date(parseInt(data.Items[i].mapAttr.M.adStamp.N));
           } else if (data.Items[i].mapAttr.M.adsPlayed) {
             const ads = data.Items[i].mapAttr.M.adsPlayed.M;
             let ad;

             entry.adsPlayed = {};
             for (ad in ads) {
               entry.adsPlayed[ad] = true;
             }
           }

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
  const tournament = {high: 0, spins: 0, players: 0};
  let spins;
  let oldFormat = 0;
  let adsPlayed = {};

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
          // Any ads played?
          if (data.Items[i].mapAttr && data.Items[i].mapAttr.M
                   && data.Items[i].mapAttr.M.adsPlayed
                   && data.Items[i].mapAttr.M.adsPlayed.M) {
            const ads = data.Items[i].mapAttr.M.adsPlayed.M;
            let ad;

            for (ad in ads) {
              if (adsPlayed[ad]) {
                adsPlayed[ad]++;
              } else {
                adsPlayed[ad] = 1;
              }
            }
          }

          if (data.Items[i].mapAttr && data.Items[i].mapAttr.M) {
            if (data.Items[i].mapAttr.M.highScore
                 && data.Items[i].mapAttr.M.highScore.M) {
              // This is the old format
              oldFormat++;

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
            } else {
              let scoreData;

              if (data.Items[i].mapAttr.M.american && data.Items[i].mapAttr.M.american.M) {
                // This is the new format
                scoreData = data.Items[i].mapAttr.M.american.M;

                if (scoreData.spins && scoreData.spins.N) {
                  spins = parseInt(scoreData.spins.N);
                  american.spins += spins;
                  if (spins) {
                    american.players++;
                  }
                  if (parseInt(scoreData.high.N) > american.high) {
                    american.high = parseInt(scoreData.high.N);
                  }
                }
              }

              if (data.Items[i].mapAttr.M.european && data.Items[i].mapAttr.M.european.M) {
                // This is the new format
                scoreData = data.Items[i].mapAttr.M.european.M;

                if (scoreData.spins && scoreData.spins.N) {
                  spins = parseInt(scoreData.spins.N);
                  european.spins += spins;
                  if (spins) {
                    european.players++;
                  }
                  if (parseInt(scoreData.high.N) > european.high) {
                    european.high = parseInt(scoreData.high.N);
                  }
                }
              }

              if (data.Items[i].mapAttr.M.tournament && data.Items[i].mapAttr.M.tournament.M) {
                // This is the new format
                scoreData = data.Items[i].mapAttr.M.tournament.M;

                if (scoreData.spins && scoreData.spins.N) {
                  spins = parseInt(scoreData.spins.N);
                  tournament.spins += spins;
                  if (spins) {
                    tournament.players++;
                  }
                  if (parseInt(scoreData.high.N) > tournament.high) {
                    tournament.high = parseInt(scoreData.high.N);
                  }
                }
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
    callback(null, oldFormat, adsPlayed, american, european, tournament);
  }).catch((err) => {
    console.log('Error scanning: ' + err);
    callback(err, 0, null, null, null);
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
    let newads = 0;
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

      csvString += (results[i].locale + ',' + results[i].numRounds);
      if (results[i].adplayedDate) {
        const datestring = (results[i].adplayedDate.getMonth()+1)  + "-" +
          results[i].adplayedDate.getDate() + "-" +
          results[i].adplayedDate.getFullYear() + " " +
          results[i].adplayedDate.getHours() + ":" +
          results[i].adplayedDate.getMinutes();

        csvString += (',' + datestring);
      }

      if (results[i].adsPlayed) {
        let ad;
        for (ad in results[i].adsPlayed) {
          newads++;
        }
      }

      csvString += '\r\n';
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
    console.log(newads + ' people have heard the new ads.');

    const fs = require('fs');
    fs.writeFile('summary.csv', csvString, (err) => {
      if (!err) {
        console.log('CSV file written');
      }
    });

    getRouletteData((err, oldFormat, adsPlayed, american, european, tournament) => {
      if (!err) {
        console.log('');
        console.log('On roulette, you have ' + american.players + ' people who have done ' + american.spins + ' total spins on an American wheel with a high score of ' + american.high + ' units.');
        console.log('On roulette, you have ' + european.players + ' people who have done ' + european.spins + ' total spins on a European wheel with a high score of ' + european.high + ' units.');
        console.log('On roulette, you have ' + tournament.players + ' people who have done ' + tournament.spins + ' total spins in the tournament with a high score of ' + tournament.high + ' units.');
        console.log('There are ' + oldFormat + ' people still using the old format.');
        if (adsPlayed) {
          let ad;

          text += '\r\nAds played - \r\n';
          for (ad in adsPlayed) {
            if (ad) {
              text += ('  ' + ad + ': ' + adsPlayed[ad] + '\r\n');
            }
          }
        }
      }
    });
  }
});

