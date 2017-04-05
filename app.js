var express = require('express');
var cfenv = require('cfenv');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('cookie-session');
var properties = require('properties');


var app = express();

// define locals
var moment = require('moment-timezone');
moment.tz.setDefault("Europe/Amsterdam");
app.locals.moment = moment;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/bc', express.static(path.join(__dirname, 'bower_components')));


// load local VCAP configuration and service credentials
var vcapLocal;

try {
  vcapLocal = require('./vcap-local.json');
  //console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }

const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}
const appEnv = cfenv.getAppEnv(appEnvOpts);
if (appEnv.services['cloudantNoSQLDB']) {
  // Load the Cloudant library.
  var Cloudant = require('cloudant');

  // Initialize database with credentials
  var cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);

  // Specify the users database
  global.userDb = cloudant.db.use('users');
  global.gatewayDb = cloudant.db.use('gateways');
  global.sensorDb = cloudant.db.use('sensors');
  global.allSensors = new Array();
}



properties.parse('./appClient.properties', {path: true}, function(err, cfg) {
  
  if (err) {
    console.error('A file named appClient.properties containing the application credentials from the IBM IoT Cloud is missing.');
    console.error('The file must contain the following properties: org, id, auth-key, auth-token.');
    throw e;
  }
        
  var config = {
    "org"   : cfg['org'],
    "id"    : cfg['id'],
    "domain": "internetofthings.ibmcloud.com",
    "auth-key" : cfg['auth-key'],
    "auth-token"  : cfg['auth-token']
  };
        
  var Client = require("ibmiotf");

  appClient = new Client.IotfApplication(config);
  appClient.connect();

  appClient.on("connect", function () {
    appClient.subscribeToDeviceEvents("sensortag");
    appClient.subscribeToDeviceStatus("gateway");
    appClient.subscribeToDeviceEvents("sensors-listed");
    console.log("client connected");
  });

  appClient.on("deviceEvent", function (deviceType, deviceId, eventType, format, payload) {
    if (deviceType == 'sensortag') {
      switch(eventType) {
        case 'gateway-updated':
          console.log('Gateway "' + deviceId + "' has been updated!");
          break;
        case 'gateway-rebooted':
          console.log('Gateway "' + deviceId + "' has been rebooted!");
          break;
        case 'sensors-listed':
          var obj = JSON.parse(payload);
          console.log('response list-sensors');
          var devices = JSON.parse(obj.devices);
          var deviceArray = [];
          for (var d in devices) {
            deviceArray.push(d);
          }
          
          global.sensorDb.find({ selector: {sensorId: { "$in": deviceArray }, gatewayId: deviceId }},
            function(err, sensors) {
              if (err)
                return false;

              sensors.docs.forEach(function(sensor) {
                sensorObj = sensor;
                sensorObj["_id"] = sensor._id;
                sensorObj["_rev"] = sensor._rev;
                sensorObj["lastLog"] = devices[sensor.sensorId];
                sensorObj["lastStatus"] = moment().unix();
                global.sensorDb.insert(sensorObj, function(err, body, header) {} );
                
              });
            }
          );

          return obj.devices;
          break;
      }
    }
    //console.log("Device Event from : "+deviceType+" : "+deviceId+" of event "+eventType+" with payload : "+payload);
  });



  appClient.on("deviceStatus", function (deviceType, deviceId, payload, topic) {
    var obj = JSON.parse(payload);
    //console.log("Device status from :: "+deviceType+" : "+deviceId+" is "+obj.Action+" with Close Code being "+obj.CloseCode+" and Reason being \""+obj.Reason+" "+obj.ClientAddr+"\"");

    if (deviceType == "gateway" && deviceId.length === 12) {
      global.gatewayDb.find({ selector: {gatewayId: deviceId }},
        function(err, gateways) {
          if (err)
            return false;

          var gatewayObj = {
            "gatewayId": deviceId,
            "action": obj.Action
          }
          
          //console.log(gateways.docs[0]);
          if (gateways.docs.length === 0){
            global.gatewayDb.insert(gatewayObj, function(err, body, header) {
              if (err) {
                return console.log('[gatewayDb.insert] ', err.message);
              }
            });
          } else if (gateways.docs.length === 1){
            gatewayObj["location"] = gateways.docs[0].location;
            gatewayObj["_id"] = gateways.docs[0]._id;
            gatewayObj["_rev"] = gateways.docs[0]._rev;
            global.gatewayDb.insert(gatewayObj, function(err, body, header) {} );
          }
          return true;
        }
      );
    }
  });

  global.appClient = appClient;
});


var passport = require('passport')
app.use(session({secret: 'mySecretKey',
  resave: true,
  saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

var routes = require('./routes/index')(passport);
var users = require('./routes/users');

var flash = require('connect-flash');
app.use(flash());

// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);



app.all('/exports/*', function(req, res, next) {
  if (req.isAuthenticated()) {
    next(); // allow the next route to run
  } else {
    // require the user to log in
    res.redirect("/login"); 
  }
})
app.use('/exports', express.static(path.join(__dirname, 'exports')));

app.use('/', routes);
app.use('/users', users);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
