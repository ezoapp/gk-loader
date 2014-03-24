define(function () {

  'use strict';

  var widgetExt = '.js',
    buildMap = {};

  function loadFile(path) {
    var fs = require.nodeRequire('fs'),
      file = fs.readFileSync(path, 'utf8');
    if (file.indexOf('\uFEFF') === 0) {
      return file.substring(1);
    }
    return file;
  }

  return {
    load: function (name, require, onload, config) {
      buildMap[name] = loadFile(require.toUrl(name + widgetExt));
      onload();
    },

    write: function (pluginName, moduleName, write) {
      if (moduleName in buildMap) {
        write("define('" + pluginName + "!" + moduleName +
          "', function () { return " + buildMap[moduleName] + ";});\n");
      }
    }
  };

});
