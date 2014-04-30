+(function () {

  'use strict';

  var fs = require('fs'),
    exports = {};

  function loadFile(path) {
    var file = fs.readFileSync(path, 'utf8');
    if (file.indexOf('\uFEFF') === 0) {
      return file.substring(1);
    }
    return file;
  }

  // utilities

  var absoluteRex = /^((http|https|data):|\/)/i,
    htmlCommentRex = /<!--[\s\S]*?-->/gm,
    htmlSpaceRex = />\s+</gm,
    htmlNewLineRex = /\s*(\r\n|\n|\r)\s*/gm;

  function dirname(url, level) {
    return url.split('?')[0].split('/').slice(0, level || -1).join('/');
  }

  function normalize(path) {
    var parts = path.split('://'),
      host = '',
      result = [],
      p;
    if (parts.length > 1) {
      host = parts[0] + '://' + parts[1].split('/')[0];
      path = path.substr(host.length);
    }
    path = path.replace(/\/+/g, '/');
    if (path.indexOf('/') === 0) {
      host += '/';
      path = path.substr(1);
    }
    parts = path.split('/');
    while (p = parts.shift()) {
      if (p === '..') {
        result.pop();
      } else if (p !== '.') {
        result.push(p);
      }
    }
    return host + result.join('/');
  }

  function isAbsolute(s) {
    return absoluteRex.test(s);
  }

  function absolute(url, base) {
    if (!isAbsolute(url)) {
      url = normalize((base || '.') + '/' + url);
    }
    return url;
  }

  function loadUrl(url, base) {
    var splits, id, ext;
    url = absolute(url, base);
    splits = url.split('.');
    id = splits.slice(0, -1).join('.');
    ext = splits.pop();
    if (!id) {
      id = ext;
      ext = '';
    }
    switch (ext) {
    case 'js':
      return id;
    case 'css':
      return '@css!' + id;
    case 'html':
      return '@html!' + id;
    default:
      return '@text!' + url;
    }
  }

  function trimExt(url, ext) {
    if (url.split('.').pop() === ext) {
      url = url.substr(0, url.length - ext.length - 1);
    }
    return url;
  }

  function trimHtml(s) {
    return s.replace(htmlCommentRex, '').replace(htmlSpaceRex, '><');
  }

  function trimNewline(s) {
    return s.replace(htmlNewLineRex, '');
  }

  function each(ary, iterator) {
    var nativeForEach = Array.prototype.forEach,
      breaker = {};
    if (ary === null) {
      return ary;
    }
    if (nativeForEach && ary.forEach === nativeForEach) {
      ary.forEach(iterator);
    } else {
      for (var i = 0, l = ary.length; i < l; i += 1) {
        if (iterator.call(null, ary[i], i, ary) === breaker) {
          return;
        }
      }
    }
  }

  // export them out

  exports.loadFile = loadFile;
  exports.dirname = dirname;
  exports.normalize = normalize;
  exports.isAbsolute = isAbsolute;
  exports.absolute = absolute;
  exports.loadUrl = loadUrl;
  exports.trimExt = trimExt;
  exports.trimHtml = trimHtml;
  exports.trimNewline = trimNewline;
  exports.each = each;

  module.exports = exports;

}(this));
