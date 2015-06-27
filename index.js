var Download = require('download');
var languages = ['fr','de'];

var updateTVGuidesInterval = setInterval(function(){

    updateTVGuides();
}, 60000);

function updateTVGuides() {

    console.log('Update TV Guides');
    languages.map( function (language) {

        new Download({mode: '755'})
            .get('http://www.arte.tv/guide/' + language + '/plus7.json')
            .rename('plus7' + language + '.json')
            .dest('.')
            .run();
    });
}

updateTVGuides();

var express = require('express');
var hbs = require('express-hbs');
var app = express();

app.get('/', function (req, res) {
    res.render('index', {
        title: 'My favorite veggies',
        body: 'qsdqsdqs'
    });
});

var server = app.listen(3000, function () {

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