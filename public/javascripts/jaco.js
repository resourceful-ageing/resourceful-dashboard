$(document).ready(function() {
(function(e, t) {
    function r(e, t) {
        e[t] = function() {
            e.push([ t ].concat(Array.prototype.slice.call(arguments, 0)));
        };
    }
    var n = "JacoRecorder";
    (function(e, t, i, s) {
        if (!i.__VERSION) {
            e[n] = i;
            var o = [ "init", "identify", "startRecording", "stopRecording", "removeUserTracking", "setUserInfo" ];
            for (var u = 0; u < o.length; u++) r(i, o[u]);
            i.__VERSION = 2, i.__INIT_TIME = 1 * new Date;
            var a = t.createElement("script");
            a.async = !0, a.setAttribute("crossorigin", "anonymous"), a.src = s;
            var f = t.getElementsByTagName("head")[0];
            f.appendChild(a);
        }
    })(e, t, e[n] || [], "//recorder-assets.getjaco.com/recorder_v2.js");
}).call(window, window, document), window.JacoRecorder.push([ "init", "163e79ee-c906-47f3-8894-827a1add7d6b", {} ]);

});
