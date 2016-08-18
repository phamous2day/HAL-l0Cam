var express = require('express');
var mongoose = require('mongoose');
var mongoCreds = require('./mongo_creds.json');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://' + mongoCreds.username + ':' + mongoCreds.password + '@ds023674.mlab.com:23674/phamous-db');
var conn = mongoose.connection;
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
app.use(express.static('public'));
app.use(bodyParser.json());

var CaptureImages;

//Capture metadata
var Image = mongoose.model('Image', {
  data: Buffer,
  timestamp: { type: Date, default: Date.now }
});

//getImage function
app.get('/images', function(request, response, next) {
  Image.find({}, {timestamp: 1, _id: 0})
  .then(function(images) {

    justTimestamps = images.map(function(image) {
      return {
        timestamp: image.timestamp,
      };
    });

    response.json(justTimestamps);
  })
  .catch(next);
});


//recordImage function
app.post('/recordImages', function(request, response, next) {
  CaptureImages = setInterval(function(){
    var record = require('request');
    var stream = record('http://192.168.1.112/tmpfs/auto.jpg');
    console.log("Capturing images");
    var bufs = [];
    stream.on('data', function(d){ bufs.push(d); });
    stream.on('end', function(){
      var buf = Buffer.concat(bufs);
      var image = new Image();
      image.data = buf;
      image.save();
    });
  },5000);
});


//stop recording
app.post('/stopRecord', function(request, response, next) {
clearInterval(CaptureImages);
});


//to convert the buffer, use 'toString' function and insert base64 as parameter
app.post('/images', function(request, response, next) {
  Image.find({
    "timestamp": {
      // take timestamp from request.body
      $gte: request.body.$gte,
      $lte: request.body.$lte
    }})
    .then(function(images) {
      images = images.map(function(image) {
        return {
          timestamp: image.timestamp,
          data: image.data.toString('base64')
        };
      });
      response.json(images);
    })
    .catch(next);
  });


  app.listen(3000, function() {
    console.log('Listening on port 3000.');
  });
