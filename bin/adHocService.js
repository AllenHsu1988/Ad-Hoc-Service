#!/usr/bin/env node
var fs = require('fs-extra');//file system
var https = require('https');
var path = require('path');
var exit = process.exit;
var pkg = require('../package.json');
var version = pkg.version;
var program = require('commander');
var express = require('express');
var underscore = require('underscore');
var osHomedir = require('os-homedir');
var base64 = require('base64-url');
var router = require('./router');
require('shelljs/global');

/**
 * Main program.
 */
process.exit = exit

// CLI

before(program, 'outputHelp', function() {
  this.allowUnknownOption();
});

program
  .version(version)
  .usage('[option] [dir]')
  .option('-p, --port <port-number>', 'set port for server (defaults is 1234)')
  .option('-i, --ip <ip-address>', 'set ip address for server (defaults is automatic getting by program)')
  .parse(process.argv);

var ipAddress = program.ip || underscore
  .chain(require('os').networkInterfaces())
  .values()
  .flatten()
  .find(function(iface) {
    return iface.family === 'IPv4' && iface.internal === false;
  })
  .value()
  .address;



var globalCerFolder = osHomedir() + '/.pg-ipa-service/' + ipAddress;
var port = program.port || 1234;
var port2 = port + 1;

if (!exit.exited) {
  main();
}

/**
 * Install a before function; AOP.
 */

function before(obj, method, fn) {
  var old = obj[method];

  obj[method] = function() {
    fn.call(this);
    old.apply(this, arguments);
  };
}

function main() {
  var downloadURL = 'https://' + ipAddress + ':' + port;
  var cerURL = 'http://' + ipAddress + ':' + port2 + '/cer';
  console.log('\033[0;33m----------------------------------------------\n');
  console.log('CA certification location ' + globalCerFolder + '\n');
  console.log('Install CA certification ' + cerURL + '\n');
  console.log('----------------------------------------------\033[0;0m\n\n');
  console.log('\033[0;32m----------------------------------------------\n');
  console.log('\033[0;32m Open download page ' + downloadURL + '\n');
  console.log('----------------------------------------------\033[0;0m\n');

  var destinationPath = program.args.shift() || '.';
  var ipasDir = destinationPath;

  var httpsOptions = checkCertificationExist();


  var cerApp = express();
  cerApp.get('/cer', function(req, res) {
    fs.readFile(globalCerFolder + '/myCA.cer', function(err, data) {
      if (err)
        throw err;
      res.setHeader('Content-disposition', 'attachment; filename=myCA.cer');
      res.setHeader('Content-type', 'application/pkix-cert');
      res.send(data);
    });
  });
  cerApp.listen(port2);

  var app = express();
  app.use('/public', express.static(path.join(__dirname, '..', 'public')));
  app.use('/cer', express.static(globalCerFolder));
  app.get('/ipa/:ipa', function(req, res) {
    router.ipaFile(req, res);
  });

  app.get(['/', '/ipa'], function(req, res, next) {
    router.ipaListInDir(ipAddress, port, ipasDir, function(rendered){
      res.send(rendered);
    });
    // router.ipaList(ipAddress, port, ipasDir, function(rendered){
    //   res.send(rendered);
    // });
  });

  app.get('/plist/:file', function(req, res) {
    var encodedData = req.params.file;
    var data = base64.decode(encodedData);
    router.plist(ipAddress, port, data, function (rendered){
      res.set('Content-Type', 'text/plain; charset=utf-8');
      res.send(rendered);
    });
  });

  app.get('/refresh', function(req, res) {
    console.log('refresh list');
    router.refreshList(ipAddress, port, ipasDir, function(){
      res.set('Content-Type', 'text/plain; charset=utf-8');
      res.send('Refresh Completed');
    });
  });

  https.createServer(httpsOptions, app).listen(port);

}

function checkCertificationExist() {
  var key;
  var cert;

  try {
    key = fs.readFileSync(globalCerFolder + '/mycert1.key', 'utf8');
    cert = fs.readFileSync(globalCerFolder + '/mycert1.cer', 'utf8');
  } catch (e) {
    console.log('https certification not found, generating new certification...')
    var result = exec('sh  ' + path.join(__dirname, '..', 'generate-certificate.sh') + ' ' + ipAddress).output;
    key = fs.readFileSync(globalCerFolder + '/mycert1.key', 'utf8');
    cert = fs.readFileSync(globalCerFolder + '/mycert1.cer', 'utf8');
  }

  var options = {
    key: key,
    cert: cert
  };
  return options;
}