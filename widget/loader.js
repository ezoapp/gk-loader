(function (define, registryGK) {

  'use strict';

  var widgetExt = '.js',
    normalize = registryGK.urllib.normalize;

  function text(data) {
    return 'define(function(){return ' + data + '});';
  }

  define({

    load: function (name, require, onload) {
      require(['@text!' + name + widgetExt], function (data) {
        onload.fromText(text(data));
      });
    },

    normalize: normalize,

    pluginBuilder: './builder'

  });

}(define, registryGK));
