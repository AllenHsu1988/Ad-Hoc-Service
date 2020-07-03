#!/usr/bin/env
var fs = require('fs-extra');
var path = require('path');
var mustache = require('mustache');
var base64 = require('base64-url');
var ipaUtil = require('./ipaUtils');

var responseListCache;

function ipaListInDir(ipAddress, port, ipasDir, callback) {
    if(responseListCache != null) {
        callback(responseListCache)
        return;
      }
  
      fs.readFile(path.join(__dirname, '..', 'templates') + '/main.html', function(err, data) {
        if (err)
          throw err;
        var template = data.toString();
  
        var files = fs.readdirSync(ipasDir);

        var items = [];
        files.forEach(function (file, index) {
            var subDir = path.join(ipasDir, file);
            var stat = fs.statSync(subDir);
            if(stat.isDirectory()) {
                var ipas = ipaUtil.ipasInLocation(subDir);
                if(ipas.length > 0) {
                    var ipasAry = [];
                    for (var i = ipas.length - 1; i >= 0; i--) {
                        ipasAry.push(ipaUtil.itemInfoWithName(ipAddress, port, ipas[i], subDir));
                    }
    
                    ipasAry = ipasAry.sort(function(a, b) {
                        var result = b.time.getTime() - a.time.getTime();
                        return result;
                      });
    
                    items.push({
                        appName:file,
                        ipas:ipasAry
                    })
                }
            }
        });
        var info = {};
        info.ip = ipAddress;
        info.port = port;
        info.items = items;
        var rendered = mustache.render(template, info);
        responseListCache = rendered;
        callback(responseListCache)
      })
}

function ipaList(ipAddress, port, ipasDir, callback) {
    if(responseListCache != null) {
        callback(responseListCache)
        return;
      }
  
      fs.readFile(path.join(__dirname, '..', 'templates') + '/main.html', function(err, data) {
        if (err)
          throw err;
        var template = data.toString();
  
        var ipas = ipaUtil.ipasInLocation(ipasDir);
  
        var items = [];
        for (var i = ipas.length - 1; i >= 0; i--) {
          items.push(ipaUtil.itemInfoWithName(ipAddress, port, ipas[i], ipasDir));
        }
  
        items = items.sort(function(a, b) {
          var result = b.time.getTime() - a.time.getTime();
          return result;
        });
  
        var info = {};
        info.ip = ipAddress;
        info.port = port;
        info.items = items;
        var rendered = mustache.render(template, info);
        responseListCache = rendered;
        callback(responseListCache)
      })
}

function plist(ipAddress, port, payload, callback) {
    fs.readFile(path.join(__dirname, '..', 'templates') + '/plist_template.plist', function(err, data) {
        if (err)
          throw err;
        var template = data.toString();

        var name = payload.split('&')[0];
        var filePath = payload.split('&')[1];
        var bundleId = payload.split('&')[2];
        var verStr = payload.split('&')[3];
        // console.log('Name:' + name + ' filePath:' + filePath + ' bundleId:' + bundleId + ' bundleVersion:' + verStr);
        var rendered = mustache.render(template, {
          encodedName: base64.encode(path.join(filePath, name)),
          name: name,
          bundleId: bundleId,
          bundleVer: verStr,
          ip: ipAddress,
          port: port,
        });
        callback(rendered);
      })
}

function ipaFile(req, res) {
    var encodedName = req.params.ipa.replace('.ipa', '');
    var ipaPath = base64.decode(encodedName) + '.ipa';
    // This line opens the file as a readable stream
    var readStream = fs.createReadStream(ipaPath);

    // This will wait until we know the readable stream is actually valid before piping
    readStream.on('open', function() {
      // This just pipes the read stream to the response object (which goes to the client)
      readStream.pipe(res);
    });

    // This catches any errors that happen while creating the readable stream (usually invalid names)
    readStream.on('error', function(err) {
      res.end(err);
    });
}

function refreshList(ipAddress, port, ipasDir, callback) {
    responseListCache = null;
    ipaListInDir(ipAddress, port, ipasDir, function(rendered){
        callback(true)
    });
}

module.exports = {
    ipaListInDir:ipaListInDir,
    refreshList:refreshList,
    ipaFile:ipaFile,
    ipaList:ipaList,
    plist:plist,
}