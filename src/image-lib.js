"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var ImageLib = /** @class */ (function () {
    function ImageLib() {
    }
    ImageLib.generate = function (gen, width, height) {
        if (height === void 0) { height = width; }
    };
    ImageLib.filter = function () {
    };
    ImageLib.createCanvas = function (width, height) {
        if (height === void 0) { height = width; }
        var cnv = document.createElement('canvas');
        cnv.width = width;
        cnv.height = height;
        return cnv;
    };
    ImageLib.createCanvasContext = function (width, height) {
        var cnv = this.createCanvas(width, height);
        var ctx = cnv.getContext("2d");
        return ctx;
    };
    ImageLib.createImageFromCanvas = function (canvas) {
        var img = new Image();
        img.src = canvas.toDataURL();
        return img;
    };
    return ImageLib;
}());
exports.ImageLib = ImageLib;
var PixelMap = /** @class */ (function () {
    function PixelMap(width, height, initialValue) {
        this.width = width;
        this.height = height;
        this.initialValue = initialValue instanceof Function ? initialValue(0, 0) : initialValue;
        var generator = initialValue instanceof Function ? initialValue : function () { return initialValue; };
        // Set up pixel data
        this.data = [];
        for (var y = 0; y < height; y++) {
            var row = [];
            this.data[y] = row;
            for (var x = 0; x < width; x++) {
                row[x] = generator(x, y);
            }
        }
    }
    PixelMap.prototype.forEach = function (processor) {
        for (var y = 0; y < this.height; y++) {
            var row = this.data[y];
            for (var x = 0; x < this.width; x++) {
                processor(x, y, row[y]);
            }
        }
        return this;
    };
    PixelMap.prototype.fill = function (generator) {
        var _this = this;
        if (generator instanceof Function) {
            // Generator function
            return this.forEach(function (x, y) { return _this.data[y][x] = generator(x, y); });
        }
        else {
            // Constant values
            return this.forEach(function (x, y) { return _this.data[y][x] = generator; });
        }
    };
    PixelMap.prototype.filter = function (filter) {
        var _this = this;
        return this.forEach(function (x, y, value) { return _this.data[y][x] = filter(value, x, y); });
    };
    PixelMap.prototype.filterBuffered = function (filter) {
        var newData = [];
        for (var y = 0; y < this.height; y++) {
            var row = [];
            newData[y] = row;
            for (var x = 0; x < this.width; x++) {
                row[x] = filter(this.data[y][x], x, y);
            }
        }
        this.data = newData;
    };
    PixelMap.prototype.crop = function (x0, y0, w, h) {
        var _this = this;
        if (w === void 0) { w = this.width - x0; }
        if (h === void 0) { h = this.height - y0; }
        var initial = this.initialValue;
        var other = this.clone(w, h);
        other.fill(function (x, y) { var _a, _b; return (_b = (_a = _this.data[y0 + y]) === null || _a === void 0 ? void 0 : _a[x0 + x]) !== null && _b !== void 0 ? _b : initial; });
        return other;
    };
    PixelMap.prototype.resize = function (width, height) {
        var _this = this;
        var other = this.clone(width, height);
        var xf = (this.width - 1) / (width - 1);
        var yf = (this.height - 1) / (height - 1);
        return other.fill(function (x, y) {
            var sx = x * xf, sy = y * yf;
            var sx0 = Math.floor(sx), sy0 = Math.floor(sy), sx1 = Math.ceil(sx), sy1 = Math.ceil(sy);
            var sfx = sx - sx0;
            var top = _this.blend(_this.data[sy0][sx0], _this.data[sy0][sx1], sfx);
            var btm = _this.blend(_this.data[sy1][sx0], _this.data[sy1][sx1], sfx);
            return _this.blend(top, btm, sy - sy0);
        });
    };
    PixelMap.prototype.resizeSmooth = function (width, height) {
        var sx = width / this.width, sy = height / this.height;
        return this.scaleSmooth(sx, sy);
    };
    PixelMap.prototype.scale = function (scaleX, scaleY) {
        if (scaleY === void 0) { scaleY = scaleX; }
        var w = Math.round(this.width * scaleX);
        var h = Math.round(this.height * scaleY);
        return this.resize(w, h);
    };
    PixelMap.prototype.scaleSmooth = function (scaleX, scaleY) {
        // Early exit in case regular scaling is equally good (smooth scaling only helps for shrinking images by more than 2x)
        if (scaleX >= 0.5 && scaleY >= 0.5) {
            return this.scale(scaleX, scaleY);
        }
        // Sufficient shrinking required to split into multiple steps
        // We perform one scaling step limited to 2x, followed by a ~recursive call to smooth scaling for the rest
        var sx = Math.max(scaleX, 0.5), sy = Math.max(scaleY, 0.5);
        return this.scale(sx, sy).scaleSmooth(scaleX / sx, scaleY / sy);
    };
    PixelMap.prototype.toCanvas = function () {
        var _this = this;
        var ctx = ImageLib.createCanvasContext(this.width, this.height);
        var imageData = ctx.createImageData(this.width, this.height);
        var data = imageData.data;
        // Apply pixel color
        this.forEach(function (x, y, value) {
            var color = _this.toColor(value);
            var p = 4 * (x + _this.width * y);
            data[p] = color[0];
            data[p + 1] = color[1];
            data[p + 2] = color[2];
            data[p + 3] = color[3];
        });
        ctx.putImageData(imageData, 0, 0);
        return ctx.canvas;
    };
    PixelMap.prototype.toImage = function () {
        var cnv = this.toCanvas();
        return ImageLib.createImageFromCanvas(cnv);
    };
    return PixelMap;
}());
exports.PixelMap = PixelMap;
var RGBAPixelMap = /** @class */ (function (_super) {
    __extends(RGBAPixelMap, _super);
    function RGBAPixelMap(width, height, initialValue) {
        if (height === void 0) { height = width; }
        if (initialValue === void 0) { initialValue = [255, 255, 255, 255]; }
        return _super.call(this, width, height, initialValue) || this;
    }
    RGBAPixelMap.prototype.toColor = function (v) { return v; };
    RGBAPixelMap.prototype.clone = function (width, height) {
        var _this = this;
        if (width === void 0) { width = this.width; }
        if (height === void 0) { height = this.height; }
        return new RGBAPixelMap(width, height, function (x, y) { return _this.data[y][x]; });
    };
    RGBAPixelMap.prototype.blend = function (a, b, f) {
        var alphaA = a[3] * (1 - f), alphaB = b[3] * f;
        var fullAlpha = Math.max(alphaA + alphaB, 0.001);
        var fB = alphaB / fullAlpha, fA = 1 - fB;
        return [
            fB * b[0] + fA * a[0],
            fB * b[1] + fA * a[1],
            fB * b[2] + fA * a[2],
            fullAlpha,
        ];
    };
    RGBAPixelMap.prototype.toRGB = function (backgroundColor) {
        var _this = this;
        if (backgroundColor === void 0) { backgroundColor = [255, 255, 255]; }
        var br = 0, bg = 0, bb = 0;
        if (backgroundColor instanceof Array) {
            br = backgroundColor[0];
            bg = backgroundColor[1];
            bb = backgroundColor[2];
        }
        else {
            br = backgroundColor;
            bg = backgroundColor;
            bb = backgroundColor;
        }
        return new RGBPixelMap(this.width, this.height, function (x, y) {
            var c = _this.data[y][x];
            var a = c[3], a1 = 1 - a;
            return [
                a * c[0] + a1 * br,
                a * c[1] + a1 * bg,
                a * c[2] + a1 * bb,
            ];
        });
    };
    return RGBAPixelMap;
}(PixelMap));
exports.RGBAPixelMap = RGBAPixelMap;
var RGBPixelMap = /** @class */ (function (_super) {
    __extends(RGBPixelMap, _super);
    function RGBPixelMap(width, height, initialValue) {
        if (height === void 0) { height = width; }
        if (initialValue === void 0) { initialValue = [255, 255, 255]; }
        return _super.call(this, width, height, initialValue) || this;
    }
    RGBPixelMap.prototype.toColor = function (v) { return [v[0], v[1], v[2], 255]; };
    RGBPixelMap.prototype.clone = function (width, height) {
        var _this = this;
        if (width === void 0) { width = this.width; }
        if (height === void 0) { height = this.height; }
        return new RGBPixelMap(width, height, function (x, y) { return _this.data[y][x]; });
    };
    RGBPixelMap.prototype.blend = function (a, b, f) {
        var f1 = 1 - f;
        return [
            f * b[0] + f1 * a[0],
            f * b[1] + f1 * a[1],
            f * b[2] + f1 * a[2]
        ];
    };
    RGBPixelMap.prototype.toRGBA = function (alpha) {
        var _this = this;
        if (alpha === void 0) { alpha = 255; }
        return new RGBAPixelMap(this.width, this.height, function (x, y) { return __spreadArrays(_this.data[y][x], [alpha]); });
    };
    RGBPixelMap.prototype.toGrayscale = function (fr, fg, fb) {
        var _this = this;
        if (fr === void 0) { fr = 0.2989; }
        if (fg === void 0) { fg = 0.5870; }
        if (fb === void 0) { fb = 0.1140; }
        return new GrayscalePixelMap(this.width, this.height, function (x, y) {
            var c = _this.data[y][x];
            return fr * c[0] + fg * c[1] + fb * c[2];
        });
    };
    return RGBPixelMap;
}(PixelMap));
exports.RGBPixelMap = RGBPixelMap;
var GrayscalePixelMap = /** @class */ (function (_super) {
    __extends(GrayscalePixelMap, _super);
    function GrayscalePixelMap(width, height, initialValue) {
        if (height === void 0) { height = width; }
        if (initialValue === void 0) { initialValue = 0; }
        return _super.call(this, width, height, initialValue) || this;
    }
    GrayscalePixelMap.prototype.toColor = function (v) { return [v, v, v, 255]; };
    GrayscalePixelMap.prototype.clone = function (width, height) {
        var _this = this;
        if (width === void 0) { width = this.width; }
        if (height === void 0) { height = this.height; }
        return new GrayscalePixelMap(width, height, function (x, y) { return _this.data[y][x]; });
    };
    GrayscalePixelMap.prototype.blend = function (a, b, f) { return f * b + (1 - f) * a; };
    GrayscalePixelMap.prototype.toRGB = function () {
        var _this = this;
        return new RGBPixelMap(this.width, this.height, function (x, y) {
            var c = _this.data[y][x];
            return [c, c, c];
        });
    };
    return GrayscalePixelMap;
}(PixelMap));
exports.GrayscalePixelMap = GrayscalePixelMap;
var BoolPixelMap = /** @class */ (function (_super) {
    __extends(BoolPixelMap, _super);
    function BoolPixelMap(width, height, initialValue) {
        if (height === void 0) { height = width; }
        if (initialValue === void 0) { initialValue = false; }
        return _super.call(this, width, height, initialValue) || this;
    }
    BoolPixelMap.prototype.toColor = function (v) { var c = v ? 255 : 0; return [c, c, c, 255]; };
    BoolPixelMap.prototype.clone = function (width, height) {
        var _this = this;
        if (width === void 0) { width = this.width; }
        if (height === void 0) { height = this.height; }
        return new BoolPixelMap(width, height, function (x, y) { return _this.data[y][x]; });
    };
    BoolPixelMap.prototype.blend = function (a, b, f) { return f > 0.5 ? b : a; };
    return BoolPixelMap;
}(PixelMap));
exports.BoolPixelMap = BoolPixelMap;
