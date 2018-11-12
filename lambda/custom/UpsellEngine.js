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
    // Since we are called on launch, this
    // will help us see the full session length
    if (!attributes.upsell.start) {
      attributes.upsell.start = now;
    }

    switch (trigger) {
      case 'launch':
        // We will trigger if this is not a new user
        // and we haven't played this upsell in the past 48 hours
        attributes.upsell.launch.trigger = now;
        attributes.upsell.launch.count = (attributes.upsell.launch.count + 1) || 1;
        if (!attributes.newUser &&
          (!attributes.upsell.prompts.launch ||
            ((now - attributes.upsell.prompts.launch) > 2*24*60*60*1000))) {
          attributes.upsell.launch.impression = now;
          attributes.upsell.prompts.launch = now;
          directive = {
            'type': 'Connections.SendRequest',
            'name': 'Upsell',
            'payload': {
              'InSkillProduct': {
                productId: attributes.paid.spanish.productId,
              },
              'upsellMessage': selectUpsellMessage(attributes, 'LAUNCH_SPANISH_UPSELL'),
            },
          };
        }
        break;

      case 'long21':
        attributes.upsell.long21.trigger = now;
        attributes.upsell.long21.count = (attributes.upsell.long21.count + 1) || 1;
        if (!attributes.upsell.prompts.long21 ||
          ((now - attributes.upsell.prompts.long21) > 2*24*60*60*1000)) {
          attributes.upsell.long21.impression = now;
          attributes.upsell.prompts.long21 = now;
          directive = {
            'type': 'Connections.SendRequest',
            'name': 'Upsell',
            'payload': {
              'InSkillProduct': {
                productId: attributes.paid.spanish.productId,
              },
              'upsellMessage': selectUpsellMessage(attributes, 'LONG21_SPANISH_UPSELL'),
            },
          };
        }
        break;

      case 'select':
        // Always upsell here
        attributes.upsell.select.trigger = now;
        attributes.upsell.select.count = (attributes.upsell.select.count + 1) || 1;
        attributes.upsell.select.impression = now;
        attributes.upsell.prompts.select = now;
        directive = {
          'type': 'Connections.SendRequest',
          'name': 'Upsell',
          'payload': {
            'InSkillProduct': {
              productId: attributes.paid.spanish.productId,
            },
            'upsellMessage': selectUpsellMessage(attributes, 'SELECT_SPANISH_UPSELL'),
          },
        };
        break;

      case 'play':
        // Doesn't currently upsell
        attributes.upsell.play.trigger = now;
        attributes.upsell.play.count = (attributes.upsell.play.count + 1) || 1;
        break;

      default:
        // Unknown trigger
        break;
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
          if ((directive.type === 'Connections.SendRequest') && (directive.name === 'Upsell')) {
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
        attributes.upsell = {};
        attributes.upsell.prompts = prompts;
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
    'LAUNCH_SPANISH_UPSELL': 'We now have Spanish 21 available for purchase. Want to learn more?|We\'re proud to introduce a new way to play blackjack with Spanish 21! Want to hear more about it?|We have the popular blackjack variant Spanish 21 available for purchase. Want to learn more?',
    'LONG21_SPANISH_UPSELL': 'You got a 21 with five or more cards on your last hand. We have Spanish 21 available for purchase where that pays extra. Would you like to hear more?|Good job getting 21 the hard way. With Spanish 21 that would have paid extra. Would you like to hear more about it?|Getting 21 with that many cards isn\'t easy. In Spanish 21, that pays extra. Are you interested in hearing more about this game?',
    'SELECT_SPANISH_UPSELL': 'You\'ve played standard Blackjack, you can now get the Spanish 21 expansion pack. Want to learn more?|Would you like to hear more about the Spanish 21 expansion pack available for purchase?|We have a Spanish 21 game available for purchase. Want to hear more?',
    'PLAY_SPANISH_UPSELL': 'You\'ve enjoyed standard Blackjack, you can now get the Spanish 21 expansion pack. Want to learn more?|Would you like to hear more about the Spanish 21 expansion pack available for purchase?|We have a Spanish 21 game available for purchase. Want to hear more?',
  };

  const options = upsellMessages[message].split('|');
  selection = Math.floor(Math.random() * options.length);
  if (selection === options.length) {
    selection--;
  }
  attributes.upsellSelection = 'v' + (selection + 1);
  return options[selection];
}
