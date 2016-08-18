var app =angular.module('app', []).controller('MainController', MainController);

angular.module('scroll', []).directive('whenScrolled', function() {
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

//Had to reduce the parameter down to /^data:image/ to make it less specific
app.config(function($compileProvider){
  $compileProvider.imgSrcSanitizationWhitelist(/^data:image/);
});



//new code to filter images by time stamp
function MainController($scope, $http) {
  //the below limits images shown on page
  $scope.items = [];
  var counter = 0;
  $scope.loadMore = function() {
    for (var i = 0; i < 5; i++) {
      $scope.items.push({
        id: counter
      });
      counter += 10;
    }
  };
  $scope.loadMore();


  //the below to pull availableTimeStamps
  $http.get('/images').then(function(timestamp)
  {
    // console.log("availableTimestamps data is ", timestamp);
    $scope.availableTimestamps= timestamp;
  },function(err)
  {
    console.log(err);
  }
);


// experimental tests using switch to on/off record/
$scope.selected = true;
$scope.button1 = function () {
  //do logic for button 1
  $scope.selected = !$scope.selected;
  console.log('btn1 clicked');
  console.log("$scope capture");
  $http.post('/recordImages')
  .success(function(data, status){
  })
  .error(function(status){
    console.log("status is: " + status);
  });
};

$scope.button2 = function () {
  //do logic for button 2
  $scope.selected = !$scope.selected;
  console.log('btn2 clicked');
  console.log("Recording has stopped");
  $http.post('/stopRecord');

};




//This is the main pull for images filtered by time range
$scope.getImages = function() {
  var parameterTimes =
  {
    "$gte": $scope.starttime,
    "$lte": $scope.endtime,
  };
  console.log("parameters are: ",parameterTimes);
  $http.post('/images', parameterTimes)
  .success(function(data,status){
    $scope.Images = data;
  })
  .error(function(status){
    console.log("status is: " + status);
  });
};
}
