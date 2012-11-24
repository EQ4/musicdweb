window.musicd = {};

$.request = $["\x61\x6a\x61\x78"]; // avoid the a-word

$.fn.onmethod = function(type, selector, object, method, preventDefault) {
    if (preventDefault) {
        this.on(type, selector, function(e) {
            e.preventDefault();

            return object[method].call(object, e);
        });
    } else {
        this.on(type, selector, object[method].bind(object));
    }
};

Number.prototype.pad = function(length) {
    var s = "" + this;
    while (s.length < length)
        s = "0" + s;
    
    return s;
};

musicd.formatTime = function(time, lengthHint) {
    if (!time)
        return "00:00";
    
    var s = (Math.floor((time % 3600) / 60).pad(2) + ":" +
        Math.floor(time % 60).pad(2));
    
    if ((lengthHint || time) >= 3600)
        s = Math.floor(time / 3600).pad(2) + ":" + s;
    
    return s;
}

musicd.Event = function Event() {
    
};

musicd.Event.prototype = {
    addListener: function(func) {
        if (!this._listeners)
            this._listeners = [];    
            
        this._listeners.push(func);
    },
    
    fire: function() {
        if (!this._listeners)
            return;
            
        var args = arguments;
        
        this._listeners.forEach(function(func) {
            func.apply(this, args);
        }, this);
    }
};

musicd.Session = function Session() {
    
}

musicd.Session.prototype = {
    getItem: function(key, defaultValue) {
        var val = localStorage.getItem(key);
        
        return (val !== undefined) ? val : defaultValue;
    },
    
    setItem: function(key, value) {
        localStorage.setItem(key, value);
    }
};

musicd.APIClient = function(url, authCallback) {
    this.authCallback = authCallback;
    this.queue = [];
    this._urlPrefix = url;
    this.request = null;
}

musicd.APIClient.prototype = {
    call: function(name, method, args, success) {
        if (name) {
            if (this.request && this.requestName && this.requestName == name)
                this.request.abort();

            this.queue = this.queue.filter(function(i) {
                return !(i.name && i.name === name);
            });
        }

        this.queue.push({
            name: name,
            method: method,
            args: args,
            success: success
        });

        this._executeNext();
    },
    
    getTrackURL: function(track, seek) {
        var url = this._urlPrefix + "open?id=" + track.id;
        
        if (seek)
            url += "&seek=" + seek;
        
        return url;
    },
    
    getAlbumImageUrl: function(track, size) {
        return this._urlPrefix + "albumimg?album=" + track.albumid + "&size=" + size;
    },

    _executeNext: function() {
        if (this.request || !this.queue.length)
            return;
        
        var r = this.queue[0];

        this.request = $.request({
            type: "GET",
            url: this._urlPrefix + r.method,
            data: r.args,
            dataType: "json",
            success: this._requestSuccess.bind(this),
            error: this._requestError.bind(this)
        });
        this.requestName = r.name;
    },

    _requestSuccess: function(res) {
        var r = this.queue.shift();

        r.success(res);

        this.request = null;
        this.requestName = null;

        this._executeNext();
    },

    _requestError: function(xhr) {
        if (xhr.status == 401) {
            this.authCallback(this);
        } else {
            if (xhr.getAllResponseHeaders())
                alert("API error");

            this.queue.shift();
    
            this.request = null;
            this.requestName = null;

            this._executeNext();
        }
    },

    authenticate: function(username, password, success, error) {
        $.request({
            type: "GET",
            url: this._urlPrefix + "login",
            args: {
                username: username,
                password: password
            },
            dataType: "json",
            success: function(res) {
                if (res.error) {
                    error(res.error);
                    return;
                }

                success();
                this._executeNext();
            },
            error: function(xhr) {
                alert("Auth fail (" + xhr.status + " " + xhr.statusText + ")");
            }
        }.bind(this))
    }
};

$(function() {
    musicd.api = new musicd.APIClient("http://lumpio.dy.fi:1337/");
    musicd.session = new musicd.Session();    
    
    musicd.player = new musicd.Player("#player", "#track-info");
    
    var search = new musicd.Search("#search", musicd.player);
    
    musicd.player.onStateChange.addListener(function(state) {
        window.postMessage({
            type: "STATE_CHANGE",
            text: state == musicd.Player.PLAYING ? "play" : "pause"
        }, "*");
    });
    
    window.addEventListener("message", function(e) {
        if (e.data.type == "TOGGLE_PLAY")
            musicd.player.togglePlay();
    });
});
