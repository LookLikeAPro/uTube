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
var app = angular.module('PalmApp', ['ionic', 'ngCordova', "ngSanitize", 'ionic.utils']);
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
app.service('VideosService', ['$window', '$rootScope', '$log', '$http','$localstorage', function ($window, $rootScope, $log, $localstorage, $http) {
    var service = this;
    var youtube = {
        ready: false,
        player: null,
        playerId: null,
        videoId: null,
        videoTitle: null,
        playerHeight: '480',
        playerWidth: '640',
        state: 'stopped'
    };
    var results = {channel: [], playlist: [], video: []};
    var upcoming = [
        {id: 'kRJuY6ZDLPo', title: 'La Roux - In for the Kill (Twelves Remix)'},
        {id: '45YSGFctLws', title: 'Shout Out Louds - Illusions'},
        {id: 'ktoaj1IpTbw', title: 'CHVRCHES - Gun'},
        {id: '8Zh0tY2NfLs', title: 'N.E.R.D. ft. Nelly Furtado - Hot N\' Fun (Boys Noize Remix) HQ'},
        {id: 'zwJPcRtbzDk', title: 'Daft Punk - Human After All (SebastiAn Remix)'},
        {id: 'sEwM6ERq0gc', title: 'HAIM - Forever (Official Music Video)'},
        {id: 'fTK4XTvZWmk', title: 'Housse De Racket â˜â˜€â˜ Apocalypso'}
    ];
    var history = [
        {id: 'XKa7Ywiv734', title: '[OFFICIAL HD] Daft Punk - Give Life Back To Music (feat. Nile Rodgers)'}
    ];

    $window.onYouTubeIframeAPIReady = function () {
        $log.info('Youtube API is ready');
        youtube.ready = true;
        service.bindPlayer('placeholder');
        service.loadPlayer();
        $rootScope.$apply();
    };

    function onYoutubeReady(event) {
        $log.info('YouTube Player is ready');
        youtube.player.cueVideoById(history[0].id);
        youtube.videoId = history[0].id;
        youtube.videoTitle = history[0].title;
    }

    function onYoutubeStateChange(event) {
        if (event.data == YT.PlayerState.PLAYING) {
            youtube.state = 'playing';
        } else if (event.data == YT.PlayerState.PAUSED) {
            youtube.state = 'paused';
        } else if (event.data == YT.PlayerState.ENDED) {
            youtube.state = 'ended';
            service.launchPlayer(upcoming[0].id, upcoming[0].title);
            service.archiveVideo(upcoming[0].id, upcoming[0].title);
            service.deleteVideo(upcoming, upcoming[0].id);
        }
        $rootScope.$apply();
    }

    this.bindPlayer = function (elementId) {
        $log.info('Binding to ' + elementId);
        youtube.playerId = elementId;
    };

    this.createPlayer = function () {
        $log.info('Creating a new Youtube player for DOM id ' + youtube.playerId + ' and video ' + youtube.videoId);
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

    this.listResults = function (data, type) {
        results[type].length = 0;
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
                    id: data.items[i].id.videoId,
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
                    id: data.items[i].id.videoId,
                    title: data.items[i].snippet.title,
                    description: data.items[i].snippet.description,
                    thumbnail: data.items[i].snippet.thumbnails.default.url,
                    author: data.items[i].snippet.channelTitle
                });
            }
        }
        ;
        return results[type];
    }

    this.queueVideo = function (id, title) {
        upcoming.push({
            id: id,
            title: title
        });
        return upcoming;
    };

    this.archiveVideo = function (id, title) {
        history.unshift({
            id: id,
            title: title
        });
        return history;
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

    this.getHistory = function () {
        return history;
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

app.controller('ContentCtrl', function ($scope, $ionicSideMenuDelegate, $ionicModal, $ionicSlideBoxDelegate, $http, $sce, $ionicPopup, $ionicPopover, VideosService, $localstorage, $log) {

    init();
    function init() {
        $scope.youtube = VideosService.getYoutube();
        $scope.results = VideosService.getResults();
        $scope.upcoming = VideosService.getUpcoming();
        $scope.history = VideosService.getHistory();
        $scope.playlist = true;
    }


    $scope.launch = function (id, title) {
        VideosService.launchPlayer(id, title);
        VideosService.archiveVideo(id, title);
        $log.info('Launched id:' + id + ' and title:' + title);
    };

    $scope.queue = function (id, title) {
        VideosService.queueVideo(id, title);
        VideosService.deleteVideo($scope.history, id);
        $log.info('Queued id:' + id + ' and title:' + title);
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


    //===============================Modals Control===================================
    $ionicModal.fromTemplateUrl('templates/search.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.searchModal = modal;
    });
    $scope.openSearchModal = function () {
        $scope.searchModal.show();
    };
    $scope.closeSearchModal = function () {
        $scope.searchModal.hide();
    };
    $ionicModal.fromTemplateUrl('templates/bookmark.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.bookmarkModal = modal;
    });
    $scope.openBookmarkModal = function () {
        $scope.bookmarkModal.show();
    };
    $scope.closeBookmarkModal = function () {
        $scope.bookmarkModal.hide();
    };
});

app.controller('SearchCtrl', function ($scope, $http, $sce, VideosService) {
    $scope.search = function () {
        $http.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: 'AIzaSyA57XvCbZFEjA30XKLlEYBSVJGprGswIU4',
                type: 'video',
                maxResults: '8',
                part: 'id,snippet',
                fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle',
                q: this.query
            }
        })
            .success(function (data) {
                VideosService.listResults(data, 'video');
            })
            .error(function () {
            });

        $http.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: 'AIzaSyA57XvCbZFEjA30XKLlEYBSVJGprGswIU4',
                type: 'playlist',
                maxResults: '2',
                part: 'id,snippet',
                fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle',
                q: this.query
            }
        })
            .success(function (data) {
                VideosService.listResults(data, 'playlist');
            })
            .error(function () {
            });
        $http.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: 'AIzaSyA57XvCbZFEjA30XKLlEYBSVJGprGswIU4',
                type: 'channel',
                maxResults: '2',
                part: 'id,snippet',
                fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle',
                q: this.query
            }
        })
            .success(function (data) {
                VideosService.listResults(data, 'channel');
            })
            .error(function () {
            });
    };
    $scope.searchExtend = function () {
        $log.info('extend');
        $http.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: 'AIzaSyA57XvCbZFEjA30XKLlEYBSVJGprGswIU4',
                type: 'video',
                maxResults: '8',
                part: 'id,snippet',
                fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle',
                q: this.query
            }
        })
            .success(function (data) {
                $scope.$broadcast('scroll.infiniteScrollComplete');
                VideosService.listResults(data, 'video');
            })
            .error(function () {
            });
    };
});