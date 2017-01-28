'use strict';

var inspect = require('util').inspect;

var compile = require('svelte').compile;
var objectAssign = require('object-assign');
var PluginError = require('gulp-util/lib/PluginError');
var replaceExt = require('replace-ext');
var Transform = require('stream').Transform;
var tryit = require('tryit');
var vinylSourcemapsApply = require('vinyl-sourcemaps-apply');

module.exports = function gulpSvelte(options) {
  return new Transform({
    objectMode: true,
    transform(file, enc, cb) {
      if (typeof file.isNull !== 'function') {
        cb(new PluginError('gulp-svelte', new TypeError(
          inspect(file) +
          ' is not a Vinyl file. Expected a Vinyl file object of a Svelte template.'
        )));
        return;
      }

      if (file.isNull()) {
        cb(null, file);
        return;
      }

      if (file.isStream()) {
        cb(new PluginError('gulp-svelte', 'Streaming not supported'));
        return;
      }

      var result;

      tryit(function() {
        if(options.format) {
          result = compile(file.contents.toString(), objectAssign({filename: file.path},{name:path.basename(file.path,options.fileext)}, options));
        } else {
          result = compile(file.contents.toString(), objectAssign({filename: file.path}, options));
        }
      }, function(err) {
        if (err) {
          if (file.path) {
            err.fileName = file.path;
          }

          cb(new PluginError('gulp-svelte', err));
          return;
        }

        if (result.map.file === null) {
          result.map.file = '__no_filename__';
        }

        if (file.path) {
          file.path = replaceExt(file.path, '.js');
        }

        file.contents = new Buffer(result.code);
        vinylSourcemapsApply(file.contents, result.map);

        cb(null, file);
      });
    }
  });
};
