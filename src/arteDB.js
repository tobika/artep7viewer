var http = require('http'),
    request = require('request'),
    q = require('q'),
    arteCategories = require('./arteCategories'),
    channelData = {},
    arteRssParser = require('./arteRssParser'),
    languages = ['fr','de'],
    tmpTvGuideData = {};

var updateTVGuidesInterval = setInterval(function(){

    updateTVGuides();
}, 180000);

function updateTVGuides() {

    console.log('Update TV Guides');
    /*getAllShows().then( function() {

        console.log('Updated');
        return getAllCategories('fr');
    }).then( function () {

        return getAllCategories('de');
    }).then( function () {

        //clone the object, continue research for better implementation
        module.exports.tvGuideData = JSON.parse(JSON.stringify(tmpTvGuideData));

        module.exports.dataLoaded = true;
        console.log('Categories updated');
    })*/
    getAllShows().then( function() {
        module.exports.dataLoaded = true;
        console.log('Updated');
    })
}

function getAllShows() {
    var deferredAll = [];

    languages.map( function (language) {
        var deferred = q.defer();
        deferredAll.push(deferred.promise);

        arteRssParser.getArteRssElements(language).then(function(data) {
            //console.log(data);

            data.map(function(entry) {
                //console.log(entry['arte:channel']['#']);
                //console.log(entry['arte:channel']['#']);
                //console.log(entry['arte:teasertext']['#']);
                //console.log(entry['media:content']['@']['duration']);

                entry.id = entry.guid;
                entry.url = entry.link + '?autoplay=0';
                entry.teaser = entry['arte:teasertext']['#']; //longer description also available
                entry.thumbnail_url = entry['media:thumbnail']['@']['url'];
                entry.duration = entry['media:content']['@']['duration'];
                entry.airdate_long = entry.pubdate;
                entry.channels = entry['arte:channel']['#'];

                if (entry.channels) {
                    addChannel(language, entry.channels);
                }
            });

            module.exports.tvGuideData[language] = data;

            deferred.resolve();
        });

        /*arteJSONCompiler('http://www.arte.tv/guide/' + language + '/plus7/videos?', 1, function(data) {

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
*/
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

function addChannel(language, channel) {

    if (typeof channelData[language] === "undefined" ) {
        channelData[language] = {};
    }

    if (typeof channelData[language][channel] === "undefined" ) {
        channelData[language][channel] = { name : channel, count : 1};
    }
    else {
        channelData[language][channel].count++;
    }
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
module.exports.channelData = channelData;//arteCategories.categories;
module.exports.dataLoaded = false;