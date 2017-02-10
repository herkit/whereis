var GoogleMapsAPI = require('googlemaps'),
    debug = require('debug')('whereis:geocode:google'),
    cache = require('../geoloccache');

var publicConfig = {
  key: process.env.GOOGLE_MAPS_API_KEY,
  stagger_time:       1000, // for elevationPath 
  encode_polylines:   false,
  secure:             true // use https 
};

var gmAPI = new GoogleMapsAPI(publicConfig);

var shortNameTranslation = {
  "street_number": "house",
  "route": "street",
  "locality": "settlement",
  "administrative_area_level_2": "district",
  "administrative_area_level_1": "state",
  "country": "country",
  "postal_code": "postcode"
};

var longNameTranslation = {
  "administrative_area_level_2": "district_long",
  "administrative_area_level_1": "state_long",
  "country": "country_long",
};

module.exports.reverseGeo = function(latlng, callback) {
  var reverseGeocodeParams = {
    "latlng":        latlng.lat.toString() + "," + latlng.lng.toString(),
    "language":      "en",
    "location_type": "APPROXIMATE"
  }; 
  cache.get(latlng, function(err, address) {
    if (err) {
      debug('looking up reverse geo code');
      gmAPI.reverseGeocode(reverseGeocodeParams, function(err, data){
        if (err)
          callback(err);
        else {
          var result = data.results[0];
          if (result)
          {
            var address = 
              result.
              address_components.
              reduce(function(out, component) 
              {
                component.types.forEach(function(type) {
                  if (shortNameTranslation[type]) {
                    out[shortNameTranslation[type]] = component.short_name;
                  }
                  if (longNameTranslation[type]) {
                    out[longNameTranslation[type]] = component.long_name;
                  }
                });
                return out;
              }, 
              {});
              cache.add(latlng, address);
              callback(null, address);
          } else {
            err = new Error ('No location found');
            err.reason = err.message;
            err.request = reverseGeocodeParams;
            callback(err);
          }     
        }
      })      
    } else {
      debug('found address in cache');
      callback(null, address);
    }

  })
;
}