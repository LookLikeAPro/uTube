//Youtube KEY
var key = 'AIzaSyAVLvOAGsqYJFqqV4SXbk4IZSUPPDJApQo';
//Global Variables
var results = {channel: [], playlist: [], video: []};
var details = {channel: [], playlist: [], video: [], related: []};
var queue = [];

//=============================Functions==============================
var httpGet = function (URL) {
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", URL, false);
    xmlHttp.setRequestHeader("Referer", "http://jerryzhou.net/utube/");
    xmlHttp.send(null);
    return JSON.parse(xmlHttp.responseText);
}

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
var app = angular.module('App', ['ionic', 'ngCordova', "ngSanitize", 'ionic.utils']);
/*
 Routing
 */
app.config(function ($stateProvider, $urlRouterProvider, $httpProvider) {
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
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

/*
 Services
 */
app.service('VideosService', ['$window', '$rootScope', '$log', '$localstorage', '$sce',
    function ($window, $rootScope, $q, $localstorage, $sce) {
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

    this.launchPlayer = function (id) {
        youtube.player.loadVideoById(id);
        youtube.videoId = id;
        return youtube;
    };

    this.getYoutube = function () {
        return youtube;
    };

    this.search = function (term, type, items, page) {
        results[type].length = 0;
        data = httpGet('https://www.googleapis.com/youtube/v3/search' +
        '?key=' + key +
        '&type=' + type +
        '&maxResults=' + items +
        '&part=' + 'id,snippet' +
        '&q=' + term);
        results[type] = data.items;
    };
    this.getChannelInfo = function (id) {
        data = httpGet('https://www.googleapis.com/youtube/v3/channels' +
        '?key=' + key +
        '&id=' + id +
        '&part=' + 'snippet,statistics,brandingSettings');
        details.channel[0] = data.items[0].snippet; //title, description, publishedAt, thumbnails.default/medium/high
        details.channel[0].statistics = data.items[0].statistics; //viewCount, commentCount,subscriberCount,hiddenSubscriberCount,videoCount
        details.channel[0].id = data.items[0].id;
        details.channel[0].brandingSettings = data.items[0].brandingSettings;
        //keywords, featuredChannelsUrls,profileColor,image.bannerImageUrl/bannerMobileImageUrl/bannerTabletLowImageUrl/bannerTabletImageUrl/bannerTvImageUrl
        service.getChannelVideo(details.channel[0].id);
        service.getChannelPlaylist(details.channel[0].id);
        service.getChannelFeatured(details.channel[0].brandingSettings.channel.featuredChannelsUrls);
    };
    this.getChannelVideo = function (id) {
        data = httpGet('https://www.googleapis.com/youtube/v3/search' +
        '?key=' + key +
        '&channelId=' + id +
        '&maxResults=' + '10' +
        '&part=' + 'id,snippet' +
        '&order=' + 'date');
        details.channel[0].video = data.items;
    };
    this.getChannelPlaylist = function (id) {
        data = httpGet('https://www.googleapis.com/youtube/v3/playlists' +
        '?key=' + key +
        '&channelId=' + id +
        '&maxResults=' + '10' +
        '&part=' + 'id,snippet' +
        '&order=' + 'date');
        details.channel[0].playlist = data.items;
    };
    this.getChannelFeatured = function (id) {
        details.channel[0].featured = httpGet('https://www.googleapis.com/youtube/v3/channels' +
        '?key=' + key +
        '&id=' + id +
        '&part=' + 'snippet').items;
    };
    this.getPlaylistInfo = function (id) {
        data = httpGet('https://www.googleapis.com/youtube/v3/playlists' +
        '?key=' + key +
        '&id=' + id +
        '&part=' + 'snippet');
        details.playlist[0] = data.items[0].snippet;
        //if (details.playlist[0].title.length > 40)
        //    details.playlist[0].title = details.playlist[0].title.substr(0, 40) + '...';
        console.log(JSON.stringify(details.playlist[0]));
        service.getPlaylistVideo(id);
    };
    this.getPlaylistVideo = function (id) {
        data = httpGet('https://www.googleapis.com/youtube/v3/playlistItems' +
        '?key=' + key +
        '&playlistId=' + id +
        '&maxResults=' + '10' +
        '&part=' + 'id,snippet' +
        '&order=' + 'date');
        details.playlist[0].video = data.items;
    };
    this.getVideoInfo = function (id) {
        data = httpGet('https://www.googleapis.com/youtube/v3/videos' +
        '?key=' + key +
        '&id=' + id +
        '&part=' + 'id,snippet');
        details.video[0] = data.items[0];
        service.getVideoRelated(id);
        return details.video[0];
    };
    this.getVideoRelated = function (id) {
        data = httpGet('https://www.googleapis.com/youtube/v3/search' +
        '?key=' + key +
        '&relatedToVideoId=' + id +
        '&part=' + 'id,snippet' +
        '&type=' + 'video');
        details.related = data.items;
    }
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
                                        $http, $sce, $ionicPopup, VideosService) {
    init();
    function init() {
        $scope.youtube = VideosService.getYoutube();
        $scope.results = results;
        $scope.details = details;
        $scope.queue = queue;
    }

    $scope.launch = function (id) {
        VideosService.launchPlayer(id);
        $scope.closeModal('search');
        $scope.closeModal('channel');
        $scope.closeModal('bookmark');
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
    $scope.test = function () {
        VideosService.getVideoInfo(results.video[0].videoId);
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

    $scope.queueAdd = function (id) {
        queue.push(VideosService.getVideoInfo(id));
    };
    $scope.queueGoTo = function (id) {
        queue.unshift(VideosService.getVideoInfo(id));
        $scope.launch(id);
    };
    //========================Video View Tabs======================================
    $scope.tab = 0;
    $scope.tabTo = function (id) {
        $scope.tab = id;
    }

    //========================Gesture Control (Bookmark modal)=======================
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