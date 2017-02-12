var provider = require('./google');

module.exports.geocode = provider.geocode;
module.exports.reverseGeo = provider.reverseGeo;
module.exports.setProvider = function(provider) {
  provider = require('./' + provider);
}