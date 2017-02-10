var winston = require('winston');

var logger = new (winston.Logger)({
  level: 'debug',
  transports: [
    new (winston.transports.Console)({
      timestamp: function() {
        return new Date().toUTCString();
      },
      formatter: function(options) {
        // Return string will be passed to logger. 
        return options.timestamp() +' '+ options.level.toUpperCase() +' '+ (options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
      }
    })
  ]
});

module.exports = logger;