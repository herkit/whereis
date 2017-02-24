var Parser = function(pattern, input) {
  var p = this;
  p._match = input.match(pattern);
  p.fullmatch = p._match.shift();

  p.next = function() {
    return p._match.shift();
  }

  p.nextInt = function(radix) {
    radix = radix || 10;
    return parseInt(p.next(), radix);
  }

  p.nextFloat = function() {
    return parseFloat(p.next());
  }

  p.hasNext = function() {
    return (p._match.length > 0);
  }

  p.nextCoordinate = function(format) {
    var coordinate = 0, hemisphere = null;
    
    switch(format) {
      case CoordinateFormat.DEG_DEG:
        coordinate = parseFloat(p.next() + '.' + p.next());
        break;
      case CoordinateFormat.DEG_HEM:
        coordinate = p.nextFloat();
        hemisphere = p.next();
        break;        
      case CoordinateFormat.DEG_MIN_MIN:
        coordinate = p.nextInt();
        coordinate += parseFloat(p.next() + '.' + p.next()) / 60;
        break;        
      case CoordinateFormat.DEG_MIN_MIN_HEM:
        coordinate = p.nextInt();
        coordinate += parseFloat(p.next() + '.' + p.next()) / 60;
        hemisphere = p.next();
        break;
      case CoordinateFormat.HEM_DEG:
        hemisphere = p.next();
        coordinate = p.nextFloat();
        break;          
      case CoordinateFormat.HEM_DEG_MIN:
        hemisphere = p.next();
        coordinate = p.nextInt();
        coordinate += p.nextFloat() / 60;
        break;          
      case CoordinateFormat.HEM_DEG_MIN_HEM:
        hemisphere = p.next();
        coordinate = p.nextInt();
        coordinate += p.nextFloat() / 60;
        if (p.hasNext())
          hemisphere = p.next();
        break;
      case CoordinateFormat.HEM_DEG_MIN_MIN:
        hemisphere = p.next();
        coordinate = p.nextInt();
        coordinate += parseFloat(p.next() + '.' + p.next()) / 60;
        break;
      default:
        coordinate = p.nextInt();
        coordinate += p.nextFloat() / 60;
        hemisphere = p.next();
    }

    if (hemisphere !== null && (hemisphere === "S" || hemisphere === "W" || hemisphere === "-"))
      coordinate = -Math.abs(coordinate)

    return coordinate;
  }
}

var CoordinateFormat = {
  DEG_DEG: 1,
  DEG_HEM: 2,
  DEG_MIN_MIN: 3,
  DEG_MIN_HEM: 4,
  DEG_MIN_MIN_HEM: 5,
  HEM_DEG_MIN_MIN: 6,
  HEM_DEG: 7,
  HEM_DEG_MIN: 8,
  HEM_DEG_MIN_HEM: 9
}

module.exports = Parser;
module.exports.Parser = Parser;
module.exports.CoordinateFormat = CoordinateFormat;