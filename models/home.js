var mongoose = require('mongoose');

var Home = mongoose.model('Home', 
  { 
    homeId: Number,
    name: String,
    macAddress: String,
    data: Object,
    startDate: Date,
    endDate: Date,
    state: String
  }
);

module.exports = Home;