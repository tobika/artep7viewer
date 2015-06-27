var http = require('http');
var languages = ['fr','de'];
var tvGuideData = {};

var updateTVGuidesInterval = setInterval(function(){

    updateTVGuides();
}, 180000);

function updateTVGuides() {

    console.log('Update TV Guides');
    languages.map( function (language) {

        var url = 'http://www.arte.tv/guide/' + language + '/plus7.json';

        http.get(url, function(res) {
            var jsonBody = '';

            res.on('data', function(chunk) {
                jsonBody += chunk;
            });

            res.on('end', function() {
                var finalJson = JSON.parse(jsonBody).videos;

                for (var i = 0, y = finalJson.length; i < y; i++) {
                    // remove autoplay from arte show urls
                    finalJson[i].url = finalJson[i].url.replace(/=1/i, '=0');
                }

                tvGuideData[language] = finalJson;
            });
        }).on('error', function(e) {
            console.log("Got error: ", e);
        });
    });
}

updateTVGuides();

var express = require('express');
var hbs = require('express-hbs');
var app = express();

app.get('/', function (req, res) {

    res.redirect('/de');
});

app.get('/:language', function (req, res) {

    var language = req.params.language;

    if (language === 'de' || language === 'fr') {
        res.render('index', {
            title: 'Unofficial Arte plus7 viewer',
            shows: tvGuideData[language]
        });
    }
    else {
        res.send('No such language.');
    }
});

var server = app.listen(3023, function () {

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