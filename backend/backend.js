var express = require('express');
var mongoose = require('mongoose');
//cool debugger that gives more detailed message in terminal
// mongoose.set('debug', true);
// var bcrypt = require('bcrypt');
var Promise = require('bluebird');
var bodyParser = require('body-parser');
var randtoken = require('rand-token');
var cors = require('cors');
var request = require('request');
var app = express();
var mongoCreds = require('./mongo_creds.json');
var conn = mongoose.connection;
var fs = require('fs');
var path = require('path');
var CaptureImages;
// connect to the database
mongoose.connect('mongodb://' + mongoCreds.username + ':' + mongoCreds.password + '@ds023674.mlab.com:23674/phamous-db');
mongoose.Promise = Promise;
app.use(bodyParser.json());
app.use(express.static('js'));
app.use(cors());
var bcrypt = Promise.promisifyAll(require('my-bcrypt'));


// mongodb model for users
var User = mongoose.model('User', {
  _id: { type: String, required: true },
  password: { type: String, required: true },
  imgURL: { type: String, required: true },
  authenticationTokens: [{ token: String, expiration: Date }],
});

//2nd mongoose model
var Image = mongoose.model('Image', {
  user: String,
  data: Buffer,
  timestamp: { type: Date, default: Date.now }
});




// handle signups
app.post('/signup', function(req, res) {
  console.log("hello, this is printing from signup");
  var username = req.body.username;
  var password = req.body.password;
  var imgURL = req.body.imgURL;
  // generate encrypted password
  bcrypt.hashAsync(password, 10)
  .then(function(encryptedPassword) {
    return [encryptedPassword, User.findOne({ _id: username })];
  })
  .spread(function(encryptedPassword, user) {
    if (!user) {
      // create user
      return User.create({
        _id: username,
        password: encryptedPassword,
        imgURL: imgURL
      });
    } else {
      // user already exists, throw error with 409 status code
      var error = new Error("Username is taken!");
      error.statusCode = 409;
      throw error;
    }
  })
  .then(function() {
    // successfully created user, respond with ok
    res.status(200).json({ "status": "ok" });
  })
  // catch all errors
  .catch(function(err) {
    if (!err.statusCode) {
      err.statusCode = 400;
    }
    res.status(err.statusCode).json({ "status": "fail", "message": err.message });
  });
});

// handle login
app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  // find user in database
  User.findOne({ _id: username })
  .then(function(user) {
    // if user isn't found
    if (!user) {
      throw new Error("User not found!");
    } else {
      // compared submitted password with encrypted password in database
      return [user, bcrypt.compareAsync(password, user.password)];
    }
  })
  .spread(function(user, matched) {
    // return token in response body
    if (matched) {
      // generate a 64-bit random token
      var token = randtoken.generate(64);
      // set token to expire in 10 days and push to authenticationTokens array
      user.authenticationTokens.push({ token: token, expiration: Date.now() + 1000 * 60 * 60 * 24 * 10 });
      return [token, user.save()];
    } else {
      // incorrect password - throw error
      throw new Error("Invalid password!");
    }
  })
  .spread(function(token) {
    res.status(200).json({ "status": "ok", "token": token });
  })
  .catch(function(err) {
    // console.error(err.stack);
    res.status(400).json({ "status": "fail", "message": err.message });
  });
});


// function to handle authentication
function authRequired(req, res, next) {
  // assign token variable depending on if it's a GET or POST
  var token;
  if(req.query.token){ token = req.query.token; }
  else if (req.body.token) { token = req.body.token;}
  else if (req.params.token ) {token = req.params.token;}

  User.findOne(
    //check if token exists and hasn't expired
    { authenticationTokens: { $elemMatch: { token: token, expiration: { $gt: Date.now() } } } })
    .then(function(user) {
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(400).json({ "status": "fail", "message": "Session expired. Please sign in again." });
      }
      return null;
    })
    .catch(function(err) {
      //if there was an error finding the user by authenticationToken
      res.status(400).json({ "status": "fail", "message": err.errors });
    });
  }



  //pulls timestamps for respective  users
  app.get('/getTimestamps/:token',authRequired, function(request, response, next) {
    var user = request.user;
    var images = request.params.images;
    Image.find(
      {user: user},
      { timestamp: 1}
    )
    .then(function(images) {
      justTimestamps = images.map(function(image) {
        return {
          timestamp: image.timestamp,
        };
      });

      response.json(justTimestamps);
    })
    .catch(function(error){
      console.log(error);
      next();
    });
  });





//Fast sandbox example of how query vs param routes work
  // app.get('/queryRoute', function(req, res){
  //   res.json(req.query);
  // });
  //
  // app.get('/paramRoute/:token/:user', function(req, res){
  //   res.json(req.params);
  // });


  //recordImage function
  app.post('/recordImages', function(request, response, next) {
    var token = request.body.token;
    // console.log(token);
    User.findOne({"authenticationTokens.token":token})
    .then(function(user, imgURL){
      if (user) {
        request.user = user;
        //Though the token is referenced to User model, I'll create the image into the Image model. image.save is similar to User.create

        CaptureImages = setInterval(function(){
          var imgURL = user.imgURL;
          // console.log("imgURL is ", imgURL);
          var record = require('request');
          var stream = record(imgURL);
          console.log("Capturing images");
          var bufs = [];
          stream.on('data', function(d){ bufs.push(d); });
          stream.on('end', function(){
            var buf = Buffer.concat(bufs);
            var image = new Image();
            image.user = user._id;
            image.data = buf;
            image.save();
            // console.log("user is ",user);
            // console.log("image is ", image);
          });
        },5000);
        response.status(200).json({"status": "okay"});

      } else {
        response.status(400).json({ "status": "fail", "message": "Can't find user." });
      }
      return null;
    })
    .catch(function(err) {
      //if there was an error finding the user by authenticationToken
      response.status(400).json({ "status": "fail", "message": err.errors });
    });
  });


  //stop recording
  app.post('/stopRecord', function(request, response, next) {
    clearInterval(CaptureImages);
  });





  //to convert the buffer, use 'toString' function and insert base64 as parameter
  app.post('/images', authRequired, function(request, response, next) {
    var user = request.user;
    Image.find({ $and: [{user: user},
      {"timestamp": {
        $gte: request.body.$gte,
        $lte: request.body.$lte
      }}
    ] })

    .then(function(images) {
      images = images.map(function(image) {
        return {
          timestamp: image.timestamp,
          data: image.data.toString('base64')
        };
      });
      response.json(images);
    })
    .catch(function(error){
      console.log(error);
      next();
    });
  });

  //end of HAl image capture code
  app.listen(3000, function() {
    console.log('Listening on 3000...');
  });
