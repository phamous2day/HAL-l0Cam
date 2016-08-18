var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoCreds = require('./mongo_creds.json'); mongoose.connect('mongodb://' + mongoCreds.username + ':' + mongoCreds.password + '@ds023674.mlab.com:23674/phamous-db');
var conn = mongoose.connection;

var fs = require('fs');

var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;


var request = require('request');
var i = 0;
conn.once('open', function () {
    console.log('open');
    var gfs = Grid(conn.db);

    // streaming to gridfs
    //filename to store in mongodb
    var writestream = gfs.createWriteStream({
        filename: 'fsMongoImage.png'
    });
    fs.createReadStream('picCounter0.png').pipe(writestream);

    writestream.on('close', function (file) {
        // do something with `file`
        console.log(file.filename + 'Written To DB');
    });
});
