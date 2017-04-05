var moment = require('moment-timezone');

function Utils(){

}

Utils.prototype.getDaysFromTill = function(fromDate, tillDate){
  var dateArray = [];
  var currentDate = moment(fromDate);
  var tillDate = moment(tillDate);
  while (currentDate <= tillDate) {
      dateArray.push( moment(currentDate).format('YYYY-MM-DD') )
      currentDate = moment(currentDate).add(1, 'days');
  }
  return dateArray;
};

Utils.prototype.parseDateFromInput = function(s, day) {
  var b = s.split(/\D/);
  var date = new Date(b[0], --b[1], b[2]);
  
  day = typeof day === 'undefined' ? false : day;
  if (day == 'start') {
    date.setHours(0,0,0,0);
  } else if (day == 'end') {
    date.setHours(23,59,59,999);
  }
  
  return date.getTime();
}


module.exports = Utils;
