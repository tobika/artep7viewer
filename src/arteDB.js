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
        console.log('Update complete');
        loadDone = 0;

        // start processing
    }
}

function updateTVGuides() {

    console.log('Update TV Guides');


    languages.map( function (language) {

        var url = 'http://www.arte.tv/guide/' + language + '/plus7/videos';

        tvGuideData[language] = [];
        arteJSONCompiler(url, 1, language);
    });
}

function arteJSONCompiler(url, page, language) {

    http.get(url + '?page=' + page + '&limit=96&sort=newest', function(res) {
        var jsonBody = '';

        res.on('data', function(chunk) {
            jsonBody += chunk;
        });

        res.on('end', function() {
            var finalJson = JSON.parse(jsonBody),
                videos = finalJson.videos;


            for (var i = 0, y = videos.length; i < y; i++) {

                // remove autoplay from arte show urls
                videos[i].url = videos[i].url.replace(/=1/i, '=0');
                videos[i].duration = (videos[i].duration / 60).toFixed(0);
                videos[i].airdate_long = videos[i].scheduled_on;
            }

            tvGuideData[language] = tvGuideData[language].concat(videos);


            if (finalJson.has_more) {

                page++;
                arteJSONCompiler(url, page, language);
            }
            else {
                console.log('Updated TV Guides: ' + language + ' with ' + page + ' requests.');
                getShowsInformation(2);
            }
        });
    }).on('error', function(e) {
        console.log("Got error: ", e);
    });
}

updateTVGuides();

module.exports.tvGuideData = tvGuideData;
module.exports.channelData = channelData;