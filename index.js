var express = require('express'),
    hbs = require('express-hbs'),
    arteDB = require('./src/arteDB'),
    app = express();

// I am guilty of stackoverflow ;) http://stackoverflow.com/a/20429914
function nocache(req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
}

app.get('/', function (req, res) {

    var accept = req.acceptsLanguages(['fr', 'de']);

    if (accept == 'fr') {
        res.redirect('/fr');
    }
    else {
        res.redirect('/de');
    }

});

app.get('/:language', nocache, function (req, res) {

    if (!arteDB.dataLoaded) {
        res.render('starting');
        return;
    }

    var language = req.params.language;

    if (language === 'de' || language === 'fr') {

        res.render('index', {
            title: 'Arte plus7 viewer - Unofficial',
            shows: arteDB.tvGuideData[language],
            channels: arteDB.channelData[language]
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