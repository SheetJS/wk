"use strict";
exports.__esModule = true;
function center_str(s, w) {
    if (s.length >= w)
        return s.substr(0, w);
    var pl = (w - s.length) >> 1;
    return new Array(pl + 1).join(" ") + s + new Array(w - s.length - pl + 1).join(" ");
}
exports.center_str = center_str;
function right_str(s, w) {
    if (s.length >= w)
        return s.substr(0, w);
    var l = (w - s.length);
    return new Array(l + 1).join(" ") + s;
}
exports.right_str = right_str;
function left_str(s, w) {
    if (s.length >= w)
        return s.substr(0, w);
    var l = (w - s.length);
    return s + new Array(l + 1).join(" ");
}
exports.left_str = left_str;
