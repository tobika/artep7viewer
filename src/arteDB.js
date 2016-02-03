var http = require('http'),
    request = require('request'),
    q = require('q'),
    arteCategories = require('./arteCategories'),
    languages = ['fr','de'],
    tmpTvGuideData = {};

var updateTVGuidesInterval = setInterval(function(){

    updateTVGuides();
}, 360000);

function updateTVGuides() {

    console.log('Update TV Guides');
    getAllShows().then( function() {

        console.log('Updated');
        return getAllCategories('fr');
    }).then( function () {

        return getAllCategories('de');
    }).then( function () {

        //clone the object, continue research for better implementation
        module.exports.tvGuideData = JSON.parse(JSON.stringify(tmpTvGuideData));

        module.exports.dataLoaded = true;
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

            tmpTvGuideData[language] = data;
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

    for (var i = 0, y = tmpTvGuideData[language].length; i < y; i++) {

        if (tmpTvGuideData[language][i].id === id) {
            return tmpTvGuideData[language][i];
        }
    }

    return false;
}

function arteJSONCompiler(url, page, callback, tmpArray) {
    tmpArray = tmpArray ? tmpArray : [];

    console.log('Request: ' + url + 'page=' + page + '&limit=72&sort=newest');

    request(url + 'page=' + page + '&limit=72&sort=newest', function (error, response, body) {

        try {
            var finalJson = JSON.parse(body),
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
        }
        catch (e){
            console.log('request error: retry');
            arteJSONCompiler(url, page, callback, tmpArray);
        }

    })
}

updateTVGuides();

module.exports.tvGuideData = {};
module.exports.channelData = arteCategories.categories;
module.exports.dataLoaded = false;