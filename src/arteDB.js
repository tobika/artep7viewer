var http = require('http');
var languages = ['fr','de'];
var tvGuideData = {};
var channelData = {};
var loadDone = 0;

var updateTVGuidesInterval = setInterval(function(){

    updateTVGuides();
}, 180000);

function getShowsInformation(languagesToLoad) {

    loadDone++;

    if (languagesToLoad === loadDone) {
        console.log('Updated');
        loadDone = 0;

        // start processing
    }
}

function updateTVGuides() {

    console.log('Update TV Guides');

    languages.map( function (language) {

        arteJSONCompiler('http://www.arte.tv/guide/' + language + '/plus7/videos?', 1, function(data) {

            for (var i = 0, y = data.length; i < y; i++) {

                // remove autoplay from arte show urls
                data[i].url = data[i].url.replace(/=1/i, '=0');
                data[i].duration = (data[i].duration / 60).toFixed(0);
                data[i].airdate_long = data[i].scheduled_on;
            }

            tvGuideData[language] = data;
            getShowsInformation(2);
        });
    });
}

function arteJSONCompiler(url, page, callback, tmpArray) {
    tmpArray = tmpArray ? tmpArray : [];

    http.get(url + 'page=' + page + '&limit=96&sort=newest', function(res) {
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
module.exports.channelData = channelData;