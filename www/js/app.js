//Youtube KEY
var key = 'AIzaSyAVLvOAGsqYJFqqV4SXbk4IZSUPPDJApQo';

//=============================Functions==============================
var httpGet = function (URL) {
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", URL, false);
    xmlHttp.send(null);
    return JSON.parse(xmlHttp.responseText);
}

/*
 Initialization
 */
angular.module('ionic.utils', [])
    .factory('$localstorage', ['$window', function ($window) {
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
// Initializing the AngularJs app
var app = angular.module('App', ['ionic', 'ngCordova', "ngSanitize", 'ionic.utils']);
/*
 Routing
 */
app.config(function ($stateProvider, $urlRouterProvider, $httpProvider) {

    $urlRouterProvider.otherwise('/'); // redirects any non-listed urls to the main page of the app.

    // The main page of the app.
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'templates/home.html',
    });

    // The settings page view
    $stateProvider.state('search', {
        url: '/search',
        templateUrl: 'templates/search.html',
    });
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

/*
 Services
 */
app.service('VideosService', ['$window', '$rootScope', '$log', '$http', '$localstorage', function ($window, $rootScope, $q, $localstorage, $http) {
    var service = this;
    var youtube = {
        ready: false,
        player: null,
        playerId: null,
        videoId: null,
        videoTitle: null,
        playerHeight: '480',
        playerWidth: '720',
        state: 'stopped'
    };
    var results = {channel: [], playlist: [], video: []};
    var details = {channel: [{}], playlist: [], video: []};
    var upcoming = [
        {id: 'XKa7Ywiv734', title: '[OFFICIAL HD] Daft Punk - Give Life Back To Music (feat. Nile Rodgers)'},
        {id: 'kRJuY6ZDLPo', title: 'La Roux - In for the Kill (Twelves Remix)'},
        {id: '45YSGFctLws', title: 'Shout Out Louds - Illusions'},
        {id: 'ktoaj1IpTbw', title: 'CHVRCHES - Gun'},
        {id: '8Zh0tY2NfLs', title: 'N.E.R.D. ft. Nelly Furtado - Hot N\' Fun (Boys Noize Remix) HQ'},
        {id: 'zwJPcRtbzDk', title: 'Daft Punk - Human After All (SebastiAn Remix)'},
        {id: 'sEwM6ERq0gc', title: 'HAIM - Forever (Official Music Video)'},
        {id: 'fTK4XTvZWmk', title: 'Housse De Racket â˜â˜€â˜ Apocalypso'}
    ];

    $window.onYouTubeIframeAPIReady = function () {
        console.log('Youtube API is ready');
        youtube.ready = true;
        service.bindPlayer('placeholder');
        service.loadPlayer();
        $rootScope.$apply();
    };

    function onYoutubeReady(event) {
        console.log('YouTube Player is ready');
        youtube.player.cueVideoById(upcoming[0].id);
        youtube.videoId = upcoming[0].id;
        youtube.videoTitle = upcoming[0].title;
    }

    function onYoutubeStateChange(event) {
        if (event.data == YT.PlayerState.PLAYING) {
            youtube.state = 'playing';
        } else if (event.data == YT.PlayerState.PAUSED) {
            youtube.state = 'paused';
        } else if (event.data == YT.PlayerState.ENDED) {
            youtube.state = 'ended';
            service.launchPlayer(upcoming[0].id, upcoming[0].title);
            service.deleteVideo(upcoming, upcoming[0].id);
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
            height: youtube.playerHeight,
            width: youtube.playerWidth,
            playerVars: {
                rel: 0,
                showinfo: 0
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

    this.launchPlayer = function (id, title) {
        youtube.player.loadVideoById(id);
        youtube.videoId = id;
        youtube.videoTitle = title;
        return youtube;
    };


    this.queueVideo = function (id, title) {
        upcoming.push({
            id: id,
            title: title
        });
        return upcoming;
    };


    this.deleteVideo = function (list, id) {
        for (var i = list.length - 1; i >= 0; i--) {
            if (list[i].id === id) {
                list.splice(i, 1);
                break;
            }
        }
    };

    this.getYoutube = function () {
        return youtube;
    };

    this.getResults = function () {
        return results;
    };

    this.getUpcoming = function () {
        return upcoming;
    };
    this.search = function (term, type, items, page) {
        results[type].length = 0;
        data = httpGet('https://www.googleapis.com/youtube/v3/search' +
        '?key=' + key +
        '&type=' + type +
        '&maxResults=' + items +
        '&part=' + 'id,snippet' +
        '&fields' + 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle' +
        '&q=' + term);
        if (type == 'video') {
            for (var i = data.items.length - 1; i >= 0; i--) {
                results[type].push({
                    id: data.items[i].id.videoId,
                    title: data.items[i].snippet.title,
                    description: data.items[i].snippet.description,
                    thumbnail: data.items[i].snippet.thumbnails.default.url,
                    author: data.items[i].snippet.channelTitle
                });
            }
        }
        else if (type == 'channel') {
            for (var i = data.items.length - 1; i >= 0; i--) {
                results[type].push({
                    id: data.items[i].id.channelId,
                    title: data.items[i].snippet.title,
                    description: data.items[i].snippet.description,
                    thumbnail: data.items[i].snippet.thumbnails.default.url,
                    author: data.items[i].snippet.channelTitle
                });
            }
        }
        else if (type == 'playlist') {
            for (var i = data.items.length - 1; i >= 0; i--) {
                results[type].push({
                    id: data.items[i].id.playlistId,
                    title: data.items[i].snippet.title,
                    description: data.items[i].snippet.description,
                    thumbnail: data.items[i].snippet.thumbnails.default.url,
                    author: data.items[i].snippet.channelTitle
                });
            }
        }
        ;
    };
    this.get = function (id, type) {
        data = httpGet('https://www.googleapis.com/youtube/v3/channels' +
        '?key=' + key +
        '&id=' + id +
        '&part=' + 'snippet,statistics');
        details.channel[0] = data.items[0].snippet; //title, description, publishedAt, thumbnails.default/medium/high
        details.channel[0].statistics = data.items[0].statistics; //viewCount, commentCount,subscriberCount,hiddenSubscriberCount,videoCount
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

app.controller('ContentCtrl', function ($scope,$ionicGesture, $window, $interval, $ionicSideMenuDelegate, $ionicModal, $ionicSlideBoxDelegate,
                                        $http, $sce, $ionicPopup, $ionicPopover, VideosService) {
    init();
    function init() {
        $scope.youtube = VideosService.getYoutube();
        $scope.results = VideosService.getResults();
        $scope.upcoming = VideosService.getUpcoming();
    }
    $scope.launch = function (id, title) {
        VideosService.launchPlayer(id, title);
        VideosService.archiveVideo(id, title);
        $log.info('Launched id:' + id + ' and title:' + title);
        $scope.closeSearchModal();
    };

    $scope.queue = function (id, title) {
        VideosService.queueVideo(id, title);
    };

    $scope.delete = function (list, id) {
        VideosService.deleteVideo(list, id);
    };


    $scope.tab = [true, false, false];
    $scope.tab = function (id) {
        for (var i = 0; i < 3; i++) {
            $scope.tab[i] = false;
        }
        $scope.tab[id] = true;
    };

    $scope.search = function () {
        VideosService.search(this.query, 'channel', '2', '');
        VideosService.search(this.query, 'playlist', '2', '');
        VideosService.search(this.query, 'video', '8', '');
    };
    $scope.searchChannel = function (id) {
        VideosService.get(id, 'channel');
        $scope.openModal('channel');
    };

    $scope.getVideoInfo = function (id) {
        $http.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                key: key,
                id: id,
                part: 'snippet,statistics',
                fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle',
            }
        })
            .success(function (data) {
                return data;
            })
            .error(function () {
            });
    };

    $scope.updateUpcoming = function (){
      for (var i =0; i<$scope.upcoming.length;i++)
      {
          $scope.upcoming[i] = $scope.getVideoInfo($scope.upcoming[i].id);
      }
    };
    //========================Gesture Control (Bookmark modal)=======================
    $scope.lastEventCalled = 'Try to Drag the content up, down, left or rigth';
    var element = angular.element(document.querySelector('#eventPlaceholder'));
    var events = [{
        event: 'dragup',
        text: 'You dragged me UP!'
    },{
        event: 'dragdown',
        text: 'You dragged me Down!'
    },{
        event: 'dragleft',
        text: 'You dragged me Left!'
    },{
        event: 'dragright',
        text: 'You dragged me Right!'
    },{
        event: 'tap',
        text: 'You dragged me Right!'
    }];

    angular.forEach(events, function(obj){
        $ionicGesture.on(obj.event, function (event) {
            $scope.$apply(function () {
                $scope.lastEventCalled = obj.text;
            });
        }, element);
    });

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
