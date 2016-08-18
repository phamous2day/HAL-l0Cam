
//this script store images to mongod
var mongoose = require('mongoose');
var request = require('request');
var mongoCreds = require('./mongo_creds.json'); mongoose.connect('mongodb://' + mongoCreds.username + ':' + mongoCreds.password + '@ds023674.mlab.com:23674/phamous-db');
var conn = mongoose.connection;
// var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');


//Capture for metadata
var Image = mongoose.model('Image', {
  data: Buffer,
  timestamp: { type: Date, default: Date.now }
});


//this chunk captures the image, no need for pipe because that's to stream data as binary. I nested the var bufs as a way to tell data to transfer in bits and pieces then reassemble on the receiving end
setInterval(function(){
  var stream =request('http://192.168.1.112/tmpfs/auto.jpg');
  console.log("Hello DCCAM");
  var bufs = [];
  stream.on('data', function(d){ bufs.push(d); });
  stream.on('end', function(){
    var buf = Buffer.concat(bufs);
    var image = new Image();
    image.data = buf;
    image.save();
  });
},5000);
