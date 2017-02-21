function logoPoweredBy(logofile, title) {
  return '<div style="font-size:0.9em; cursor: pointer;"> \
           <span style="font-size:0.8em; color:BLACK; cursor: hand; opacity: 0.6; filter: alpha(opacity=60); text-shadow: -2px 0 #FFF, 0 2px #FFF, 2px 0 #FFF, 0 -2px #FFF;">Powered by</span><br/> \
           <img src="img/' + logofile + '" title="' + title + '" style="height:24px; width: auto" /> \
           </div>';
}

if (!window.whereis) window.whereis = {};

whereis.me = 
{

};

whereis.poweredby = 
{
  flight: {
    _:  '<div style="font-size:0.9em; cursor: pointer;"> \
         <span style="font-size:0.8em; color:BLACK; cursor: hand; opacity: 0.6; filter: alpha(opacity=60); text-shadow: -2px 0 #FFF, 0 2px #FFF, 2px 0 #FFF, 0 -2px #FFF;">Powered by an airplane</span> \
         </div>',
    dy: logoPoweredBy('airline/dy.png', 'Norwegian Airlines'),
    sk: logoPoweredBy('airline/sk.svg', 'Scandinavian Airlines'),
    aa: logoPoweredBy('airline/aa.svg', 'American Airlines'),
    dl: logoPoweredBy('airline/dl.svg', 'Delta'),
    aa: logoPoweredBy('airline/ua.svg', 'United Airlines'),
    aa: logoPoweredBy('airline/wn.svg', 'Southwest Airlines'),
    aa: logoPoweredBy('airline/b6.svg', 'JetBlue')
  },
  tracking: {
    _:  
      '<div style="font-size:0.9em; cursor: pointer;"> \
      <span style="font-size:0.8em; color:BLACK; cursor: hand; opacity: 0.6; filter: alpha(opacity=60); text-shadow: -2px 0 #FFF, 0 2px #FFF, 2px 0 #FFF, 0 -2px #FFF;">Powered by</span><br/> \
      <img src="img/wherever.png" style="height:24px; width: auto" /> \
      </div>'
  }
};

whereis.mode =
{
  TRACKING: 'tracking',
  FLIGHT: 'flight'
};

whereis.tracking = 
{
  mode: undefined,
  data: {},
  mapFollow: true,
  flightsim: {}
};

whereis.icons =
{
  plain: {
    url: 'img/marker.svg',
    anchor: new google.maps.Point(11, 11) 
  },
  plane: {
    path: 'M 10.945622,2.481385 1.36797,-4.666594 c 0.0763,-1.097013 0.134112,-3.5471177 0.0946,-4.0021647 -0.331214,-3.8145713 -2.757313,-2.1834763 -2.787766,-0.48187 -0.0083,0.465402 -0.103486,2.8723787 -0.119007,4.4796237 L -10.96409,2.553154 -11,4.828486 -1.186748,0.42526 -0.866214,7.502771 -3.715272,9.511007 -3.740362,11 0.010472,9.995567 l 5.5e-4,0.0123 3.780595,0.979879 L 3.753497,9.499762 0.886917,7.512396 1.151698,0.432288 11,4.752978 Z',
    fillColor: 'red',
    fillOpacity: 1,
    scale: 1,
    strokeColor: 'red',
    strokeWeight: 0,
    rotation: 45
  },
  harley: {
    path: 'm 3.96082,-7.4082467 c 0,0 -0.05321,0.221689 -0.05664,0.328125 -0.0034,0.1064357 0.01341,0.2634649 0.06836,0.4179687 0.05493,0.1510725 0.441401,0.8808594 0.441401,0.8808594 l 0.0059,0.058594 c 0,0 -0.09356,-5.96e-5 -0.134764,0.013672 -0.04119,0.013732 -0.0541,0.066884 -0.07813,0.070312 -0.02403,0.0034 -0.124999,-0.021484 -0.124999,-0.021484 l -0.0059,-0.109375 c 0,0 -0.04189,-0.039002 -0.0625,-0.052734 -0.0206,-0.013732 -0.09262,-0.024923 -0.126952,-0.021484 -0.03433,0.0034 -0.177733,0.09375 -0.177733,0.09375 l -0.04883,0.3945312 -0.123046,-0.2890625 -0.07617,-0.00586 -0.0059,0.8769532 c 0,0 -0.104389,0.031657 -0.124999,0.048828 -0.0206,0.01717 -0.04102,0.076172 -0.04102,0.076172 0,0 -0.0541,-5.046e-4 -0.07813,-0.00391 -0.02404,-0.0034 -0.128183,-0.03125 -0.179685,-0.03125 -0.0515,0 -0.260523,0.1076505 -0.308591,0.1660157 -0.04807,0.058366 -0.04687,0.1816406 -0.04687,0.1816406 0,0 -0.04878,0.00586 -0.0625,0.00586 -0.01717,0 -0.161201,0.052076 -0.253903,0.089844 -0.0927,0.037768 -0.2884,0.1229236 -0.326168,0.1503906 -0.03777,0.030903 -0.05422,0.1130343 -0.05078,0.1679688 0.0034,0.054939 0.112623,0.1308594 0.150388,0.1308593 0.03777,0 0.101952,-0.00228 0.23242,-0.033203 0.130467,-0.030902 0.402339,-0.1621094 0.402339,-0.1621093 0,0 5.56e-4,0.08972 0.0039,0.1171874 0.0034,0.030903 0.03786,0.037588 0.08594,0.041016 0.04807,0.0034 0.132811,0 0.132811,0 l -0.002,0.058594 c 0,0 -0.03019,0.013672 -0.05078,0.013672 -0.0206,0 -0.07503,0.03947 -0.109374,0.056641 -0.03433,0.01717 -0.182936,0.093626 -0.220701,0.1210938 -0.03777,0.024037 -0.204953,0.1834092 -0.232419,0.2246093 -0.02404,0.041196 -0.05893,0.1512748 -0.08984,0.171875 -0.03091,0.020598 -0.08771,0.03125 -0.128905,0.03125 -0.04119,0 -0.105468,0.056641 -0.105468,0.056641 l -0.203122,0.00781 -0.0625,0.023437 c 0,0 -0.05513,-0.00251 -0.07227,0.021484 -0.01716,0.024036 -0.03711,0.1308594 -0.03711,0.1308594 0,0 -0.273946,0.1344554 -0.376948,0.203125 -0.103004,0.068671 -0.381843,0.2486832 -0.488276,0.3242188 -0.10644,0.075537 -0.363276,0.2753906 -0.363278,0.2753906 0,0 0.01367,-0.072614 0.01367,-0.1035156 0,-0.030903 -0.05094,-0.092211 -0.123045,-0.109375 -0.0721,-0.01717 -0.143564,-0.00545 -0.249997,0.025391 -0.106438,0.03433 -0.330689,0.1868815 -0.519526,0.324219 -0.188804,0.133905 -0.543353,0.271361 -0.673821,0.298828 -0.130469,0.03091 -0.591069,0.116243 -0.642571,0.109375 -0.05154,-0.0068 -0.54111,-0.20442 -0.626946,-0.242188 -0.08927,-0.03777 -0.560828,-0.151212 -0.605462,-0.185547 -0.04807,-0.03434 -0.09646,-0.1178855 -0.14453,-0.179687 -0.04807,-0.058366 -0.129665,-0.1126213 -0.177732,-0.1503906 -0.04807,-0.037768 -0.14453,-0.03711 -0.14453,-0.037109 0,0 -0.175779,-0.00782 -0.24609,0.015625 -0.04795,0.015983 -0.06136,0.018354 -0.08008,0.023437 -0.0144,0.00788 -0.02733,0.023437 -0.03711,0.023437 -0.02404,0 -0.06041,-0.042898 -0.08789,-0.056641 -0.02404,-0.013732 -0.08636,-0.017109 -0.103515,-0.013672 -0.01717,0.0034 -0.04036,-0.00676 -0.07813,-0.013672 -0.03777,-0.0034 -0.296872,-0.019531 -0.296872,-0.019531 0,0 0.0039,-0.05296 0.0039,-0.1113282 0,-0.058366 -0.06916,-0.2761274 -0.216795,-0.4375 -0.147629,-0.1613709 -0.364635,-0.2792356 -0.388667,-0.2929687 -0.02403,-0.013732 -0.102671,-0.021006 -0.181638,-0.017578 -0.07897,0.0034 -0.06162,-0.00717 -0.04102,-0.03125 0.0206,-0.020598 0.20193,-0.019531 0.249997,-0.019531 0.04807,0 0.134457,0.00754 0.203123,-0.050781 0.06867,-0.058366 0.04842,-0.2550158 0.03125,-0.3339844 -0.01705,-0.078939 -0.158471,-0.2754893 -0.28894,-0.3613239 -0.130469,-0.085837 -0.36128,-0.1852783 -0.587885,-0.3535156 -0.226603,-0.1682393 -0.508258,-0.5239493 -0.624993,-0.6269532 -0.116735,-0.1064358 -0.418353,-0.2853826 -0.548822,-0.34375 -0.130469,-0.058367 -0.267677,-0.058854 -0.353512,-0.00391 -0.08415,0.051783 -0.17641,0.2478428 -0.187498,0.2714844 l -0.01563,-0.00195 -0.01172,-0.025391 c 0,0 -0.0632,-0.00436 -0.124999,0.00586 -0.05837,0.013734 -0.115994,0.036929 -0.164061,0.078125 -0.04807,0.041196 -0.200512,0.2697564 -0.238279,0.328125 -0.03777,0.058366 -0.184762,0.1010256 -0.249997,0.1113281 -0.0618,0.013731 -0.376949,0.03125 -0.376949,0.03125 l -0.0039,0.03125 c 0,0 -0.07167,-0.00195 -0.0957,-0.00195 -0.02403,0 -0.123681,0.00575 -0.199215,0.019531 -0.07554,0.013732 -0.697259,0.1269531 -0.697259,0.1269532 0,0 -0.103864,-0.020945 -0.134764,-0.03125 -0.03434,-0.00682 -0.236078,-0.046348 -0.291012,-0.056641 -0.03434,-0.00682 -0.08528,-0.0029 -0.123046,0.00391 l -0.05664,-0.035156 c -0.0034,0 -0.07539,-0.014688 -0.140623,0.00586 -0.0618,0.020598 -0.259702,0.1098484 -0.273434,0.1132813 -0.01374,0.0034 -0.02344,0.05053 -0.02344,0.1054687 0,0.054939 0.03711,0.09375 0.03711,0.09375 0,0 6.3e-5,0.014559 -0.01367,0.035156 -0.01374,0.020598 -0.0138,0.055633 0.01367,0.0625 0.02403,0.00682 0.135975,0.015158 0.300778,0.011719 0.164802,-0.0034 0.128905,-0.046876 0.128905,-0.046875 l 0.109373,0.00391 0.01367,0.2675781 c 0,0 -0.109475,0.022839 -0.195311,0.046875 -0.08584,0.020599 -0.223104,0.062667 -0.339839,0.1347656 -0.113303,0.072109 -0.240232,0.3144531 -0.240232,0.3144531 l -0.150388,0.021484 v 0.1406149 l 0.08398,0.00391 v 0.095703 h -0.124999 l -0.08398,0.058594 -0.0098,0.00781 0.01367,0.2226563 0.06836,0.00586 0.08008,0.4160157 -0.02539,0.033203 c 0,0 0.07895,0.1137556 0.11328,0.1171875 0.03434,0.0034 0.126952,0.00781 0.126952,0.00781 0,0 -6.3e-5,0.095147 0.01367,0.21875 0.01374,0.123605 0.0625,0.240234 0.0625,0.240234 l 0.0625,0.01758 0.195311,0.402344 h 0.908193 c 0,0 -0.01653,0.117188 0.07617,0.117188 0.0927,0 0.437496,0.02148 0.437496,0.02148 l 0.572258,0.550781 0.01953,0.271485 0.103515,-0.01367 -0.05664,0.109375 c 0,0 -0.495902,0.0332 -0.537103,0.0332 -0.0412,0 -0.177732,0.0023 -0.177732,0.146484 0,0.144203 -0.0039,0.396485 -0.0039,0.396485 0,0 -0.0483,0.04911 -0.05859,0.09375 -0.01374,0.04807 -0.01858,0.165108 -0.01172,0.257812 0.0069,0.09271 0.177732,0.126953 0.177732,0.126953 0,0 -0.656057,1.301418 -0.697257,1.376954 -0.0412,0.07553 -0.03915,0.214843 0.08789,0.214843 0.127036,0 0.499994,0.0059 0.499994,0.0059 v 0.103515 c 0,0 -0.785557,-0.01563 -0.802725,-0.01563 -0.01717,0 -0.156782,0.267597 -0.146482,0.480469 0.0069,0.216307 0.07847,0.416016 0.109374,0.416016 0.0309,0 0.381676,0.01758 0.41601,0.01758 0.03434,0 0.116939,0.02344 0.171873,0.02344 0.05494,0 1.185534,0.01953 1.185534,0.01953 0.34334,0.923595 1.304925,1.589844 2.441379,1.589844 1.184522,0 2.178303,-0.724061 2.480442,-1.71289 l 0.349605,0.01758 c 0,0 -0.002,0.0522 -0.002,0.0625 0,0.01373 -0.03752,0.03019 -0.05469,0.05078 -0.01717,0.0206 -0.05488,0.05505 -0.01367,0.08594 0.0412,0.0309 0.142576,-0.06836 0.142576,-0.06836 0.0309,-0.01717 0.09375,-0.05859 0.09375,-0.05859 0,0 0.02288,0.242477 0.146483,0.28711 0.123603,0.04119 0.389078,-0.06055 0.406245,-0.06055 0.01717,0 0.0242,0.04194 0.07227,0.04883 0.04807,0.0034 0.04297,-0.08008 0.04297,-0.08008 h 0.193357 c 0,0 0.07362,0.09025 0.09766,0.107422 0.02404,0.01717 0.25871,0.149444 0.492182,0.142578 0.233472,-0.0068 1.273423,-0.06836 1.273423,-0.06836 0,0 3.222722,-0.0126 3.308558,-0.0332 0.08583,-0.0206 0.130076,0.03279 0.195311,0.01563 0.0618,-0.01717 0.198622,-0.111264 0.222653,-0.125 0.02404,-0.01373 0.09375,-0.05273 0.09375,-0.05273 0,0 0.02339,0.05118 0.03711,0.06836 0.01373,0.01717 0.131617,0.06765 0.179686,0.0059 0.04807,-0.05837 0.177732,-0.291016 0.177732,-0.291016 0,0 0.07504,-0.03309 0.109374,-0.06055 0.03433,-0.0309 0.0957,-0.128906 0.0957,-0.128906 L 5.009568,2.925827 c 0,0 -0.0689,0.435425 -0.05859,0.462891 0.0068,0.03091 0.127998,0.105408 0.220701,0.11914 0.09271,0.01717 0.599602,0.01173 0.599602,0.01172 l 0.0039,-0.002 C 6.224954,4.396537 7.159957,5 8.238044,5 c 1.51756,0 2.74997,-1.199404 2.74997,-2.675781 -0.0068,-0.695956 -0.280401,-1.331584 -0.732414,-1.808594 0.0064,0 0.258423,-5.75e-4 0.343746,-0.0039 0.08584,-0.0034 0.08524,-0.08617 0.02344,-0.144532 -0.05837,-0.05837 -0.69991,-0.54965 -0.761711,-0.583984 -0.05837,-0.03433 -0.787092,-0.414596 -1.439437,-0.404297 -0.652344,0.0068 -1.355454,0.220703 -1.355454,0.220703 l -0.42187,-0.773437 c 0,0 -6.3e-5,-0.03173 0.01367,-0.03516 0.01373,-0.0034 0.126764,0.03026 0.167967,0.03711 0.04119,0.0068 0.140971,0.0167 0.171873,0.0098 0.03433,-0.0034 0.103515,-0.0603 0.103514,-0.115235 0,-0.05494 -0.0087,-0.297574 -0.01563,-0.359375 -0.0034,-0.05837 -0.123045,-0.07617 -0.123045,-0.07617 l 0.0078,-0.167968 c 0,0 0.113506,-0.0034 0.171873,0 0.05837,0.0034 0.159436,-0.02474 0.210935,-0.0625 0.0515,-0.03777 0.07617,-0.1449432 0.07617,-0.1621099 0,-0.01717 0.182112,-0.2480813 0.185545,-0.6738281 0.0034,-0.4257453 -0.226559,-0.7636719 -0.226559,-0.7636719 0,0 0.05505,-0.1696125 0.08594,-0.2382812 0.0309,-0.068677 -0.03431,-0.1589017 -0.11328,-0.2207031 -0.07896,-0.061794 -0.710309,-0.4747123 -0.847647,-0.5605469 -0.140769,-0.085841 -0.882081,-0.5076268 -0.933583,-0.5488281 -0.0515,-0.041196 -0.249402,-0.3441613 -0.273434,-0.3613282 -0.02404,-0.01717 -0.09375,-0.035156 -0.09375,-0.035156 0,0 -0.0059,-0.053153 -0.0059,-0.070312 0,-0.01717 -0.03981,-0.075988 -0.08789,-0.1171875 -0.04807,-0.041196 -0.134765,-0.048828 -0.134765,-0.048828 z m -0.388667,2.4882812 v 0.1171875 c -0.0086,4.241e-4 -0.0293,0.00391 -0.0293,0.00391 0,0 -0.02802,-0.055574 -0.0039,-0.076172 0.0079,-0.00788 0.02031,-0.027321 0.0332,-0.044922 z m 0.529291,0.5292969 h 0.01172 c 2.56e-4,0.00132 0.0039,0.019531 0.0039,0.019531 0,0 -0.01248,-0.01347 -0.01563,-0.019531 z m 2.335912,4.2714841 c 0.0029,-5.83e-4 0.01172,0 0.01172,0 l -0.0098,0.0625 c 0,0 -0.0019,0.0019 -0.002,0.002 z',
    fillColor: 'salmon',
    fillOpacity: 1,
    scale: 1,
    strokeColor: 'black',
    strokeWeight: 1,
    rotation: 0
  },
  motorcycle: {
    path: 'M19.44 9.03L15.41 5H11v2h3.59l2 2H5c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.46 0 4.45-1.69 4.9-4h1.65l2.77-2.77c-.21.54-.32 1.14-.32 1.77 0 2.8 2.2 5 5 5s5-2.2 5-5c0-2.65-1.97-4.77-4.56-4.97zM7.82 15C7.4 16.15 6.28 17 5 17c-1.63 0-3-1.37-3-3s1.37-3 3-3c1.28 0 2.4.85 2.82 2H5v2h2.82zM19 17c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
    fillColor: 'salmon',
    fillOpacity: 1,
    scale: 1,
    strokeColor: 'black',
    strokeWeight: 1,
    rotation: 0
  }
};

var onflight = false;
var trackingPath;
var positions = [];
var locationDiv;
var setMapFollowButton;
var socket;

function initialize() {
  whereis.tracking.mode = whereis.mode.TRACKING;
  google.maps.visualRefresh = true;
  var isMobile = (navigator.userAgent.toLowerCase().indexOf('android') > -1) ||
    (navigator.userAgent.match(/(iPod|iPhone|iPad|BlackBerry|Windows Phone|iemobile)/));
  if (isMobile) {
    var viewport = document.querySelector("meta[name=viewport]");
    viewport.setAttribute('content', 'initial-scale=1.0, user-scalable=no');
  }
  var mapDiv = document.getElementById('whereis-mapCanvas');

  window.whereis.map = new google.maps.Map(mapDiv, {
    center: new google.maps.LatLng(28.538336, -81.379234),
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false,
    styles: whereis.mapstyle
  });

  whereis.map.addListener('dragend', mapManuallyChanged);
  whereis.map.addListener('click', mapManuallyChanged);

  locationDiv = document.getElementById('currentLocation');
  setMapFollowButton = document.getElementById('setMapFollowButton');

  socket = io.connect();

  socket.on('track', function(track) {
    console.log(track);
    var latlng = { lat: track.geo.latitude, lng: track.geo.longitude };
    var latlon = new LatLon(track.geo.latitude, track.geo.longitude);

    positions.push(latlon);

    if (track.address) {
      var parts = [
        track.address.settlement, 
        track.address.district, 
        track.address.address, 
        track.address.state_long || track.address.state, 
        track.address.country_long || track.address.country
      ];

      if (track.speed)
        if (track.speed.kmh) parts.push(track.speed.kmh.toFixed(1) + 'km/h');


      setLocationData(parts);
    }

    if (whereis.tracking.mode == whereis.mode.TRACKING) {
      var accuracy = track.gps != undefined && track.gps.accuracy != undefined ? track.gps.accuracy : 5;
      if (accuracy < 20)
        setMyPosition(latlng, whereis.icons.plain);
      else 
        setInaccuratePosition(latlng, track.gps.accuracy);
      if (positions.length >= 2) {
        var trackingPathCoordinates = positions.slice(-20).map(function(position) { return { lat: position.lat, lng: position.lon }});
        if(!trackingPath) {
          trackingPath = new google.maps.Polyline({
            path: trackingPathCoordinates,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 0.75,
            strokeWeight: 4
          });
          trackingPath.setMap(whereis.map);
        } else {
          trackingPath.setPath(trackingPathCoordinates);
        }
      }
    }

    showPoweredBy();
  });
}

function setInaccuratePosition(latlng, accuracy) {
  if (whereis.me.marker !== undefined) whereis.me.marker.setMap(null);
  if (trackingPath !== undefined) trackingPath.setMap(null);

  if (!whereis.me.inaccuratemarker) {
    whereis.me.inaccuratemarker = new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      center: latlng,
      map: whereis.map,
      radius: accuracy
    });
  } else {
    whereis.me.inaccuratemarker.setCenter(latlng);
    whereis.me.inaccuratemarker.setRadius(accuracy);
    whereis.me.inaccuratemarker.setMap(whereis.map);
  }
  if (whereis.tracking.mapFollow)
    whereis.map.setCenter(latlng);
}

function mapManuallyChanged() {
  setMapFollow(false);
}

function setMyPosition(latlng, icon) {
  if (whereis.me.inaccuratemarker && whereis.me.inaccuratemarker.map)
  {
    whereis.me.inaccuratemarker.setMap(null);
  }
  if (!whereis.me.marker) {
    whereis.me.marker = new google.maps.Marker({ 
      icon: icon,
      position: latlng, 
      animation: google.maps.Animation.DROP,
      map: whereis.map
    });
  }
  if (!whereis.me.marker.map) {
    whereis.me.marker.setMap(whereis.map)
  }
  if (icon && whereis.me.marker.icon !== icon) {
    whereis.me.marker.setIcon(icon);
  }
  whereis.me.marker.setPosition(latlng);
  if (whereis.tracking.mapFollow)
    whereis.map.setCenter(latlng);
}

function setMapFollow(follow) {
  whereis.tracking.mapFollow = follow;
  if (follow)
  {
    if (whereis.me.marker)
      whereis.map.setCenter(whereis.me.marker.position);
    else if (whereis.me.inaccuratemarker)
      whereis.map.setCenter(whereis.me.inaccuratemarker.center);
    setMapFollowButton.style.display = "none";
  } 
  else 
  {
    setMapFollowButton.style.display = "inline";
  }
}

function setLocationData(locationdata) {
  var parts = locationdata.filter(function(item) { return (item !== undefined && item !== null); })
  var html = '<h1>' + parts.shift() + '</h1>';
  if(parts.length > 0) {
    html = html + parts.map(function(part) { return '<span class="sub">' + part + '</span>'; }).join("");
  }
  locationDiv.innerHTML = html;
}

function zoomToObject(obj){
    var bounds = new google.maps.LatLngBounds();
    var points = obj.getPath().getArray();
    for (var n = 0; n < points.length ; n++){
        bounds.extend(points[n]);
    }
    whereis.map.fitBounds(bounds);
    whereis.tracking.mapFollow = false;
}

google.maps.event.addDomListener(window, 'load', initialize);

function showPoweredBy() {
  credits = document.getElementById('poweredby');

  small_credits = '';
  if (whereis.tracking.mode === whereis.mode.TRACKING) {
    small_credits = whereis.poweredby.tracking._;  
  } else if (whereis.tracking.mode === whereis.mode.FLIGHT) {
    small_credits = whereis.poweredby.flight._;
    if (whereis.tracking.flightsim.flightdata.airline.code) {
      var airlinecode = whereis.tracking.flightsim.flightdata.airline.code.toLowerCase();
      if (whereis.poweredby.flight[airlinecode]) {
        small_credits = whereis.poweredby.flight[airlinecode];
      }
    }
  }

  credits.innerHTML = small_credits;
  credits.style.fontSize = '1em';
}