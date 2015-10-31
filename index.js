var http = require('http');
var languages = ['fr','de'];
var tvGuideData = {};
var channelData = {};

var updateTVGuidesInterval = setInterval(function(){

    updateTVGuides();
}, 180000);

function updateTVGuides() {

    console.log('Update TV Guides');
    languages.map( function (language) {

        var url = 'http://www.arte.tv/guide/' + language + '/plus7/videos';

        tvGuideData[language] = [];
        arteJSONCompiler(url, 1, language);
    });
}

function arteJSONCompiler(url, page, language) {
    http.get(url + '?page=' + page + '&sort=newest', function(res) {
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

                if (videos[i].subtitle) {
                    videos[i].subtitle = '- ' + videos[i].subtitle;
                }

                videos[i].duration = (videos[i].duration / 60).toFixed(0);
                /*videos[i].channels = videos[i].video_channels.split(',');
                //console.log(finalJson[i].channels);
                videos[i].channels.map( function(channel) {
                    addChannel(language, channel.trim());
                });*/

            }

            tvGuideData[language] = tvGuideData[language].concat(videos);

            if (finalJson.more) {

                page++;
                arteJSONCompiler(url, page);
            }
        });
    }).on('error', function(e) {
        console.log("Got error: ", e);
    });
}

function addChannel(language, channel) {

    if (typeof channelData[language] === "undefined" ) {
        channelData[language] = {};
    }

    if (typeof channelData[language][channel] === "undefined" ) {
        channelData[language][channel] = { name : channel, count : 0};
    }
    else {
        channelData[language][channel].count++;
    }
}

updateTVGuides();

var express = require('express');
var hbs = require('express-hbs');
var app = express();

app.get('/', function (req, res) {

    var accept = req.acceptsLanguages(['fr', 'de']);

    if (accept == 'fr') {
        res.redirect('/fr');
    }
    else {
        res.redirect('/de');
    }

});

app.get('/:language', function (req, res) {

    var language = req.params.language;

    if (language === 'de' || language === 'fr') {
        res.render('index', {
            title: 'Arte plus7 viewer - Unofficial',
            shows: tvGuideData[language],
            channels: channelData[language]
        });
    }
    else {
        res.send('No such language.');
    }
});

var port = process.env.PORT || 5000;

var server = app.listen(port, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);

});

app.use(express.static('public'));
app.engine('hbs', hbs.express4({
    partialsDir: __dirname + '/views/partials'
}));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');