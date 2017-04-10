const request = require('request');
const q = require('q');
const arteCategories = require('./arteCategories');
const moment = require('moment');

const languages = ['fr', 'de'];
const tmpTvGuideData = {};

setInterval(function () {
  updateTVGuides();
}, 360000);

function updateTVGuides() {
  console.log('Update TV Guides');
  getAllShows().then(function () {
    console.log('Updated');
    return getAllCategories('fr');
  }).then(function () {
    return getAllCategories('de');
  }).then(function () {
    //clone the object, continue research for better implementation
    module.exports.tvGuideData = JSON.parse(JSON.stringify(tmpTvGuideData));

    module.exports.dataLoaded = true;
    console.log('Categories updated');
  });
}

function getAllShows() {
  var deferredAll = [];

  languages.forEach(function (language) {
    var deferred = q.defer();
    deferredAll.push(deferred.promise);

    arteJSONCompiler(`http://www.arte.tv/guide/${language}/plus7/videos?`, 1, function (data) {
      const newData = data
        .filter(function (entry) {
          return moment(entry.scheduled_on).diff(moment(), 'days') > -7;
        }).map(function (entry) {
          // remove autoplay from arte show urls
          entry.url = entry.url.replace(/=1/i, '=0');
          entry.duration = (entry.duration / 60).toFixed(0);
          entry.airdate_long = moment(entry.scheduled_on).format('DD/MM/YYYY');
          entry.rights_end = moment(entry.rights_end).format('DD/MM/YYYY, hh:mm');
          entry.channels = '';

          if (entry.thumbnails[4]) {
            entry.thumbnail_url = entry.thumbnails[4].url;
          }

          return entry;
        });

      tmpTvGuideData[language] = newData;
      deferred.resolve();
    });
  });

  return q.all(deferredAll);
}

function getAllCategories(language) {
  var deferredAll = [];

  arteCategories.categories[language].forEach(function (category) {
    var deferred = q.defer();
    deferredAll.push(deferred.promise);

    category.count = 0;

    arteJSONCompiler(`http://www.arte.tv/guide/${language}/plus7/videos?category=${category.code}&`, 1, function (data) {
      data.filter(function (entry) {
        return moment(entry.scheduled_on).diff(moment(),'days') > -7;
      }).forEach(function (entry) {
        addCategoryToShow(entry.id, category, language);
      });

      deferred.resolve();
    });
  });

  return q.all(deferredAll);
}

function addCategoryToShow(id, category, language) {
  // do this for both languages
  var show = getShowFromId(id, language);

  category.count++;

  if (show) {
    if (show.channels) {
      show.channels += `, ${category.name}`;
    } else {
      show.channels += category.name;
    }
  }
}

function getShowFromId(id, language) {
  for (let i = 0, y = tmpTvGuideData[language].length; i < y; i++) {
    if (tmpTvGuideData[language][i].id === id) {
      return tmpTvGuideData[language][i];
    }
  }

  return false;
}

function arteJSONCompiler(url, page, callback, tmpArray) {
  tmpArray = tmpArray || [];

  console.log(`Request: ${url}page=${page}&limit=72&sort=newest`);

  request({ url: `${url}page=${page}&limit=72&sort=newest`, timeout: 10000 }, function (error, response, body) {
    try {
      const finalJson = JSON.parse(body);
      const videos = finalJson.videos;

      tmpArray = tmpArray.concat(videos);

      if (finalJson.has_more) {
        page++;
        arteJSONCompiler(url, page, callback, tmpArray);
      } else {
        console.log(`Got JSON: ${url} with ${page} requests.`);
        callback(tmpArray);
      }
    } catch (e) {
      console.log('request error: retry');
      arteJSONCompiler(url, page, callback, tmpArray);
    }
  });
}

updateTVGuides();

module.exports.tvGuideData = {};
module.exports.channelData = arteCategories.categories;
module.exports.dataLoaded = false;
