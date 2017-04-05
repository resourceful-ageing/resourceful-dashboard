var mongoose = require('mongoose');

var Errorlog = mongoose.model('Errorlog', 
  { 
    type: String,
    error: Object,
    timestamp: Date
  }
);

module.exports = Errorlog;
