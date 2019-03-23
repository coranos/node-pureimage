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
    const cA0 = cA / 255.;
    const aA0 = aA / 255.;
    const cB0 = cB / 255.;
    const aB0 = aB / 255.;
    const numeratorL = (cA0 * aA0);
    const numeratorR = (cB0 * aB0);
    const numerator = numeratorL + (numeratorR * (1. - aA0));
    const denominator = (aA0 + (aB0 * (1. - aA0)));
    let result = numerator / denominator;
    if ((aA == 0) && (aB == 0)) {
      result = 0;
    }
    const retval = Math.trunc(result * 255);

    if (retval != cB) {
      console.log('alphaBlend0', cA0, aA0, cB0, aB0, result, retval);
      console.log('alphaBlend1', numerator, denominator);
      console.log('alphaBlend2', numeratorL, numeratorR);
      console.trace('alphaBlend3', cA, aA, cB, aB, 'returns', retval, 'not', cB);
    }
    return cB;
    // return retval;
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
    const alphaL0 = alphaL / 255;
    const alphaR0 = alphaR / 255;
    const result = (alphaL0 + (alphaR0 * (1 - alphaL0)));
    const retval = Math.trunc(result * 255);
    // console.log('alphaBlendAlpha', alphaL, alphaR, retval);
    if (retval != alphaR) {
      console.log('alphaBlend', alphaL, alphaR, 'returns', retval, 'not', alphaR);

    }

    // return retval;
    return alphaR;
  }

  alphaBlendAlphaChannel(ix, bytes) {
    const alphaL = this.data[ix + 3];
    const alphaR = bytes[3];
    const result = this.alphaBlendAlpha(alphaL, alphaR);
    this.data[ix + 3] = result;
  }

  alphaBlendPixel(ix, bytes) {
    this.alphaBlendColorChannel(ix, 0, bytes);
    this.alphaBlendColorChannel(ix, 1, bytes);
    this.alphaBlendColorChannel(ix, 2, bytes);
    this.alphaBlendAlphaChannel(ix, bytes);
  }

  NOT_setPixelRGBA(x, y, rgba) {
    let i = this.calculateIndex(x, y);
    const bytes = uint32.getBytesBigEndian(rgba);
    this.alphaBlendPixel(i, bytes);
  }

  NOT_setPixelRGBA_i(x, y, r, g, b, a) {
    let i = this.calculateIndex(x, y);
    let alphaL = this.data[i + 3];
    let alphaR = a;
    this.data[i + 0] = this.alphaBlend(this.data[i + 0], alphaL, r, alphaR);
    this.data[i + 1] = this.alphaBlend(this.data[i + 1], alphaL, g, alphaR);
    this.data[i + 2] = this.alphaBlend(this.data[i + 2], alphaL, b, alphaR);
    this.data[i + 3] = this.alphaBlendAlpha(alphaL, alphaR);
  }

  setPixelRGBA(x,y,rgba) {
       let i = this.calculateIndex(x, y);
       const bytes = uint32.getBytesBigEndian(rgba);
       this.data[i+0] = bytes[0];
       this.data[i+1] = bytes[1];
       this.data[i+2] = bytes[2];
       this.data[i+3] = bytes[3];
   }
   setPixelRGBA_i(x,y,r,g,b,a) {
       let i = this.calculateIndex(x, y);
       this.data[i+0] = r;
       this.data[i+1] = g;
       this.data[i+2] = b;
       this.data[i+3] = a;
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
