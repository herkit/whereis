whereis.richinfo = { 
  states:
    [ 
      { 'short': 'AL', 'long': 'Alabama' },
      { 'short': 'AZ', 'long': 'Arizona' },
      { 'short': 'AR', 'long': 'Arkansas' },
      { 'short': 'CA', 'long': 'California' },
      { 'short': 'CO', 'long': 'Colorado' },
      { 'short': 'CT', 'long': 'Connecticut' },
      { 'short': 'DE', 'long': 'Delaware' },
      { 'short': 'FL', 'long': 'Florida' },
      { 'short': 'GA', 'long': 'Georgia' },
      { 'short': 'ID', 'long': 'Idaho' },
      { 'short': 'IL', 'long': 'Illinois' },
      { 'short': 'IN', 'long': 'Indiana' },
      { 'short': 'IA', 'long': 'Iowa' },
      { 'short': 'KS', 'long': 'Kansas' },
      { 'short': 'KY', 'long': 'Kentucky' },
      { 'short': 'LA', 'long': 'Louisiana' },
      { 'short': 'ME', 'long': 'Maine' },
      { 'short': 'MD', 'long': 'Maryland' },
      { 'short': 'MA', 'long': 'Massachusetts' },
      { 'short': 'MI', 'long': 'Michigan' },
      { 'short': 'MN', 'long': 'Minnesota' },
      { 'short': 'MS', 'long': 'Mississippi' },
      { 'short': 'MO', 'long': 'Missouri' },
      { 'short': 'MT', 'long': 'Montana' },
      { 'short': 'NE', 'long': 'Nebraska' },
      { 'short': 'NV', 'long': 'Nevada' },
      { 'short': 'NH', 'long': 'New Hampshire' },
      { 'short': 'NJ', 'long': 'New Jersey' },
      { 'short': 'NM', 'long': 'New Mexico' },
      { 'short': 'NY', 'long': 'New York' },
      { 'short': 'NC', 'long': 'North Carolina' },
      { 'short': 'ND', 'long': 'North Dakota' },
      { 'short': 'OH', 'long': 'Ohio' },
      { 'short': 'OK', 'long': 'Oklahoma' },
      { 'short': 'OR', 'long': 'Oregon' },
      { 'short': 'PA', 'long': 'Pennsylvania' },
      { 'short': 'RI', 'long': 'Rhode Island' },
      { 'short': 'SC', 'long': 'South Carolina' },
      { 'short': 'SD', 'long': 'South Dakota' },
      { 'short': 'TN', 'long': 'Tennessee' },
      { 'short': 'TX', 'long': 'Texas' },
      { 'short': 'UT', 'long': 'Utah' },
      { 'short': 'VT', 'long': 'Vermont' },
      { 'short': 'VA', 'long': 'Virginia' },
      { 'short': 'WA', 'long': 'Washington' },
      { 'short': 'WV', 'long': 'West Virginia' },
      { 'short': 'WI', 'long': 'Wisconsin' },
      { 'short': 'WY', 'long': 'Wyoming' }
    ],
  visited: [],
  initialize: function(pane) {
    var pane = document.getElementById('quickInfo');
    var state = new whereis.richinfo.StateMap();
    state.setPane(pane);
    var dayview = new whereis.richinfo.DayView(1492646280, 1507161480);
    dayview.setPane(pane);
  },
  StateMap: function() {
    var self = this;
    self.container = document.createElement('div');
    self.container.className = 'wi-statemap wi-quickinfo-container';
    self._pane = null;
    var header = document.createElement('h2');
    header.innerText='States visited so far';
    self.container.appendChild(header);

    $.ajax('api/statesvisited').done(function(data) {
      whereis.richinfo.visited = data.map(function(state) { return state.state; });
      whereis.richinfo.states.forEach(function(state) {
        var stateDiv = document.createElement('div');
        stateDiv.innerText = state.short;
        stateDiv.id = 'wi-state-' + state.short;
        stateDiv.title = state.long;
        stateDiv.className = 'wi-state';
        if (whereis.richinfo.visited.indexOf(state.short) >= 0) {
          stateDiv.className += ' wi-visited'
        }
        self.container.appendChild(stateDiv);
      })
    });
    self.setPane = function(pane) {
      if (pane) {
        self._pane = pane;
        pane.appendChild(self.container);
      } else {
        if (self._pane)
          self._pane.removeChild(self.container);
        self._pane = null;
      }
    }
  },
  DayView: function(tripstart, tripend) {
    var self = this;
    self.container = document.createElement('div');
    self.container.className = 'wi-dayview wi-quickinfo-container';
    self._pane = null;
    var now = Date.getUtcTimestamp();

    self.display = document.createElement('div');

    function update() {
      var day = Math.floor((now - tripstart) / 86400);
      var totaldays = Math.ceil((tripend - tripstart) / 86400);
      self.display.innerText = "Day " + day + " / " + totaldays;
      setTimeout(update, 10000);
    };

    update();

    self.container.appendChild(self.display);

    self.setPane = function(pane) {
      if (pane) {
        self._pane = pane;
        pane.appendChild(self.container);
      } else {
        if (self._pane)
          self._pane.removeChild(self.container);
        self._pane = null;
      }
    }
  }
}

