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
//  5. When making a play that deviates from one of the "hard hands"
//  6. When someone plays a hand different than basic strategy (for goods upsell only)
//
// Versions for analysis:
//  v1.0 (not set) - upsell on launch every 2 days, upsell on long21 after 48 hours,
//                   always on select
//  v1.1 - adds sold field, no upsell on launch, upsell on long21 after 24 hours,
//                   after 6 rounds every two days
//  v1.2 - trigger Spanish upsell even for new players
//  v1.3 - add upsell for "hard hands"
//
// In addition, we have a separate version that's used for physical goods:
//  v1.0 - Beat the Dealer book
//

'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

// A list of goods that we sell - for now it's only the physical book, Beat the Dealer
const availableAsins = {
  beat_the_dealer: '0394703103',
};

module.exports = {
  initUpsell: function(attributes) {
    const now = Date.now();

    // See what's available
    const availableProducts = getAvailableProducts(attributes);
    if (!availableProducts.length) {
      // Nothing is available to sell
      return;
    }

    // Reserved for our usage
    if (!attributes.upsell) {
      attributes.upsell = {};
      attributes.upsell.prompts = {};
    }
    attributes.upsell.version = 'v1.3';

    // We should init the goods structure as well
    if (!attributes.goods) {
      attributes.goods = {};
      attributes.goods.prompts = {};
    }
    if (!attributes.purchasedGoods) {
      attributes.purchasedGoods = {};
    }
    attributes.goods.version = 'v1.0';

    // Clear legacy prompts structure
    if (attributes.prompts) {
      attributes.prompts.spanish = undefined;
      attributes.prompts.long21 = undefined;
      attributes.prompts.sellSpanish = undefined;
    }

    // Capture start time so we can see full session length
    if (!attributes.upsell.start) {
      attributes.upsell.start = now;
      attributes.upsell.sessions = (attributes.upsell.sessions + 1) || 1;
    }
  },
  getUpsell: function(attributes, trigger) {
    let directive;
    const now = Date.now();

    // See what's available
    const availableProducts = getAvailableProducts(attributes);
    if (!availableProducts.length) {
      // Nothing is available to sell
      return;
    }

    if (!attributes.upsell[trigger]) {
      attributes.upsell[trigger] = {};
    }

    attributes.upsell[trigger].trigger = now;
    attributes.upsell[trigger].count = (attributes.upsell[trigger].count + 1) || 1;
    const upsellProduct = shouldUpsell(attributes, availableProducts, trigger, now);
    if (upsellProduct) {
      attributes.upsell[trigger].impression = now;
      attributes.upsell.prompts[trigger] = now;
      directive = {
        'type': 'Connections.SendRequest',
        'name': 'Upsell',
        'payload': {
          'InSkillProduct': {
            productId: attributes.paid[upsellProduct].productId,
          },
          'upsellMessage': selectUpsellMessage(attributes, upsellProduct, trigger.toUpperCase() + '_UPSELL'),
        },
        'token': upsellProduct,
      };
    }

    return directive;
  },
  getGood: function(handlerInput, trigger) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const locale = handlerInput.requestEnvelope.request.locale;
    const now = Date.now();
    let good;

    // Check env var to see which markets support goods
    const locales = (process.env.GOODLOCALES || "").split(",");
    if (locales.indexOf(locale) === -1) {
      return;
    }

    attributes.goods[trigger] = attributes.goods[trigger] || {};
    attributes.goods[trigger].trigger = now;
    attributes.goods[trigger].count = (attributes.goods[trigger].count + 1) || 1;
    const upsellGood = shouldSellGood(attributes, trigger, now);
    if (upsellGood) {
      attributes.goods[trigger].impression = now;
      attributes.goods.prompts[trigger] = now;
      good = {
        good: upsellGood,
        asin: availableAsins[upsellGood],
        message: selectGoodsMessage(attributes, upsellGood, trigger.toUpperCase() + '_UPSELL'),
      }
    }

    return good;
  },
  saveSession: function(handlerInput) {
    // Is this a "natural" end to the session or an upsell?
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const response = handlerInput.responseBuilder.getResponse();
    const now = Date.now();
    let upsell = false;
    let promise;
    const availableProducts = getAvailableProducts(attributes);

    // Save if there are available products OR if we ended on upsell
    if (availableProducts.length
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
        attributes.upsell.sold = (attributes.upsell.availableProducts &&
          (availableProducts.length < attributes.upsell.availableProducts.length));
        attributes.upsell.availableProducts = undefined;

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
function selectUpsellMessage(attributes, upsellProduct, message) {
  let selection;

  // Store upsell messages locally
  // These aren't localized outside of en-US anyway
  const upsellMessages = {
    'LAUNCH_UPSELL': 'Hello, welcome to Blackjack Game. We now have {Product} available for purchase. Want to learn more?|Hi, welcome to Blackjack Game. We\'re proud to introduce a new way to play blackjack with {Product}! Want to hear more about it?|Welcome back to Blackjack Game. We have the popular blackjack variant {Product} available for purchase. Want to learn more?',
    'LONG21_UPSELL': 'You got a 21 with five or more cards on your last hand. We have {Product} available for purchase where that pays extra. Would you like to hear more?|Good job getting 21 the hard way. With {Product} that would have paid extra. Would you like to hear more about it?|Getting 21 with that many cards isn\'t easy. In {Product}, that pays extra. Are you interested in hearing more about this game?',
    'SELECT_UPSELL': 'You\'ve played standard Blackjack, you can now get the {Product} expansion pack. Want to learn more?|Would you like to hear more about the {Product} expansion pack available for purchase?|We have a {Product} game available for purchase. Want to hear more?',
    'PLAY_UPSELL': 'Did you know we have a {Product} expansion pack? Want to learn more?|I\'m glad to see you\'re enjoying Blackjack Game. Would you like to hear about the {Product} expansion pack I have available for purchase?|By the way, we also have a {Product} game available for purchase. Want to hear more?',
    'LISTPURCHASES_UPSELL': 'We have {Product} available. Want to learn more?|We have a {Product} expansion pack available for purchase. Would you like to hear more?|We have {Product} available for purchase. Want to hear more?',
    'HARDHAND_UPSELL': 'Most people play that previous hand improperly. We have a feature that lets you practice over 100 hands most people get wrong. Want to learn more?|That wasn\'t the best way to play that last hand. Most people play that one wrong. Would you like to hear about an advanced training mode I have that will help you perfect your game?|You know, most people play that last hand wrong. I have a list of hard hands that I can give you to help you train. Want to hear more?',
    'BUSTED_UPSELL': 'You are out of money. Your bankroll will reset tomorrow or you can get the {Product} subscription which will automatically reset your bankroll. Would you like to hear more?',
  };
  const productName = {
    'spanish': 'Spanish 21',
    'training': 'Advanced Training',
    'resetbankroll': 'Reset Bankroll',
  };

  const options = upsellMessages[message].split('|');
  selection = Math.floor(Math.random() * options.length);
  if (selection === options.length) {
    selection--;
  }
  attributes.upsellSelection = 'v' + (selection + 1);
  return options[selection].replace('{Product}', productName[upsellProduct]);
}

// The message is hardcoded
function selectGoodsMessage(attributes, good, message) {
  let selection;

  // Store upsell messages locally
  // These aren't localized outside of en-US anyway
  const upsellMessages = {
    'BADPLAY_UPSELL': 'Tough break on that last hand. Want a classic reference to learn how to play better blackjack? You can purchase {Product} from Amazon. {Disclaimer}. Want to learn more?|I\'m sorry for that loss. Improve your game by reading the classic book {Product}, available to purchase from Amazon! {Disclaimer}. Want to buy it?|If you\'re enjoying this game, try reading the book {Product} available from Amazon. {Disclaimer}. Would you like to buy this book?',
  };
  const productName = {
    'beat_the_dealer': 'Beat The Dealer',
  };
  const disclaimer = 'Blackjack Game earns from qualifying purchases that you make while using this skill';

  const options = upsellMessages[message].split('|');
  selection = Math.floor(Math.random() * options.length);
  if (selection === options.length) {
    selection--;
  }
  attributes.goodsSelection = 'v' + (selection + 1);
  return options[selection]
    .replace('{Product}', productName[good])
    .replace('{Disclaimer}', disclaimer);
}

function shouldUpsell(attributes, availableProducts, trigger, now) {
  let upsell;

  switch (trigger) {
    case 'launch':
      break;

    case 'busted':
      // Reset bankroll is always triggered if available
      if (availableProducts.indexOf('resetbankroll') > -1) {
        upsell = 'resetbankroll';
      }
      break;

    case 'long21':
      if (availableProducts.indexOf('spanish') > -1) {
        if (!attributes.upsell.prompts.long21 ||
          ((now - attributes.upsell.prompts.long21) > 24*60*60*1000)) {
          upsell = 'spanish';
        }
      }
      break;

    case 'select':
      // Always upsell Spanish 21 here
      if (availableProducts.indexOf('spanish') > -1) {
        upsell = 'spanish';
      }
      break;

    case 'play':
      // Trigger if once they hit 6 hands - once every 2 days and not for the first session
      if (availableProducts.indexOf('spanish') > -1) {
        if ((attributes.upsell.play.count === 6) &&
          (!attributes.upsell.prompts.play ||
            ((now - attributes.upsell.prompts.play) > 2*24*60*60*1000))) {
          upsell = 'spanish';
        }
      }
      break;

    case 'listpurchases':
      // Always upsell what's available
      upsell = availableProducts[0];
      break;

    case 'hardhand':
      // Upsell advanced training, once a day
      if (availableProducts.indexOf('training') > -1) {
        if (!attributes.upsell.prompts.hardhand ||
          ((now - attributes.upsell.prompts.hardhand) > 24*60*60*1000)) {
          upsell = 'training';
        }
      }
      break;

    default:
      // Unknown trigger
      break;
  }

  return upsell;
}

function shouldSellGood(attributes, trigger, now) {
  let upsell;

  // Filter any goods that they have already bought
  const availableGoods = Object.keys(availableAsins).filter((g) => !attributes.purchasedGoods[g]);

  switch (trigger) {
    case 'badplay':
      // Had a bad hand? We'll offer the Beat The Dealer book
      // This will only be offered once a week
      if (availableGoods.indexOf('beat_the_dealer') > -1) {
        if (!attributes.goods.prompts.badplay ||
          ((now - attributes.goods.prompts.badplay) > 7*24*60*60*1000)) {
          upsell = 'beat_the_dealer';
        }
      }
      break;

    default:
      // Unknown trigger
      break;
  }

  return upsell;
}

function getAvailableProducts(attributes) {
  const products = [];

  if (attributes.paid) {
    Object.keys(attributes.paid).forEach((item) => {
      if (attributes.paid[item].state === 'AVAILABLE') {
        products.push(item);
      }
    });
  }

  // If Spanish is in the list, it should be first
  const idx = products.indexOf('spanish');
  if (idx > 0) {
    const swap = products[0];
    products[0] = 'spanish';
    products[idx] = swap;
  }

  return products;
}
