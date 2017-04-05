var mongoose = require('mongoose');

var Log = mongoose.model('Log', 
  { 
    homeId: Number,
    deviceId: Number,
    name: String,
    service: String,
    variable: String,
    value: mongoose.Schema.Types.Mixed,
    valueString: String,
    timestamp: Date
  }
);

module.exports = Log;
