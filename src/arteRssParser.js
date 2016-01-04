var FeedParser = require('feedparser'),
    request = require('request'),
    q = require('q');


function getArteRssElements(language) {

    var deferred = q.defer(),
        data = [];

    var req = request('http://www.arte.tv/papi/tvguide-flow/feeds/videos/' + language + '.xml?type=ARTE_PLUS_SEVEN&player=true')
        , feedparser = new FeedParser();

    req.on('error', function (error) {
        // handle any request errors
    });
    req.on('response', function (res) {
        var stream = this;

        if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

        stream.pipe(feedparser);
    });


    feedparser.on('error', function (error) {
        // always handle errors
    });
    feedparser.on('readable', function () {
        // This is where the action is!
        var stream = this
            , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
            , item;

        while (item = stream.read()) {
            //console.log(item.title);
            data.push(item);
        }
    });
    feedparser.on('end', function () {
        deferred.resolve(data);
    });

    return deferred.promise;
}

module.exports.getArteRssElements = getArteRssElements;