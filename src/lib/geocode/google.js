var GoogleMapsAPI = require('googlemaps');

var publicConfig = {
  key: process.env.GOOGLE_MAPS_API_KEY,
  stagger_time:       1000, // for elevationPath 
  encode_polylines:   false,
  secure:             true // use https 
};

var gmAPI = new GoogleMapsAPI(publicConfig);

var propertyTranslations = {
  "street_number": "house",
  "route": "street",
  "locality": "settlement",
  "administrative_area_level_2": "district",
  "administrative_area_level_1": "state",
  "country": "country",
  "postal_code": "postCode"
};

module.exports.reverseGeo = function(latlng, callback) {
  var reverseGeocodeParams = {
    "latlng":        latlng.lat.toString() + "," + latlng.lng.toString(),
    "language":      "en",
    "location_type": "APPROXIMATE"
  }; 
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
              if (propertyTranslations[type]) {
                out[propertyTranslations[type]] = component.short_name;
                out[propertyTranslations[type] + "_long"] = component.long_name;
              }
            });
            return out;
          }, 
          {});
          callback(null, address);
      } else {
        err = new Error ('No location found');
        err.reason = err.message;
        err.request = reverseGeocodeParams;
        callback(err);
      }     
    }
  });
}