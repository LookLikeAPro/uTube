//Youtube KEY
var key = 'AIzaSyAVLvOAGsqYJFqqV4SXbk4IZSUPPDJApQo';
//Global Variables
var results = {channel: [], playlist: [], video: []};
var details = {channel: [], playlist: [], video: [], related: []};
//var queue = [];
//var quality = {22: "720p", 43: "480p", 18: "480p", 5:"360p", 36:"360p", 17:"240p"};
//var maxQuality = "22";
var preference = [43, 18, 5, 36, 17, 22];
var async = true;

//=============================Functions==============================
var httpGet = function (URL) {
  var xmlHttp = null;
  xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", URL, false);
  xmlHttp.setRequestHeader("Referer", "http://jerryzhou.net/utube/");
  xmlHttp.send(null);
  return JSON.parse(xmlHttp.responseText);
}


var app = angular.module('App', ['ionic', 'ngCordova', "ngSanitize", 'ngVideo']);
/*
 Routing
 */
app.config(function ($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/');

  $stateProvider.state('home', {
    url: '/',
    templateUrl: 'templates/home.html',
  });

  // The settings page view
  $stateProvider.state('search', {
    url: '/search',
    templateUrl: 'templates/search.html',
  });
});

app.factory('web', function($q, $http, $templateCache) {
  return {
    get: function(query) {
      var deferred = $q.defer();
      var url = query;
      $http.get(url)
      .success(function(data) {
        deferred.resolve(data);
      });
      return deferred.promise;
    }
  };
});
app.factory('$localstorage', ['$window', function ($window) {
  return {
    set: function (key, value) {
      $window.localStorage[key] = value;
    },
    get: function (key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function (key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function (key, defaultValue) {
      return JSON.parse($window.localStorage[key] || JSON.stringify(defaultValue));
    }
  }
}]);
/*
 Services
 */
app.service(
  'VideosService',
  ['$window','$log', '$localstorage', '$sce', 'web', 'video', function ($window, $q, $localstorage, $sce, web,video) {
    var service = this;
    /*
     var youtube = {
       ready: false,
       player: null,
       playerId: null,
       videoId: null,
       videoTitle: null,
       state: 'stopped',
     };

     $window.onYouTubeIframeAPIReady = function () {
       console.log('Youtube API is ready');
       youtube.ready = true;
       service.bindPlayer('placeholder');
       service.loadPlayer();
       $rootScope.$apply();
       //<iframe width="640" height="360" src="http://www.youtube.com/embed/*********?feature=player_embedded" frameborder="0" allowfullscreen></iframe>
     };

     function onYoutubeReady(event) {
       console.log('YouTube Player is ready');
       youtube.videoId = queue[0].id;
     }

     function onYoutubeStateChange(event) {
       if (event.data == YT.PlayerState.PLAYING) {
         youtube.state = 'playing';
       } else if (event.data == YT.PlayerState.PAUSED) {
         youtube.state = 'paused';
       } else if (event.data == YT.PlayerState.ENDED) {
         youtube.state = 'ended';
         queue.splice(0, 1);
         service.launchPlayer(queue[0].id, queue[0].title);
       }
       $rootScope.$apply();
     }

     this.bindPlayer = function (elementId) {
       console.log('Binding to ' + elementId);
       youtube.playerId = elementId;
     };

     this.createPlayer = function () {
       console.log('Creating a new Youtube player for DOM id ' + youtube.playerId + ' and video ' + youtube.videoId);
       return new YT.Player(youtube.playerId, {
         playerVars: {
           rel: 0,
           showinfo: 0,
           color: 'white',
           rel:0,
           theme:'light',
         },
         events: {
           'onReady': onYoutubeReady,
           'onStateChange': onYoutubeStateChange
         }
       });
     };

     this.loadPlayer = function () {
       if (youtube.ready && youtube.playerId) {
         if (youtube.player) {
           youtube.player.destroy();
         }
         youtube.player = service.createPlayer();
       }
     };
     this.launchPlayer = function (id) {
        youtube.player.loadVideoById(id);
        youtube.videoId = id;
        return youtube;
     };*/

    this.get = function (query, action){
      if (async)
      {
        web.get(query).then(action, function(reason) {
          console.log('Failed: ' + reason);
        });
      }
      else
      {
        action(httpGet(query));
      }
    };
    this.launchPlayer = function (id) {
      query = 'http://jerryzhou.net/cors.php?http://ytapi.gitnol.com/get.php?apikey=03cedab1gdghtelxwd8d5272d1394d12&id='+id;
      service.get(query, function(data){for (i=0; i<preference.length; i++)
        {
          if (data.link[preference[i]][0].substring(0,4)=="http:")
          {
            video.addSource('mp4',data.link[i][0], true);
            break;
          }
        }
        video.addSource('mp4',data.link[18][0], true);});
    };
    this.search = function (term, type, items, page) {
      results[type].length = 0;
      query = 'https://www.googleapis.com/youtube/v3/search' +
        '?key=' + key +
        '&type=' + type +
        '&maxResults=' + items +
        '&part=' + 'id,snippet' +
        '&q=' + term;
      service.get(query, function(data){results[type] = data.items});
    };
    this.getChannelInfo = function (id) {
      query = 'https://www.googleapis.com/youtube/v3/channels' +
        '?key=' + key +
        '&id=' + id +
        '&part=' + 'snippet,statistics,brandingSettings';
      service.get(query, function(data)
                  {details.channel[0] = data.items[0].snippet; //title, description, publishedAt, thumbnails.default/medium/high
                   details.channel[0].statistics = data.items[0].statistics; //viewCount, commentCount,subscriberCount,hiddenSubscriberCount,videoCount
                   details.channel[0].id = data.items[0].id;
                   details.channel[0].brandingSettings = data.items[0].brandingSettings;
                   //keywords, featuredChannelsUrls,profileColor,image.bannerImageUrl/bannerMobileImageUrl/bannerTabletLowImageUrl/bannerTabletImageUrl/bannerTvImageUrl
                   service.getChannelVideo(details.channel[0].id);
                   service.getChannelPlaylist(details.channel[0].id);
                   service.getChannelFeatured(details.channel[0].brandingSettings.channel.featuredChannelsUrls);});
    };
    this.getChannelVideo = function (id) {
      query = 'https://www.googleapis.com/youtube/v3/search' +
        '?key=' + key +
        '&channelId=' + id +
        '&maxResults=' + '10' +
        '&part=' + 'id,snippet' +
        '&order=' + 'date';
      service.get(query, function(data){details.channel[0].video = data.items;});
    };
    this.getChannelPlaylist = function (id) {
      query = 'https://www.googleapis.com/youtube/v3/playlists' +
        '?key=' + key +
        '&channelId=' + id +
        '&maxResults=' + '10' +
        '&part=' + 'id,snippet' +
        '&order=' + 'date';
      service.get(query, function(data){details.channel[0].playlist = data.items;});
    };
    this.getChannelFeatured = function (id) {
      query = 'https://www.googleapis.com/youtube/v3/channels' +
        '?key=' + key +
        '&id=' + id +
        '&part=' + 'snippet';
      service.get(query, function(data){details.channel[0].featured = data.items;});
    };
    this.getPlaylistInfo = function (id) {
      query = 'https://www.googleapis.com/youtube/v3/playlists' +
        '?key=' + key +
        '&id=' + id +
        '&part=' + 'snippet';
      service.get(query, function(data){details.playlist[0] = data.items[0].snippet;});
      service.getPlaylistVideo(id);
    };
    this.getPlaylistVideo = function (id) {
      query = 'https://www.googleapis.com/youtube/v3/playlistItems' +
        '?key=' + key +
        '&playlistId=' + id +
        '&maxResults=' + '10' +
        '&part=' + 'id,snippet' +
        '&order=' + 'date';
      service.get(query, function(data){details.playlist[0].video = data.items;});
    };
    this.getVideoInfo = function (id) {
      query = 'https://www.googleapis.com/youtube/v3/videos' +
        '?key=' + key +
        '&id=' + id +
        '&part=' + 'id,snippet';
      service.get(query, function(data){details.video[0] = data.items[0];});
      service.getVideoRelated(id);
    };
    this.getVideoRelated = function (id) {
      query = 'https://www.googleapis.com/youtube/v3/search' +
        '?key=' + key +
        '&relatedToVideoId=' + id +
        '&part=' + 'id,snippet' +
        '&type=' + 'video';
      service.get(query, function(data){ details.related = data.items;});
    };
  }]);

app.run(function ($localstorage) {
  var tag = document.createElement('script');
  tag.src = "http://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

/*
 Controllers
 */
app.controller('ContentCtrl', function ($scope,$ionicGesture, $window, $interval, $ionicSideMenuDelegate, $ionicModal, $ionicSlideBoxDelegate, $http, $sce, $ionicPopup, VideosService, video, web) {
  init();
  function init() {
    $scope.results = results;
    $scope.details = details;
    //$scope.queue = queue;
  }
  $scope.launch = function (id) {
    VideosService.launchPlayer(id);
    VideosService.getVideoInfo(id);
    $scope.closeModal('search');
    $scope.closeModal('channel');
    $scope.closeModal('bookmark');
  };
  $scope.delete = function (list, id) {
    VideosService.deleteVideo(list, id);
  };
  $scope.search = function () {
    VideosService.search(this.query, 'channel', '2', '');
    VideosService.search(this.query, 'playlist', '2', '');
    VideosService.search(this.query, 'video', '8', '');
  };
  $scope.searchChannel = function (id) {
    VideosService.getChannelInfo(id);
    $scope.openModal('channel');
  };
  $scope.searchPlaylist = function (id) {
    VideosService.getPlaylistInfo(id);
    $scope.openModal('playlist');
  };
  /*
  $scope.queueAdd = function (id) {
    queue.push(VideosService.getVideoInfo(id));
  };
  $scope.queueGoTo = function (id) {
    queue.unshift(VideosService.getVideoInfo(id));
    $scope.launch(id);
  };*/
  //========================Video View Tabs======================================
  $scope.tab = 0;
  $scope.tabTo = function (id) {
    $scope.tab = id;
  }

  //========================Gesture Control (Bookmark modal)=======================
  /*
  $scope.lastEventCalled = 'Try to Drag the content up, down, left or rigth';
  var element = angular.element(document.querySelector('#eventPlaceholder'));
  var events = [
    {
      event: 'dragleft',
      text: 'You dragged me Left!'
    },{
      event: 'dragright',
      text: 'You dragged me Right!'
    }];

  angular.forEach(events, function(obj){
    $ionicGesture.on(obj.event, function (event) {
      $scope.$apply(function () {
        $scope.lastEventCalled = obj.text;
        alert($scope.lastEventCalled);
      });
    }, element);
  });*/

  //===============================Modals Control===================================
  $scope.modal = {};
  $ionicModal.fromTemplateUrl('templates/search.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.modal.search = modal;
  });
  $ionicModal.fromTemplateUrl('templates/bookmark.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.modal.bookmark = modal;
  });
  $ionicModal.fromTemplateUrl('templates/channel.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.modal.channel = modal;
  });
  $ionicModal.fromTemplateUrl('templates/playlist.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.modal.playlist = modal;
  });
  $scope.openModal = function (id) {
    $scope.modal[id].show();
  };
  $scope.closeModal = function (id) {
    $scope.modal[id].hide();
  };
});

app.controller('BookmarkCtrl', function ($scope) {
  //===============================Tabs Control===================================
  $scope.tab = [
    {style: 'tab-small', show: false},
    {style: 'tab-large', show: true},
    {style: 'tab-small', show: false}];
  $scope.tabTo = function (tab) {
    for (var i = 0; i < $scope.tab.length; i++) {
      $scope.tab[i] = {style: 'tab-small', show: false};
    }
    $scope.tab[tab] = {style: 'tab-large', show: true};
  }
});

app.controller('ChannelCtrl', function ($scope, VideosService) {
  //===============================Tabs Control===================================
  $scope.tab = 1;
  $scope.tabTo = function (id) {
    $scope.tab = id;
  }
  $scope.searchChannelVideo = function (id) {
    VideosService.getChannelVideo(id);
  };
});
