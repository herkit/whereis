var config      = require('../../knexfile.js');  
var env         = 'development';  
var knex        = require('knex')(config[env]);

function flatten(o, prefix, separator) {
  separator = separator || '_';
  prefix = prefix ? prefix + separator : '';
  var result = {};
  var keys = Object.keys(o).forEach(function(prop) {
    if (o.hasOwnProperty(prop))
    {
      if (typeof o[prop] === "object") {
        result = Object.assign(result, flatten(o[prop], prefix + prop));
      } else {
        result[prefix + prop] = o[prop];
      }
    }    
  });
  return result;
}

function restructure(o, separator) {
  separator = separator || "_";
  var result = {};
  var keys = Object.keys(o).forEach(function(prop) {
    if (o.hasOwnProperty(prop))
    {
      var properties = prop.split(separator);
      var value = o[prop];
      current = result;
      for(var level = 0; level < properties.length; level++) {
        if (level < properties.length - 1) {
          current[properties[level]] = current[properties[level]] || {};
        } else {
          current[properties[level]] = value;
        }
        current = current[properties[level]];
      }
    }
  });
  return result;
}

function init() {
  return knex.migrate.latest([config]);
}

module.exports = knex;
module.exports.init = init;
module.exports.flatten = flatten;
module.exports.restructure = restructure;