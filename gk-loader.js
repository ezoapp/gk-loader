(function (window, requirejs, $) {

  'use strict';

  var TAG_NAMES = 'tagNames',
    ARRAYPROTO = Array.prototype;

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
    scriptCfg = parseConfig(script);

  var context, defined, tagNames;

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
    context[TAG_NAMES] = context[TAG_NAMES] || {};
    tagNames = context[TAG_NAMES];
    return req;
  }

  function defineRegistered() {
    each(['_', contextName], function (c) {
      var registry = contexts[c].registry;
      each(Object.keys(registry), function (module) {
        var factory = registry[module].factory,
          clazz = typeof factory === 'function' ? factory() : factory;
        if (clazz) {
          contexts[c].defined[module] = clazz;
          if (isGKComponent(clazz)) {
            defined[module] = clazz;
            delete registry[module];
          }
        }
      });
    });
  }

  function hasUndefined(modules) {
    var undef = false;
    each(modules, function (m) {
      if (!defined[m]) {
        undef = true;
        return true;
      }
    });
    return undef;
  }

  function registerComponents(modules) {
    var ret = [];
    each(modules, function (m) {
      var tag = basename(m),
        clazz = defined[m];
      if (clazz && hasGK() && isGKComponent(clazz)) {
        tagNames[tag] = m;
        $.gk.registry(tag, clazz);
      }
      ret.push(m);
    });
    return ret;
  }

  var registryGK = function (modules, callback) {
    var req = configure(mergedConfig()),
      cb = isFunction(callback) ? callback : function () {};
    defineRegistered();
    if (hasUndefined(modules)) {
      req(modules, function () {
        cb(registerComponents(modules));
      });
    } else {
      cb(registerComponents(modules));
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

  function extend(obj) {
    each(ARRAYPROTO.slice.call(arguments, 1), function (source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  }

  function map(obj, iterator, context) {
    var nativeMap = ARRAYPROTO.map,
      results = [];
    if (obj === null) {
      return results;
    }
    if (nativeMap && obj.map === nativeMap) {
      return obj.map(iterator, context);
    }
    each(obj, function (value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
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

  function isGKComponent(m) {
    return m.template && m.script;
  }

  function initGK() {
    if (hasGK()) {
      $.gk.init();
    }
  }

  function getScript() {
    var scs = document.getElementsByTagName('script');
    return scs[scs.length - 1];
  }

}(window, requirejs, jQuery));