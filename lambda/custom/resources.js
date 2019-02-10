const fs = require('fs');

// For now, we only support en-US and en-GB
// Fallback only happens between these two for now
let data;
let en;
let gb;
data = fs.readFileSync(__dirname + '/resources/en.json', 'utf8');
if (data) {
  en = JSON.parse(data);
}

data = fs.readFileSync(__dirname + '/resources/en-GB.json', 'utf8');
if (data) {
  gb = JSON.parse(data);
}

const resources = {
  'en-US': {
    'translation': Object.assign({}, en),
  },
  'en-GB': {
    'translation': Object.assign({}, en, gb),
  },
};

const utils = (locale) => {
  let translation;
  if (resources[locale]) {
    translation = resources[locale].translation;
  } else {
    translation = resources['en-US'].translation;
  }

  return {
    strings: translation,
  };
};

module.exports = utils;
