var provider = require('./google');

module.exports.reverseGeo = provider.reverseGeo;
module.exports.setProvider = function(provider) {
  provider = require('./' + provider);
}