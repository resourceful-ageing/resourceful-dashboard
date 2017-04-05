var express = require('express');
var router = express.Router();
var CloudantExport = require('../custom_modules/cloudant-export/CloudantExport');
var UtilTools = require('../custom_modules/Utils');
var utils = new UtilTools();
var moment = require('moment-timezone');


var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	

  if (req.isAuthenticated())
		return next();
  
  // if the user is not authenticated then redirect him to the login page
  req.session.returnTo = req.path; 
	
  res.redirect('/login');
}


module.exports = function(passport) {
  
  /* Handle Login POST */
  router.post('/login', passport.authenticate('login', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/config');
  });
  
  router.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/login');
  });
  
  router.post("/list-sensors", isAuthenticated, function(req, res, next) {
    appClient.publishDeviceCommand("gateway", req.body.gatewayId, "list-sensors", "json", {});
    console.log("request list-sensors");
    res.sendStatus(200);
  });
  
  router.post("/update-gateway", isAuthenticated, function(req, res, next) {
    appClient.publishDeviceCommand("gateway", req.body.gatewayId, "update-gateway", "json", {});
    console.log("send command update");
    return true;
  });
  
  router.post("/reboot-gateway", isAuthenticated, function(req, res, next) {
    appClient.publishDeviceCommand("gateway", req.body.gatewayId, "reboot-gateway", "json", {});
    console.log("send command reboot");
    return true;
  });
  
  router.get('/', isAuthenticated, function(req, res, next) {
    res.render('config', { 
      title: 'Dashboard',
      menuItem: 'Dashboard',
      user : req.user
    });
  });

  router.get('/config', isAuthenticated, function(req, res, next) {
    var renderData = {
      title: 'Config',
      menuItem: 'Config',
      user : req.user
    }
    res.render('config', renderData);
  });

  router.get('/login', function(req, res, next) {
    res.render('login', { title: 'Login' });
  });

  router.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/login');
  });
  
  router.get('/config/export', isAuthenticated, function(req, res, next) {
    res.redirect('/config');
  });

  router.post('/config/export', isAuthenticated, function(req, res, next) {
    var renderData = {
      title: 'Export',
      menuItem: 'Config',
      user : req.user,
      exportError: true,
      exportMessage: null,
      exportFiles: null
    }
    
    var query = [];
    var fromDate, tillDate;

    if (typeof req.body.datefrom !== 'undefined' && req.body.datefrom != '' && typeof req.body.datetill !== 'undefined' && req.body.datetill != '') {
      fromDate = utils.parseDateFromInput(req.body.datefrom, 'start');
      tillDate = utils.parseDateFromInput(req.body.datetill, 'end');
    
      var exportDays = utils.getDaysFromTill(fromDate, tillDate);
      var exportDatabases = exportDays.map(function(day) { return 'iotp_6tv4n6_default_' + day });
      var cloudantExport = new CloudantExport();

      cloudantExport.export(exportDatabases)
      .then(function(response) {
        renderData.exportError = false;
        renderData.exportMessage = response.message;
        renderData.exportFiles = response.files;
        res.render('export', renderData);
      }, function(error) {
        renderData.exportMessage = error;
        res.render('export', renderData);
      });
    } else {
      renderData.exportMessage = 'No dates selected';
      res.render('export', renderData);
    }
  });
  
  
  
  
  router.get('/api/gateways', isAuthenticated, function(req, res, next) {
    var gateways = [];
    var sensors  = [];
    
    if(!global.gatewayDb) {
      res.json(gateways);
      return;
    }
    
    global.sensorDb.list({ include_docs: true } , function(err, body) {
      if (!err) {
        body.rows.forEach(function(row) {
          sensors.push({
            'sensorId': row.doc.sensorId,
            'gatewayId': row.doc.gatewayId,
            'object': row.doc.object,
            'lastLog': row.doc.lastLog,
            'lastStatus': row.doc.lastStatus,
            'validDates': row.doc.validDates
          });
        });
        
        global.gatewayDb.list({ include_docs: true }, function(err, body) {
          if (!err) {
            body.rows.forEach(function(row) {
              if(row.doc.gatewayId)
                var gateway = {
                  'gatewayId': row.doc.gatewayId,
                  'action': row.doc.action,
                  'location': row.doc.location,
                  'sensors': sensors.filter(function (el) {
                    return (el.gatewayId === row.doc.gatewayId);
                  })
                }
                gateways.push(gateway);
            });
            
            gateways.sort((a, b) => a.location.localeCompare(b.location));
            res.json(gateways);
          }
        });
      }
    });
  });

  router.get('/api/gateways/:gateway/sensors', isAuthenticated, function(req, res, next) {
    var gatewayId = req.params.gateway;

    var sensors = [];
    if(!global.sensorDb) {
      res.json(sensors);
      return;
    }

    global.sensorDb.list({ include_docs: true }, function(err, body) {
      if (!err) {
        body.rows.forEach(function(row) {
          
          var validDate = row.doc.validDates.from <= moment().unix() && (row.doc.validDates.till >= moment().unix() || row.doc.validDates.till == '');
          if(row.doc.gatewayId == gatewayId && validDate)
            sensors.push({
              'sensorId': row.doc.sensorId,
              'gatewayId': row.doc.gatewayId,
              'object': row.doc.object,
              'lastLog': row.doc.lastLog,
              'lastStatus': row.doc.lastStatus,
              'validDates': row.doc.validDates
            });
        });
        res.json(sensors);
      }
    });
  });

  return router;
}