var mongoose = require('mongoose');

var Sysinfo = mongoose.model('Sysinfo', 
  { 
    authServers: Object,
    deviceServers: Object,
    timestamp: Date
  }
);

module.exports = Sysinfo;
