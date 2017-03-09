const express = require('express');
const hbs = require('express-hbs');
const arteDB = require('./src/arteDB');

const app = express();

// I am guilty of stackoverflow ;) http://stackoverflow.com/a/20429914
function nocache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

app.get('/', function (req, res) {
  const accept = req.acceptsLanguages(['fr', 'de']);

  if (accept === 'fr') {
    res.redirect('/fr');
  } else {
    res.redirect('/de');
  }
});

app.get('/:language', nocache, function (req, res) {
  if (!arteDB.dataLoaded) {
    res.render('starting');
    return;
  }

  const language = req.params.language;

  if (language === 'de' || language === 'fr') {
    res.render('index', {
      title: 'Arte plus7 viewer - Unofficial',
      shows: arteDB.tvGuideData[language],
      channels: arteDB.channelData[language]
    });
  } else {
    res.send('No such language.');
  }
});

const port = process.env.PORT || 5000;

const server = app.listen(port, function () {
  const host = server.address().address;

  console.log('Example app listening at http://%s:%s', host, port);
});

app.use(express.static('public'));
app.engine('hbs', hbs.express4({
  partialsDir: `${__dirname}/views/partials`
}));
app.set('view engine', 'hbs');
app.set('views', `${__dirname}/views`);

hbs.registerHelper('ifFirstSix', function(index, options) {
  if (index < 6) {
    return options.fn(this);
  }
  return options.inverse(this);
});
