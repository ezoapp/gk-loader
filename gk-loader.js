(function (window, requirejs, $) {

  'use strict';

  var script = getScript(),
    contexts = requirejs.s.contexts,
    contextName = 'gk',
    requireConfig = {
      context: contextName,
      map: {
        '*': {
          css: 'require-css/css'
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
    var gkTags = (script.getAttribute('gk-tags') || '').split(/[\s,]+/),
      baseUrl = script.getAttribute('baseUrl') || dirname(dirname(script.src)),
      init = script.getAttribute('init') || 'true',
      callback = script.getAttribute('callback'),
      cfg = {};
    cfg.gkTags = gkTags;
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

  if (scriptCfg.gkTags.length) {
    registryGK(scriptCfg.gkTags, function () {
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

  function dirname(s) {
    return s.split('?')[0].split('/').slice(0, -1).join('/') + '/';
  }

  function basename(s) {
    return s.split('?')[0].split('/').slice(-1)[0];
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