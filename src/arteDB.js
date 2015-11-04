var http = require('http'),
    q = require('q'),
    arteCategories = require('./arteCategories'),
    languages = ['fr','de'],
    tvGuideData = {};

var updateTVGuidesInterval = setInterval(function(){

    updateTVGuides();
}, 180000);

function updateTVGuides() {

    console.log('Update TV Guides');
    getAllShows().then( function() {

        console.log('Updated');
        return getAllCategories('fr');
    }).then( function () {

        return getAllCategories('de');
    }).then( function () {

        console.log('Categories updated');
    })
}

function getAllShows() {
    var deferredAll = [];

    languages.map( function (language) {
        var deferred = q.defer();
        deferredAll.push(deferred.promise);

        arteJSONCompiler('http://www.arte.tv/guide/' + language + '/plus7/videos?', 1, function(data) {

            for (var i = 0, y = data.length; i < y; i++) {

                // remove autoplay from arte show urls
                data[i].url = data[i].url.replace(/=1/i, '=0');
                data[i].duration = (data[i].duration / 60).toFixed(0);
                data[i].airdate_long = data[i].scheduled_on;
                data[i].channels = '';
            }

            tvGuideData[language] = data;
            deferred.resolve();
        });

    });

    return q.all(deferredAll);
}

function getAllCategories(language) {
    var deferredAll = [];

    arteCategories.categories[language].map( function (category) {
        var deferred = q.defer();
        deferredAll.push(deferred.promise);

        category.count = 0;

        arteJSONCompiler('http://www.arte.tv/guide/' + language + '/plus7/videos?category=' + category.code + '&', 1, function(data) {

            for (var i = 0, y = data.length; i < y; i++) {

                addCategoryToShow(data[i].id, category, language);
            }

            deferred.resolve();
        });

    });

    return q.all(deferredAll);
}

function addCategoryToShow(id, category, language) {

    // do this for both languages
    var show = getShowFromId(id, language);

    category.count++;

    if (show) {
        if (show.channels) {
            show.channels+= ', ' + category.name;
        }
        else {
            show.channels+= category.name;
        }
    }
};

function getShowFromId(id, language) {

    for (var i = 0, y = tvGuideData[language].length; i < y; i++) {

        if (tvGuideData[language][i].id === id) {
            return tvGuideData[language][i];
        }
    }

    return false;
}

function arteJSONCompiler(url, page, callback, tmpArray) {
    tmpArray = tmpArray ? tmpArray : [];

    http.get(url + 'page=' + page + '&limit=72&sort=newest', function(res) {
        var jsonBody = '';

        res.on('data', function(chunk) {
            jsonBody += chunk;
        });

        res.on('end', function() {
            var finalJson = JSON.parse(jsonBody),
                videos = finalJson.videos;

            tmpArray = tmpArray.concat(videos);

            if (finalJson.has_more) {

                page++;
                arteJSONCompiler(url, page, callback, tmpArray);
            }
            else {
                console.log('Got JSON: ' + url + ' with ' + page + ' requests.');
                callback(tmpArray);
            }
        });
    }).on('error', function(e) {
        console.log("Got error: ", e);
    });
}

updateTVGuides();

module.exports.tvGuideData = tvGuideData;
module.exports.channelData = arteCategories.categories;