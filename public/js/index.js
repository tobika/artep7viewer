(function() {
    'use strict';

    $('img.lazy').show().lazyload({
        effect : "fadeIn",
        skip_invisible : true
    });

    $( ".channelfilter" ).on( 'click', function() {

        var channel = $(this).text(),
            $allShows = $('.show');

        if (channel === 'All') {
            $allShows.show();
            return;
        }

        $allShows.hide();

        var selected = $allShows.filter(function() {

            return $(this).data('channels').indexOf(channel) >= 0;
        }).show();

        $('img.lazy').lazyload();
    });

    function getFirstShowID() {

        return $('.show').first().data('em');
    }

    function getShowByID(id) {

        return $('.show').filter( function() {
            return $(this).data('em') == id;
        });
    }

    function getShowByIndex(index) {

        return $('.show').filter( function() {
            return $(this).data('index') == index;
        });
    }

    function colorNewShows(id) {

        if (!Lockr.get('newestID')) {

            Lockr.set('newestID', getFirstShowID());
        }
        else {

            //test feature
            //Lockr.set('newestID', '048711-008');

            getShowByID(Lockr.get('newestID')).prevAll().addClass('new');
            Lockr.set('newestID', getFirstShowID());
        }
    }

    $(document).ready(function(){

        $("#channels").sticky({topSpacing:0});
        colorNewShows();

        $('#container-search').hideseek( {
            ignore_accents: true,
            highlight: true
        });

        $('#container-search').on("_after", function() {
            $('img.lazy').lazyload();
        });
    });
})();