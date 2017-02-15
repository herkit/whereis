var Promise = require('bluebird'),
    request = require('request'),
    debug = require('debug')('whereis:iatacodes'),
    _ = require('lodash');

class IC {
  constructor(api_key = 'YOUR-API-KEY', version = 6) {
      this.api_key = api_key;
      this.url = `https://iatacodes.org/api/v${version}/`;
  }
  api(method='ping', params={}, callback) {
    debug('iatacodes api params', _.extend({api_key: this.api_key}, params));
    return new Promise((resolve, reject) => {
      request.post({
          url : `${this.url}${method}.json`,
          form : _.extend({api_key: this.api_key}, params)
      }, function(err, _, body) {
          if(err) return reject(err);
          if (!body) return reject(new Error('Empty response'));
          var result = JSON.parse(body);
          if (!result.response) return reject(new Error('Empty response'));
          debug('response:', result.response);
          resolve(result.response);
      });
    })
  }
}

module.exports = IC;