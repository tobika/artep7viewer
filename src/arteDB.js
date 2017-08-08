const request = require('request');
const moment = require('moment');
const Rx = require('rxjs');

const languages = ['fr', 'de'];

setInterval(function () {
  updateTVGuides();
}, 360000);

function createRequestDates() {
  let date = new Date();
  let dateArray = [];

  for (let i = 0; i < 7; i++) {
    dateArray.push(moment(date).format('YY-MM-DD'));
    date.setDate(date.getDate() - 1);
  }

  return dateArray;
}

function updateTVGuides() {
  const requestDates = createRequestDates();
  let tmpTvGuideData = { fr: [], de: [] };

  Rx.Observable.from(languages)
    .flatMap(function (language) {
      return Rx.Observable.from(requestDates)
        .concatMap(function (date) {
          return getShowsOfDate(date, language);
        });
    })
    .subscribe(
      function (shows) {
        tmpTvGuideData[shows.language].push({ date: shows.date, shows: shows.shows });
      },
      function (err) {
        console.log('Error: ', err);
      },
      function () {
        module.exports.tvGuideData = tmpTvGuideData;
        // module.exports.channelData.fr = extractCategories(tmpTvGuideData, 'fr');
        // module.exports.channelData.de = extractCategories(tmpTvGuideData, 'de');
        module.exports.dataLoaded = true;
        console.log('Completed');
      }
    );
}

function extractCategories(tvGuideData, language) {
  const allShowsFlattened = [].concat(...tvGuideData[language]
    .map(function (tvGuideDataPerDay) {
      return tvGuideDataPerDay.shows;
    }));

  const tmpCategories = allShowsFlattened.reduce(function (categories, show) {
    if (categories[show.channels]) {
      categories[show.channels]++;
    } else {
      categories[show.channels] = 1;
    }

    return categories;
  }, {});

  return categories2Array(tmpCategories);
}

function categories2Array(categoriesObject) {
  let categoriesArray = [];

  for (let key in categoriesObject) {
    categoriesArray.push({
      name: key,
      count: categoriesObject[key],
    });
  }

  return categoriesArray;
}

function getShowsOfDate(date, language) {
  return new Promise(function (resolve, reject) {
    console.log(`http://www.arte.tv/guide/api/api/pages/${language}/web/tv_guide?day=${date}`)
    request({ url: `http://www.arte.tv/guide/api/api/pages/${language}/web/tv_guide?day=${date}`, timeout: 10000 }, function (error, response, body) {
      try {
        const rawShowData = JSON.parse(body);
        const shows = transformShowData(rawShowData);

        resolve({ date, language, shows: shows.reverse() });
      } catch (e) {
        console.log('request error', e);
        reject(e);
      }
    });
  });
}

function transformShowData(rawShowData) {
  return rawShowData.zones[1].teasers
    .filter(function (show) {
      // return show.playable && moment(show.broadcastBeginRounded).toDate() < new Date();
      return show.stickers[0]
        && show.stickers[0].code === 'PLAYABLE'
        && moment(show.beginsAt).toDate() < new Date();
    })
    .map(function (show) {
      return {
        id: show.id,
        title: show.title,
        // duration: (show.durationRounded / 60).toFixed(0),
        airdate_long: moment(show.beginsAt).format('DD/MM/YYYY HH:mm'),
        url: show.url,
        // rights_end: moment(rightsEnd).format('DD/MM/YYYY, hh:mm'),
        thumbnail_url: show.images[1].url,
        subtitle: show.subtitle,
        // teaser: show.program.teaserText,
        // channels: show.program.category.name,
      };
    });
}

updateTVGuides();

module.exports.tvGuideData = {};
module.exports.channelData = {};
module.exports.dataLoaded = false;
