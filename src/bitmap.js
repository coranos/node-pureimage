"use strict";
var uint32 = require('./uint32');
var Context = require('./context');

class Bitmap {
  constructor(w, h, options) {
    this.width = Math.floor(w);
    this.height = Math.floor(h);
    this.data = Buffer.alloc(w * h * 4);
    var fillval = 0x000000FF;
    for (var j = 0; j < h; j++) {
      for (var i = 0; i < w; i++) {
        this.setPixelRGBA(i, j, fillval);
      }
    }

  }
  calculateIndex(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
    return (this.width * y + x) * 4;
  }

  alphaBlend(cA, aA, cB, aB) {
    cA /= 255;
    aA /= 255;
    cB /= 255;
    aB /= 255;
    const result = (cA * aA) + ((cB * aB) * (1 - aA)) /
      (aA + (aB * (1 - aA)))
    return Math.trunc(result * 255);
  }

  alphaBlendColorChannel(ix, channelIx, bytes) {
    const alphaL = this.data[ix + 3];
    const alphaR = bytes[3];
    const colorL = this.data[ix + channelIx];
    const colorR = bytes[channelIx];
    const result = this.alphaBlend(colorL, alphaL, colorR, alphaR);
    // console.log('alphaBlendColorChannel', colorL, alphaL, colorR, alphaR, result);
    this.data[ix + channelIx] = result;
  }

  alphaBlendAlpha(alphaL, alphaR) {
    alphaL /= 255;
    alphaR /= 255;
    const result = (alphaL + (alphaR * (1 - alphaL)));
    const retval = Math.trunc(result * 255);
    // console.log('alphaBlendAlpha', alphaL, alphaR, retval);
    return retval;
  }

  alphaBlendAlphaChannel(ix, bytes) {
    const alphaL = this.data[ix + 3];
    const alphaR = bytes[3];
    const result = this.alphaBlendAlpha(alphaL, alphaR);
    this.data[ix + 3] = result;
  }

  alphaBlendPixel(ix, bytes) {
    this.alphaBlendColorChannel(ix, 1, bytes);
    this.alphaBlendColorChannel(ix, 2, bytes);
    this.alphaBlendColorChannel(ix, 3, bytes);
    this.alphaBlendAlphaChannel(ix, bytes);
  }

  setPixelRGBA(x, y, rgba) {
    let i = this.calculateIndex(x, y);
    const bytes = uint32.getBytesBigEndian(rgba);
    this.alphaBlendPixel(i, bytes);
  }

  setPixelRGBA_i(x, y, r, g, b, a) {
    let i = this.calculateIndex(x, y);
    let alphaL = this.data[i + 3];
    let alphaR = a;
    this.data[i + 0] = this.alphaBlend(this.data[i + 0], alphaL, r, alphaR);
    this.data[i + 1] = this.alphaBlend(this.data[i + 1], alphaL, g, alphaR);
    this.data[i + 2] = this.alphaBlend(this.data[i + 2], alphaL, b, alphaR);
    this.data[i + 3] = this.alphaBlendAlpha(alphaL, alphaR);
  }

  getPixelRGBA(x, y) {
    let i = this.calculateIndex(x, y);
    return uint32.fromBytesBigEndian(
      this.data[i + 0],
      this.data[i + 1],
      this.data[i + 2],
      this.data[i + 3]);
  }
  getPixelRGBA_separate(x, y) {
    var i = this.calculateIndex(x, y);
    return this.data.slice(i, i + 4);
  }
  getContext(type) {
    return new Context(this);
  }
}
module.exports = Bitmap;
