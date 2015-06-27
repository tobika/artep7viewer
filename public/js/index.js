$('img.lazy').show().lazyload();

$('img.lazy').lazyload({
    effect : "fadeIn"
});

$( ".channelfilter" ).on( 'click', function() {
    var channel = $(this).text();

    $('.show').hide();

    var selected = $('.show').filter(function() {

        return $(this).data('channels').indexOf(channel) >= 0;
    }).show();

    $('img.lazy').lazyload();
});