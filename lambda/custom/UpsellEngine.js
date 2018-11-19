//
// Manages upsells for the skill - recommending an upsell
// and recording information that will be used to make future
// upsell suggestions
//
// This skill defines four trigger points:
//  1. Launch
//  2. After playing a certain number of hands in the session
//  3. After getting a 5-card winning 21
//  4. When asking to select a new game
//
// Versions for analysis:
//  v1.0 (not set) - upsell on launch every 2 days, upsell on long21 after 48 hours,
//                   always on select
//  v1.1 - adds sold field, no upsell on launch, upsell on long21 after 24 hours,
//                   after 6 rounds every two days
//

'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

module.exports = {
  getUpsell: function(attributes, trigger) {
    let directive;
    const now = Date.now();

    if (!attributes.paid || !attributes.paid.spanish
      || (attributes.paid.spanish.state !== 'AVAILABLE')) {
      // It's not available
      return;
    }

    // Reserved for our usage
    if (!attributes.upsell) {
      attributes.upsell = {};
      attributes.upsell.prompts = {};
    }
    if (!attributes.upsell[trigger]) {
      attributes.upsell[trigger] = {};
    }

    // Clear legacy prompts structure
    if (attributes.prompts) {
      attributes.prompts.spanish = undefined;
      attributes.prompts.long21 = undefined;
      attributes.prompts.sellSpanish = undefined;
    }

    // Since we are called on launch, this
    // will help us see the full session length
    if (!attributes.upsell.start) {
      attributes.upsell.start = now;
      attributes.upsell.sessions = (attributes.upsell.sessions + 1) || 1;
    }

    attributes.upsell[trigger].trigger = now;
    attributes.upsell[trigger].count = (attributes.upsell[trigger].count + 1) || 1;
    if (shouldUpsell(attributes, trigger, now)) {
      attributes.upsell[trigger].impression = now;
      attributes.upsell.prompts[trigger] = now;
      directive = {
        'type': 'Connections.SendRequest',
        'name': 'Upsell',
        'payload': {
          'InSkillProduct': {
            productId: attributes.paid.spanish.productId,
          },
          'upsellMessage': selectUpsellMessage(attributes, trigger.toUpperCase() + '_SPANISH_UPSELL'),
        },
      };
    }

    return directive;
  },
  saveSession: function(handlerInput) {
    // Is this a "natural" end to the session or an upsell?
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const response = handlerInput.responseBuilder.getResponse();
    const now = Date.now();
    let upsell = false;
    let promise;

    // Save if they can but haven't purchased Spanish 21
    if ((attributes.paid && attributes.paid.spanish
      && (attributes.paid.spanish.state === 'AVAILABLE'))
      || (attributes.upsell && attributes.upsell.endOnUpsell)) {
      if (response.directives) {
        response.directives.forEach((directive) => {
          if ((directive.type === 'Connections.SendRequest') &&
            ((directive.name === 'Upsell') || (directive.name === 'Buy'))) {
            upsell = true;
            attributes.upsell.endOnUpsell = true;
          }
        });
      }

      // If it wasn't an upsell, save and reset session details
      // otherwise, persist as if it were part of the same session
      if (!upsell) {
        // Save session closing information
        if (!attributes.upsell) {
          attributes.upsell = {};
        }
        attributes.upsell.end = now;
        attributes.upsell.sold = (attributes.paid && attributes.paid.spanish
          && (attributes.paid.spanish.state === 'PURCHASED'));

        // Save to S3 - if we are saving data
        if (process.env.SNSTOPIC) {
          const params = {
            Body: JSON.stringify(attributes.upsell),
            Bucket: 'garrett-alexa-upsell',
            Key: 'blackjack/' + handlerInput.requestEnvelope.session.user.userId
              + '/' + Date.now() + '.txt',
          };
          promise = s3.putObject(params).promise();
        }

        // Clear everything except the prompts data
        const prompts = JSON.parse(JSON.stringify(attributes.upsell.prompts));
        const sessions = attributes.upsell.sessions;
        attributes.upsell = {};
        attributes.upsell.prompts = prompts;
        attributes.upsell.sessions = sessions;
        attributes.upsell.lastSession = now;
      }
    }

    if (!promise) {
      promise = Promise.resolve();
    }
    return promise;
  },
};

// The message is hardcoded
function selectUpsellMessage(attributes, message) {
  let selection;

  // Store upsell messages locally
  // These aren't localized outside of en-US anyway
  const upsellMessages = {
    'LAUNCH_SPANISH_UPSELL': 'Hello, welcome to Blackjack Game. We now have Spanish 21 available for purchase. Want to learn more?|Hi, welcome to Blackjack Game. We\'re proud to introduce a new way to play blackjack with Spanish 21! Want to hear more about it?|Welcome back to Blackjack Game. We have the popular blackjack variant Spanish 21 available for purchase. Want to learn more?',
    'LONG21_SPANISH_UPSELL': 'You got a 21 with five or more cards on your last hand. We have Spanish 21 available for purchase where that pays extra. Would you like to hear more?|Good job getting 21 the hard way. With Spanish 21 that would have paid extra. Would you like to hear more about it?|Getting 21 with that many cards isn\'t easy. In Spanish 21, that pays extra. Are you interested in hearing more about this game?',
    'SELECT_SPANISH_UPSELL': 'You\'ve played standard Blackjack, you can now get the Spanish 21 expansion pack. Want to learn more?|Would you like to hear more about the Spanish 21 expansion pack available for purchase?|We have a Spanish 21 game available for purchase. Want to hear more?',
    'PLAY_SPANISH_UPSELL': 'Did you know we have a Spanish 21 expansion pack? Want to learn more?|I\'m glad to see you\'re enjoying Blackjack Game. Would you like to hear about the Spanish 21 expansion pack I have available for purchase?|By the way, we also have a Spanish 21 game available for purchase. Want to hear more?',
    'LISTPURCHASES_SPANISH_UPSELL': 'You don\'t have any products purchased, but we have Spanish 21 available. Want to learn more?|You haven\'t purchased any products, but we have a Spanish 21 expansion pack available for purchase. Would you like to hear more?|You haven\'t bought any products yet, but we have Spanish 21 available for purchase. Want to hear more?',
  };

  const options = upsellMessages[message].split('|');
  selection = Math.floor(Math.random() * options.length);
  if (selection === options.length) {
    selection--;
  }
  attributes.upsellSelection = 'v' + (selection + 1);
  return options[selection];
}

function shouldUpsell(attributes, trigger, now) {
  let upsell = false;

  switch (trigger) {
    case 'launch':
      break;

    case 'long21':
      upsell = (!attributes.upsell.prompts.long21 ||
        ((now - attributes.upsell.prompts.long21) > 24*60*60*1000));
      break;

    case 'select':
      // Always upsell here
      upsell = true;
      break;

    case 'play':
      // Trigger if once they hit 6 hands - once every 2 days and not for the first session
      upsell = (attributes.upsell.sessions > 1) &&
        (attributes.upsell.play.count === 6) &&
        (!attributes.upsell.prompts.play ||
          ((now - attributes.upsell.prompts.play) > 2*24*60*60*1000));
      break;

    case 'listpurchases':
      // Always upsell
      upsell = true;
      break;

    default:
      // Unknown trigger
      break;
  }

  return upsell;
}
