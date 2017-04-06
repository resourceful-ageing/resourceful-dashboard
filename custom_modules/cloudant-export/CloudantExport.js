var Cloudant = require('cloudant'),
    Promise = require("bluebird"),
    fs = Promise.promisifyAll(require("fs")),
    dateFormat = require('dateformat');

function CloudantExport(databases){
  this.folder = 'exports';
  this.databases = [];
}

CloudantExport.prototype.export = function(databases){
  this.databases = databases;

  var controller = this;
  return new Promise(function(resolve, reject) {
    controller.getCloudantCredentials().bind(controller)
    .then(controller.listDatabases)
    .then(controller.downloadAllDatabases)
    .then(function(result) {
        resolve(result);
    })
    .catch(function(error) {
      reject(error);
    });
  });
};

CloudantExport.prototype.getCloudantCredentials = function() {
    return new Promise(function(resolve, reject) {
        fs.readFileAsync('.cloudant').then(function(data) {
            resolve(JSON.parse(data));
        }, function(err) {
            switch (err.code) {
                case 'ENOENT':
                    reject(Error('.cloudant credentials not found'));
                    break;
            }
        });
    });
};

// Obtain a list of databases, filter these by --db [db1,db2...] arg
CloudantExport.prototype.listDatabases = function(creds) {
    var controller = this;
    return new Promise(function(resolve, reject) {
        Cloudant({
            account: creds.username,
            password: creds.password
        }, function(err, cloudant) {
            if (err) {
                return reject(Error('Failed to connect to Cloudant using credentials ' + JSON.stringify(creds)));
            }

            cloudant.db.list(function(err, dbList) {
                if (err) {
                    return reject(Error('Failed to list databases'));
                }
                
                if (controller.databases) {
                    dbList = dbList.filter(function(db) {
                        return controller.databases.indexOf(db) !== -1;
                    });
                }

                if (dbList.length === 0) {
                    return reject(Error('Database(s) not found'));
                }

                resolve({
                    cloudant: cloudant,
                    dbList: dbList
                });
            });
        });
    });
};

// Loop through list of databases and get all documents
// save documents as [database].json
CloudantExport.prototype.downloadDatabase = function(cloudant, dbName) {
  var controller = this;
    return new Promise(function(resolve, reject) {
      
      var sensors = {};
      var sensorsDB = cloudant.use('sensors');
      sensorsDB.list({
          include_docs: true
      }, function(err, body) {
        for (var s in body.rows) {
          sensors[body.rows[s].doc.sensorId] = body.rows[s].doc.gatewayId;
        }
        
        var logsDB = cloudant.use(dbName);
        logsDB.list({
          include_docs: true
        }, function(err, body) {
          if (err) {
              return reject(Error('Failed to list documents'));
          }

          try {
              fs.statSync(controller.folder);
          } catch (e) {
              fs.mkdirSync(controller.folder);
          }
          
          var items = '';
          for (var i in body.rows) {
            var item = body.rows[i].doc;            
            homeId = typeof(sensors[item.deviceId]) !== 'undefined' ? sensors[item.deviceId] : '';
            
            if (item.eventType == 'air') {
              for (var d in body.rows[i].doc.data.d) {
                items += '{"homeId": "'+homeId+'", "deviceId": "'+item.deviceId+'", "event": "'+d+'", "timestamp": "'+item.timestamp+'", "data": {';
                items += '"'+d+'": "'+body.rows[i].doc.data.d[d]+'"';
                items += '}}\r\n';
              }
            } else {
              items += '{"homeId": "'+homeId+'", "deviceId": "'+item.deviceId+'", "event": "'+item.eventType+'", "timestamp": "'+item.timestamp+'", "data": {';
              var count = 0;
              if (typeof(body.rows[i].doc.data) !== 'undefined' && typeof(body.rows[i].doc.data.d) !== 'undefined') {
                var totalProps = Object.keys(body.rows[i].doc.data.d).length;
                for (var d in body.rows[i].doc.data.d) {
                  count++;
                  items += '"'+d+'": "'+body.rows[i].doc.data.d[d]+'"';
                  if (count < totalProps) {
                    items += ', ';
                  }
                }
              }
              items += '}}\r\n';
            }
          }
          fs.writeFileAsync(controller.folder + '/' + dbName + '.txt', items).then(resolve, reject);
        });
      });
    });
};

CloudantExport.prototype.downloadAllDatabases = function(opts) {
  var controller = this;
    return new Promise(function(resolve, reject) {

        var backups = [];
        opts.dbList.forEach(function(dbName) {
          backups.push(controller.downloadDatabase(opts.cloudant, dbName));
        });

        Promise.all(backups).then(function() {
            resolve({ message: dateFormat('isoDateTime') + ': Successfully backed up databases: ' + opts.dbList.join(','), files: opts.dbList});
        }, function(err) {
            reject(err);
        });

    });
};

module.exports = CloudantExport;