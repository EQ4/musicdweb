"use strict";

musicd.TrackInfo = function() {
    var self = this;

    self.track = ko.observable();

    self.detailsVisible = musicd.observableSetting("TrackInfo.detailsVisible");

    self.albumArt = new musicd.AlbumArt(self.track);

    self.lyricsLoading = ko.observable(false);
    self.lyrics = ko.observable(null);

    self.lyricsOffset = ko.observable();
    self.lyricsMaxHeight = ko.computed(function() {
        var offs = self.lyricsOffset();

        return offs ? (musicd.windowHeight() - offs.top - 10) + "px" : 0;
    });

    ko.computed(function() {
        var track = self.track();

        self.albumArt.track(track);

        self.lyrics(null);

        if (track) {
            self.lyricsLoading(true);

            musicd.api.call(null, "track/lyrics", { id: track.id }, function(r) {
                self.lyricsLoading(false);
                self.lyrics(r);
            }, function (xhr) {
                self.lyricsLoading(false);

                return true;
            });

            document.title = [track.title, track.album, track.artist, "musicd"]
                .filter(function(n) { return n; }).join(" :: ");
        } else {
            document.title = "musicd";
        }

        musicd.notifyLayoutChange();
    });
};

musicd.TrackInfo.prototype = {
    toggleDetails: function() {
        this.detailsVisible(!this.detailsVisible());
    }
};

musicd.AlbumArt = function(track) {
    var self = this;

    self.track = track;

    self.loading = ko.observable(false);
    self.url = ko.observable("dummy://");

    ko.computed(function() {
        var track = self.track();

        if (track && track.albumid) {
            var src = musicd.api.getAlbumImageURL(track.albumid, 256);

            self.loading(true);
            $("<img>").one("load error", function(e) {
                if (!self.track() || self.track().id != track.id)
                    return;

                self.url(e.type == "load" ? src : "dummy://");
                self.loading(false);
            }).attr("src", src);

            setTimeout(musicd.notifyLayoutChange, 100); // TODO: kludge
        } else {
            self.url("dummy://");
        }

        musicd.notifyLayoutChange();
    });
};
