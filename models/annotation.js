var mongoose = require('mongoose');

var Annotation = mongoose.model('Annotation', 
  { 
    homeId: Number,
    deviceId: Number,
    comment: String,
    value: String,
    timestamp: Date
  }
);

module.exports = Annotation;
