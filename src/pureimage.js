// Pure Image uses existing libraries for font parsing, jpeg/png encode/decode
// and borrowed code for transform management and unsigned integer manipulation

// 2014-11-14  line count: 418, 411, 407, 376, 379, 367
// 2014-11-15  line count: 401, 399, 386, 369, 349,


const fs = require('fs');
const PNG = require('pngjs').PNG;
const JPEG = require('jpeg-js');
const uint32 = require('./uint32');
const Bitmap = require('./bitmap');
const text = require('./text');


exports.make = function(w, h, options) {
  return new Bitmap(w, h, options);
};

exports.encodePNGToStream = function(bitmap, outstream) {
  return new Promise((res, rej) => {
    const png = new PNG({
      width: bitmap.width,
      height: bitmap.height,
    });

    for (let i = 0; i < bitmap.width; i++) {
      for (let j = 0; j < bitmap.height; j++) {
        const rgba = bitmap.getPixelRGBA(i, j);
        const n = (j * bitmap.width + i) * 4;
        const bytes = uint32.getBytesBigEndian(rgba);
        for (let k = 0; k < 4; k++) {
          png.data[n + k] = bytes[k];
        }
      }
    }

    png.pack()
        .pipe(outstream)
        .on('finish', () => {
          res();
        })
        .on('error', (err) => {
          rej(err);
        });
  });
};

exports.encodeJPEGToStream = function(img, outstream) {
  return new Promise((res, rej) => {
    const data = {
      data: img.data,
      width: img.width,
      height: img.height,
    };
    outstream.on('error', (err) => rej(err));
    outstream.write(JPEG.encode(data, 50).data, () => res());
  });
};

exports.decodeJPEGFromStream = function(data) {
  return new Promise((res, rej) => {
    try {
      const chunks = [];
      data.on('data', (chunk) => {
        chunks.push(chunk);
      });
      data.on('end', () => {
        const buf = Buffer.concat(chunks);
        const rawImageData = JPEG.decode(buf);
        const bitmap = new Bitmap(rawImageData.width, rawImageData.height);
        for (let i = 0; i < rawImageData.width; i++) {
          for (let j = 0; j < rawImageData.height; j++) {
            const n = (j * rawImageData.width + i) * 4;
            bitmap.setPixelRGBA_i(i, j,
                rawImageData.data[n + 0],
                rawImageData.data[n + 1],
                rawImageData.data[n + 2],
                rawImageData.data[n + 3]
            );
          }
        }
        res(bitmap);
      });
    } catch (e) {
      console.log(e);
      rej(e);
    }
  });
};

exports.decodePNGFromStream = function(instream) {
  return new Promise((res, rej) => {
    instream.pipe(new PNG())
        .on('parsed', function() {
          const bitmap = new Bitmap(this.width, this.height);
          for (let i = 0; i < bitmap.data.length; i++) {
            bitmap.data[i] = this.data[i];
          };
          res(bitmap);
        }).on('error', function(e) {
          rej(e);
        });
  });
};


exports.registerFont = text.registerFont;
