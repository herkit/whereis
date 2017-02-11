module.exports.flatten = flatten;
module.exports.restructure = restructure;

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
  var last = result;
  var lastproperty;
  var keys = Object.keys(o);
  
  var paths = keys.filter(function(prop) {
    return o.hasOwnProperty(prop);
  }).map(function(prop) {
    return prop.split(separator).concat(o[prop]);
  })

  var getConflicts = function(paths, path) {
    return paths.filter(function(otherpart) {
      return (otherpart.length > path.length + 1 && 
              otherpart.
              slice(0, path.length).
              join(separator) 
              === 
              path.
              join(separator));
    })
  }

  paths.forEach(function(part) {
    var path = part.slice(0, part.length - 1);
    for (var conflicts = getConflicts(paths, path); conflicts.length > 0; conflicts = getConflicts(paths, path)) {
      conflicts.forEach(function(conflict) {
        var newprop = conflict[path.length - 1] + separator + conflict[path.length];
        conflict.splice(path.length - 1, 2, newprop);
      });
    }
  })

  paths.forEach(function(properties) {
    var value = properties.pop();
    current = result;
    for (var pidx = 0; pidx < properties.length; pidx++) {
      var property = properties[pidx];
      current[property] = current[property] || {};
      if (pidx == properties.length - 1)
        current[property] = value;
      else
        current = current[property];
    }
  });
  return result;
}