/**
 * Serialgraphy
 * https://www.facebook.com/serialgraphy
 *
 * Released Under MIT License
 * http://opensource.org/licenses/MIT
 */
/**
 * Global Helpers
 */
var scrollTo = function(element, to, duration) {
    if (duration < 0) return;
    var difference = to - element.scrollTop;
    var perTick = difference / duration * 10;
    
    setTimeout(function() {
        element.scrollTop = element.scrollTop + perTick;
        scrollTo(element, to, duration - 10);
    }, 10);
};

var tzAbbr = function (dateInput) {
    var dateObject = dateInput || new Date(),
        dateString = dateObject + "",
        tzAbbr = (
            // Works for the majority of modern browsers
            dateString.match(/\(([^\)]+)\)$/) ||
            // IE outputs date strings in a different format:
            dateString.match(/([A-Z]+) [\d]{4}$/)
        );
 
    if (tzAbbr) {
        // Old Firefox uses the long timezone name (e.g., "Central
        // Daylight Time" instead of "CDT")
        tzAbbr = tzAbbr[1].match(/[A-Z]/g).join("");
    }
 
    return tzAbbr;
};

/**
 * Initialize Application
 */
var app = angular.module('Serialgraphy', ['SimplePagination']).config(function($routeProvider, $locationProvider)
{
    $routeProvider.when('/', {
        templateUrl: '/static/tpl/homeView.html',
        controller : 'mainController'
    });

    $routeProvider.when('/show/:show', {
        templateUrl: '/static/tpl/homeView.html',
        controller : 'mainController'
    });

    $locationProvider.html5Mode(true);
});

/**
 * Cache using localstorage
 */
var storage = utils.storage;
storage.init("serialgraphy", false);

/**
 * Global Timezone
 */
app.value('myTimezone', storage.exists('myTimezone') ? storage.read('myTimezone') : 'local');

app.service('timeZoneProvider', function($rootScope, myTimezone)
{
    this.getTimezone = function() { 
        return myTimezone;
    };

    this.setTimezone = function(tz) {
        myTimezone = tz;
        storage.save('myTimezone', tz);
        $rootScope.$broadcast('timezoneChange');
    };
});

/**
 * The main controller
 */
app.controller("mainController", function($scope, $http, $routeParams, $location, Pagination, timeZoneProvider)
{
    $scope.apiURL          = "/api/?callback=JSON_CALLBACK";
    $scope.results         = [];
    $scope.filterText      = null;
    $scope.availableGenres = [];
    $scope.userTimezone    = timeZoneProvider.getTimezone();

    /**
     * Initialize
     */
    $scope.init = function()
    {
        // Request
        // ------------------------------------------------------
        $http.jsonp($scope.apiURL).success(function(data)
        {
            // Format
            // ------------------------------------------------------
            angular.forEach(data, function(value, index)
            {
                var date     = value.date
                  , timezone = moment(date).isDST() ? ' -04:00' : ' -05:00';
                
                // Store the Episodes
                // ------------------------------------------------------
                angular.forEach(value.episodes, function(tvshow, index)
                {
                    tvshow.hasGenres = (tvshow.show.genres.length > 0);
                    tvshow.date      = date;
                    tvshow.dateObj   = moment(date + " " + tvshow.show.air_time + timezone, "YYYY-MM-DD h:mma ZZ");
                    $scope.results.push(tvshow);

                     // Save Genres
                     // ------------------------------------------------------
                     angular.forEach(tvshow.show.genres, function(genre, index)
                     {
                         var exists = false;
                         angular.forEach($scope.availableGenres, function(avGenre, index){
                             if (avGenre == genre) {
                                exists = true;
                             }
                         });
                         if (exists === false) {
                            $scope.availableGenres.push(genre);
                         }
                     }); // end foreach genres
                }); // end foreach episodes

                // Initialize Pagination
                // ------------------------------------------------------
                $scope.initPagination();


                // Set Up Route Filtering
                // ------------------------------------------------------
                if( $routeParams.show ){
                    $scope.filterText = $routeParams.show;
                }

                
            }); // end foreach dates
        }) // end jsonp request
        .error(function(error) {

        });
    };

    /**
     * Pad Helper
     */
    $scope.pad  = function(num){
        return (num < 10) ? "0" + num : num;
    }

    /**
     * Format Date
     */
    $scope.formatDate = function(dateObj)
    {
        var obj = dateObj.clone();
            obj = ($scope.userTimezone == 'utc') ? obj.utc() : obj;

        return obj.format('hh:mm A');
    }

    /**
     * URL Helper
     */
    $scope.encodeURI = function(str)
    {
        return encodeURIComponent(str);
    }

    /**
     * Show URL helper
     */
    $scope.findShowURL = function(show)
    {
        if( show.imdb_id )
        {
            return "http://www.imdb.com/title/tt" + show.imdb_id.replace('tt', '') + "/";
        }
        else if( show.tvdb_id )
        {
            return "http://thetvdb.com/?tab=series&id=" + show.tvdb_id;
        }
        else{
            return show.url;
        }
    }

    /**
     * Pagination
     */
    $scope.updatePagination = function()
    {
        $scope.pagination.numPages = Math.ceil($scope.results.length/$scope.pagination.perPage);
    };

    $scope.initPagination = function()
    {
        $scope.pagination = Pagination.getNew(15);
        $scope.pagination.numPages = Math.ceil($scope.results.length/$scope.pagination.perPage);
    };

    $scope.nextPage = function()
    {
        $scope.pagination.nextPage();
        $scope.scrollTop();
    };

    $scope.prevPage = function()
    {
        $scope.pagination.prevPage();
        $scope.scrollTop();
    };

    $scope.scrollTop = function()
    {
        window.setTimeout(function(){
            scrollTo(document.getElementById('content'), 0, 500);
        }, 50);
    };

    /**
     * Watch search box
     */
    $scope.$watch('filterText', function(newValue)
    {
        if( typeof newValue == 'string' && newValue != '' ) {
            $scope.pagination.toPageId(0);
            $scope.pagination.numPages = Math.ceil($scope.filtered.length/$scope.pagination.perPage);
        }
        else if ( typeof $scope.pagination != "undefined" ) {
            $scope.pagination.toPageId(0);
            $scope.updatePagination();
        }
    });

    /**
     * Watch timezone change
     */
    $scope.$on('timezoneChange', function()
    {
        var newTimezone = timeZoneProvider.getTimezone();

        if( newTimezone != $scope.userTimezone )
        {
            // Set a timeout because angular needs to
            // wait a bit to apply variables to scope
            window.setTimeout(function()
            {
                $scope.$apply(function () {
                    $scope.userTimezone = newTimezone;
                });
            }, 10);
        }
    });

    $scope.init();
    
});

/**
 * Config Controller
 */
app.controller("configController", function($scope, timeZoneProvider)
{
    $scope.userTimezone = timeZoneProvider.getTimezone();
    $scope.localAbbr    = tzAbbr();

    $scope.$watch('userTimezone', function(newValue){
        timeZoneProvider.setTimezone(newValue);
    });

    $scope.init = function()
    {
        var snapper = new Snap({
                element    : document.getElementById('content'),
                disable    : 'left',
                touchToDrag: false
            })
          , button = document.getElementById('snap-toggle');

        button.addEventListener('click', function(e)
        {
            e.preventDefault();

            if( snapper.state().state == 'right' ){
                snapper.close();
            } else {
                snapper.open('right');
            }
        });
    };

});
