define(function () {

  'use strict';

  var widgetExt = '.js',
    normalize = registryGK.urllib.normalize;

  function definitionText(data) {
    return 'define(function(){' +
      'return ' + data +
      '});';
  }

  return {
    load: function (name, require, onload) {
      require(['@text!' + name + widgetExt], function (data) {
        onload.fromText(definitionText(data));
      });
    },
    normalize: normalize,
    pluginBuilder: './builder'
  };

});
