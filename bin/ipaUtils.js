#!/usr/bin/env
var fs = require('fs-extra');
var AdmZip = require('adm-zip');
var strftime = require('strftime');
var splist = require('simple-plist')
var path = require('path');
var base64 = require('base64-url');

function itemInfoWithName(ipAddress, port, name, ipasDir) {
  var location = ipasDir + '/' + name + '.ipa';
  var stat = fs.statSync(location);
  var time = new Date(stat.mtime);
  var timeString = strftime('%F %H:%M', time);
  var bundleId;
  var versionStr;
  
  var iconString = '';
  var ipa = new AdmZip(location);
  var ipaEntries = ipa.getEntries();
  var tempP =  ipasDir + 'temp.plist';
  try {
    ipaEntries.forEach(function(ipaEntry) {
      var entryName = ipaEntry.entryName;
      if (ipaEntry.entryName.indexOf('AppIcon60x60') != -1) {
        var buffer = Buffer.from(ipaEntry.getData());
        if (buffer.length) {
          iconString = 'data:image/png;base64,' + buffer.toString('base64');
        }
      }else if (entryName.split('/').length === 3 && entryName.split('/')[2] === 'Info.plist') { //ensure the Info.plist is the Payload/<AppName>.app/Info.plist
        var buffer = Buffer.from(ipaEntry.getData());
        fs.writeFileSync(tempP, buffer)
        var list = splist.readFileSync(tempP);
        bundleId = list["CFBundleIdentifier"];
        // var shortVer = list["CFBundleShortVersionString"];
        var bundleVer = list["CFBundleVersion"];
        versionStr = bundleVer.toString()
        console.log('bundleId:' + bundleId + " version:" + versionStr);
      }
    });
  } catch (e) {
    if (e) {
      console.log('error:'+e.toString());
    }
  }
  fs.removeSync(tempP);
  return {
    encodedData: (base64.encode(name + "&" + ipasDir + "&" + bundleId + "&" + versionStr)),
    name: name.split('.')[0],
    version: versionStr,
    time: time,
    timeString: timeString,
    iconString: iconString,
    ip: ipAddress,
    port: port,
  }
}

function ipasInLocation(location) {
  var result = [];
  var files = fs.readdirSync(location);
  for (var i in files) {
    if (path.extname(files[i]) === ".ipa") {
      result.push(path.basename(files[i], '.ipa'));
    }
  }
  return result;
}

function base64_encode(file) {
  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return Buffer.from(bitmap).toString('base64');
}

module.exports = {
  itemInfoWithName:itemInfoWithName,
  ipasInLocation:ipasInLocation
}