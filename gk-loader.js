(function (window, requirejs, $) {

  'use strict';

  var script = getScript(),
    contexts = requirejs.s.contexts,
    contextName = 'gk',
    componentsDir = 'bower_components',
    requireConfig = {
      context: contextName,
      map: {
        '*': {
          '@css': componentsDir + '/require-css/css'
        }
      },
      skipDataMain: true
    },
    scriptCfg = parseConfig(script),
    keys = Object.keys || function (obj) {
      if (obj !== Object(obj)) {
        throw new TypeError('Invalid object');
      }
      var keys = [];
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          keys.push(key);
        }
      }
      return keys;
    };

  var context, defined;

  function parseConfig(script) {
    var components = (script.getAttribute('components') || '').split(/[\s,]+/),
      gkTags = (script.getAttribute('gk-tags') || '').split(/[\s,]+/),
      init = script.getAttribute('init') || 'true',
      baseUrl = script.getAttribute('baseUrl'),
      callback = script.getAttribute('callback'),
      cfg = {},
      convertPath = function (components) {
        var ret = [];
        each(components, function (c) {
          ret.push(c[0] === '.' ? c : componentsDir + '/' + c);
        });
        return ret;
      };
    cfg.components = convertPath(components).concat(convertPath(gkTags));
    cfg.init = init;
    baseUrl && (cfg.baseUrl = baseUrl);
    callback && (cfg.callback = callback);
    return cfg;
  }

  function mergedConfig() {
    scriptCfg.baseUrl && (requireConfig.baseUrl = scriptCfg.baseUrl);
    return requireConfig;
  }

  function configure(cfg) {
    var req = requirejs.config(cfg);
    context = contexts[contextName];
    defined = context.defined;
    return req;
  }

  function defineRegistered() {
    each(['_', contextName], function (c) {
      var registry = contexts[c].registry;
      each(keys(registry), function (m) {
        var factory = registry[m].factory,
          clazz = typeof factory === 'function' ? factory() : factory;
        contexts[c].defined[m] = clazz;
      });
    });
  }

  function hasUndefined(modules) {
    var undef = false;
    each(modules, function (m) {
      if (!(m in defined)) {
        undef = true;
        return true;
      }
    });
    return undef;
  }

  var registryGK = function (modules, callback) {
    var req = configure(mergedConfig()),
      cb = isFunction(callback) ? callback : function () {};
    defineRegistered();
    if (hasUndefined(modules)) {
      req(modules, function () {
        cb();
      });
    } else {
      cb();
    }
  };

  if (scriptCfg.components.length) {
    registryGK(scriptCfg.components, function () {
      initGK();
      scriptCfg.callback && new Function('return ' + scriptCfg.callback)()();
    });
  }
  window.registryGK = registryGK;

  function each(ary, func) {
    if (ary) {
      for (var i = 0, len = ary.length; i < len; i += 1) {
        if (ary[i] && func(ary[i], i, ary)) {
          break;
        }
      }
    }
  }

  function isFunction(obj) {
    return typeof obj === 'function';
  }

  function hasGK() {
    return $ && $.gk;
  }

  function initGK() {
    if ((scriptCfg.init === 'true' || scriptCfg.init === true) && hasGK()) {
      $.gk.init();
    }
  }

  function getScript() {
    var scs = document.getElementsByTagName('script');
    return scs[scs.length - 1];
  }

}(window, requirejs, jQuery));