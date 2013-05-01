"use strict";

(function() {

window.musicd = {};

Number.prototype.pad = function(length) {
    var s = "" + this;
    while (s.length < length)
        s = "0" + s;

    return s;
};

musicd.log = function() {
    if (window.console && console.log)
        console.log.apply(console, arguments);
};

musicd.makeEnum = function() {
    var values = $.makeArray(arguments);

    for (var i = 0; i < values.length; i++)
        values[values[i]] = i;

    return values;
};

musicd.formatTime = function(time, lengthHint) {
    if (!time)
        return "00:00";

    var s = (Math.floor((time % 3600) / 60).pad(2) + ":" +
        Math.floor(time % 60).pad(2));

    if ((lengthHint || time) >= 3600)
        s = Math.floor(time / 3600).pad(2) + ":" + s;

    return s;
};

musicd.parseQueryString = function(qs) {
    var r = {};

    qs.split(/&/).forEach(function(pair) {
        var p = pair.indexOf("=");
        if (p == -1)
            r[decodeURIComponent(pair)] = true;
        else
            r[decodeURIComponent(pair.substr(0, p))] = decodeURIComponent(pair.substr(p + 1));
    });

    return r;
};

musicd.objectEquals = function(a, b) {
    if (!!a != !!b)
        return false;

    var key;
    for (key in a) {
        if (a[key] !== b[key])
            return false;
    }

    for (key in b) {
        if (a[key] !== b[key])
            return false;
    }

    return true;
};

})();
