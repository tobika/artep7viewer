const request = require('request');
const arteCategories = require('./arteCategories');
const moment = require('moment');
const Rx = require('rxjs');

const languages = ['fr', 'de'];

setInterval(function () {
  updateTVGuides();
}, 360000);

function createRequestDates() {
  let date = new Date();
  let dateArray = [];

  for (let i = 0; i < 2; i++) {
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
        module.exports.dataLoaded = true;
        console.log('Completed');
      }
    );
}

// function test(i, j) {
//   const delay = Math.floor(Math.random() * 2000) + 500;
//
//   return new Promise(function (resolve, reject) {
//     setTimeout(function () {
//       resolve({ i, j });
//     }, delay);
//   });
// }

function getShowsOfDate(date, language) {
  return new Promise(function (resolve, reject) {
    console.log(`request http://www.arte.tv/guide/api/api/program/${language}/scheduled/${date}`)
    request({ url: `http://www.arte.tv/guide/api/api/program/${language}/scheduled/${date}`, timeout: 10000 }, function (error, response, body) {
      try {
        const finalJson = JSON.parse(body);

        const shows = finalJson
          .filter(function (show) {
            return show.playable;
          })
          .map(function (show) {
            const showVideo = show.videos.filter(function (video) {
              return video.kind === 'SHOW';
            });

            const rightsEnd = showVideo[0].videoRightsEnd;

            return {
              id: show.program.programId,
              title: show.program.title,
              duration: (show.durationRounded / 60).toFixed(0),
              airdate_long: moment(show.broadcastBeginRounded).format('DD/MM/YYYY HH:mm'),
              url: show.program.url,
              rights_end: moment(rightsEnd).format('DD/MM/YYYY, hh:mm'),
              thumbnail_url: show.program.mainImage.url,
              subtitle: show.program.headerText,
              teaser: show.program.teaserText,
            };
          });

        resolve({ date, language, shows: shows.reverse() });
      } catch (e) {
        console.log('request error', e);
        reject(e);
      }
    });
  });
}


updateTVGuides();

module.exports.tvGuideData = {};
module.exports.channelData = arteCategories.categories;
module.exports.dataLoaded = false;
