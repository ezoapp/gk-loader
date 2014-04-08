define(['module'], function (module) {

  'use strict';

  var widgetExt = '.js',
    moduleConfig = module.config(),
    lib = moduleConfig.lib,
    normalize = lib.normalize;

  function text(data) {
    return ';define(function(){return ' + data + '})';
  }

  return {
    load: function (name, require, onload) {
      require(['@text!' + name + widgetExt], function (data) {
        onload.fromText(text(data));
      });
    },

    normalize: normalize,

    pluginBuilder: './builder'
  };

});
