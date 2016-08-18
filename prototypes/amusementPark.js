var express = require('express');
var app = express();
var http = require('http').Server(app);
// var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');
var mongo = require('mongodb'),
  Server = mongo.Server,
  Db = mongo.Db;
var server = new Server('localhost', 27017, {
  auto_reconnect: true
});


var mongoose = require('mongoose');
// var bluebird = require('bluebird');
var Schema = mongoose.Schema;

var request = require('request');
var i = 0;
setInterval(function() {
  request('http://192.xxxxx/auto.jpg').pipe(fs.createWriteStream('DCCam'+i+'.png'));
  i++;
}, 8000);
