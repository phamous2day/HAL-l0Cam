var API = 'http://localhost:3000';

var app = angular.module('HAL-app', ['ngRoute', 'ngCookies']);

// Some other stuff that came from sandbox app.js

app.directive('whenScrolled', function() {
  return function(scope, elm, attr) {
    var raw = elm[0];
    elm.bind('scroll', function() {
      if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
        scope.$apply(attr.whenScrolled);
      }
    });
  };
});

app.run(function($rootScope){
  $rootScope.$on('$locationChangeStart', function(event, nextUrl, currentUrl){

  });
});


app.config(function($routeProvider, $compileProvider){
  $compileProvider.imgSrcSanitizationWhitelist(/^data:image/);
  $routeProvider
  .when('/', {
    controller: 'MainController',
    templateUrl: '/home.html'
  })
  .when('/signup', {
    controller: 'MainController',
    templateUrl: '/signup.html'
  })
  .when('/login', {
    controller: 'MainController',
    templateUrl: '/login.html'
  })
  .when('/dashboard', {
    controller: 'ImagesController',
    templateUrl: '/dashboard.html'
  })
  .otherwise({
    redirectTo: '/'
  });
});


app.factory('backEnd', function($http) {
  return {
    getSignUp: function(data) {
      return $http({
        method: 'POST',
        url: API + '/signup',
        data: data
      });
    },
    getLogin: function(data) {
      return $http({
        method: 'POST',
        url: API + '/login',
        data: data
      });
    },
    recordImages: function() {
      return $http({
        methods: 'POST',
        url: API + '/dashboard',
        data:data
      });
    },
    button1: function() {
      return $http({
        methods: 'POST',
        url: API + '/dashboard',
        data:data
      });
    },
    button2: function() {
      return $http({
        methods: 'POST',
        url: API + '/dashboard',
        data:data
      });
    },
    getTimestamps: function() {
      return $http({
        methods: 'GET',
        url: API + '/dashboard'
      });
    },
    getImages: function() {
      return $http({
        methods: 'POST',
        url: API + '/dashboard',
        data:data
      });
    }
  };
});

app.run(function($rootScope, $location, $cookies) {
  $rootScope.$on('$locationChangeStart', function(event, nextUrl, currentUrl) {
    var token = $cookies.get('token');
    nextUrl = nextUrl.split('/');
    nextUrl = nextUrl[nextUrl.length - 1];
    if (!token && (nextUrl === 'dashboard')) {
      $cookies.put('urlRedirect', nextUrl);
      $location.path('/login');
    }
    if (!token) {
      $rootScope.userButton = true;
    } else {
      $rootScope.userButton = false;
    }
  });

  $rootScope.logout = function() {
    $cookies.remove('token');
    $rootScope.userButton = true;
    $location.path('/');
  };
});

//
app.factory('display', function($rootScope, $timeout) {
  function setMessage(message) {
    // var message = "hellomessage";
    console.log("function setMessage is happenings");
    $rootScope.displayMessage = message;
    console.log(message);

    $timeout(function() {
      $rootScope.displayMessage = null;
    }, 4000);
  }
  return {
    setMessage: setMessage
  };
});



app.controller('MainController', function($scope, $http, backEnd, $cookies, $location, display) {

  $scope.signUp = function() {
    var signUpInfo = {
      username: $scope.username,
      password: $scope.password,
      imgURL: $scope.imgURL
    };
    console.log('sign up has processed');
    backEnd.getSignUp(signUpInfo)
    .then(function(res) {
      $location.path('/dashboard');
    })
    .catch(function(err) {
      display.setMessage(err.message);
    });
  };

  $scope.login = function() {
    var loginInfo = {
      username: $scope.username,
      password: $scope.password,
    };
    backEnd.getLogin(loginInfo)
    .then(function(res) {
      $cookies.put('token', res.data.token);
      console.log(res);
      display.setMessage('Welcome, ' + loginInfo.username + '!');
      var nextUrl = $cookies.get('urlRedirect');
      if (!nextUrl) {
        $location.path('/dashboard');
      } else {
        $location.path('/' + nextUrl);
        $cookies.remove('urlRedirect');
      }
    })
    .catch(function(err) {
      display.setMessage(err.message);
    });
  };
});



// This next line came from my sandbox holding javascript that controls image pulls======================================
// /new code to filter images by time stamp
app.controller('ImagesController', function ImagesController($scope, $http, $cookies) {
  //the below to pull availableTimeStamps
  $http.get(API+'/getTimestamps/'+$cookies.get('token')).then(function(timestamp)
  {
    // console.log("availableTimestamps data is ", timestamp);
    $scope.availableTimestamps= timestamp;
  },function(err)
  {
    console.log("ImagesController error is", err);
  }
);


// experimental tests using switch to on/off record/
$scope.selected = true;
$scope.button1 = function () {
  //do logic for button 1
  $scope.selected = !$scope.selected;
  console.log('btn1 clicked');
  console.log("$scope recording images to backend via btn1");
  var token = $cookies.get('token');
  $http.post(API+'/recordImages', {
    token: token
  })
  .success(function(data, status){
  })
  .error(function(status){
    console.log("Record status is: ",status);
  });
};

$scope.button2 = function () {
  //do logic for button 2
  $scope.selected = !$scope.selected;
  console.log('btn2 clicked');
  console.log("Recording has stopped");
  $http.post(API+'/stopRecord');

};


//This is the main pull for images filtered by time range
$scope.getImages = function() {
  var parameterTimes =
  {
    "$gte": $scope.starttime,
    "$lte": $scope.endtime,
    "token": $cookies.get('token')
  };
  console.log("parameters are: ",parameterTimes);
  $http.post(API+'/images', parameterTimes)
  .success(function(data,status){
    $scope.Images = data;
  })
  .error(function(status){
    console.log("GetImages status is: " + status);
  });
};
});
