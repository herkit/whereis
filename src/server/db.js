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
  var keys = Object.keys(o);
  keys.forEach(function(prop) {
    if (o.hasOwnProperty(prop))
    {
      var properties = prop.split(separator);
      var value = o[prop];
      current = result;
      /*
      [p4, p1]
      [p4, p1, p1, p1]
      [p4, p1, p1, p2]
      */
      for(var level = 0; level < properties.length; level++) {
        var property = properties[level];
        console.log(result)
        /*if (keys.indexOf(properties.slice(0, level + 1).join("_")) >= 0) // has a value at this level
        {
          console.log("found", properties.slice(level, 2).join("_"));
          property = properties.slice(level, 2).join("_");
          level++;
        }*/

        if (level < properties.length - 1) {
          current[property] = current[property] || {};
        } else {
          current[property] = value;
        }

        current = current[property];
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