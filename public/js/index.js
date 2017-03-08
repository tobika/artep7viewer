(function () {
  'use strict';

  var myLazyLoad = new LazyLoad({
    // example of options object -> see options section
    //threshold: 500,
    //container: document.querySelector('.container'),
    elements_selector: 'img.lazy',
    throttle: 200,
    //data_src: "src",
    //data_srcset: "srcset",
    //callback_set: function() { /* ... */ }
  });

  $('.channelfilter').on('click', function () {
    var channel = $(this).text();
    var $allShows = $('.show');

    if (channel === 'All') {
      $allShows.show();
      return;
    }

    $allShows.hide();

    $allShows.filter(function () {
      return $(this).data('channels').indexOf(channel) >= 0;
    }).show();

    myLazyLoad.handleScroll();
  });

  function getFirstShowID() {
    return $('.show').first().data('em');
  }

  function getShowByID(id) {
    return $('.show').filter(function () {
      return $(this).data('em') === id;
    });
  }

  function getShowByIndex(index) {
    return $('.show').filter(function () {
      return $(this).data('index') === index;
    });
  }

  function colorNewShows() {
    if (!Lockr.get('newestID')) {
      Lockr.set('newestID', getFirstShowID());
    } else {
      getShowByID(Lockr.get('newestID')).prevAll().addClass('new');
      Lockr.set('newestID', getFirstShowID());
    }
  }

  $(document).ready(function () {
    $('#channels').sticky({ topSpacing: 0 });
    colorNewShows();

    $('#container-search').hideseek({
      ignore_accents: true,
      highlight: true
    });

    $('#container-search').on('_after', function () {
      myLazyLoad.handleScroll();
    });
  });
}());
