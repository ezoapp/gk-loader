(function (window, requirejs, $) {

  'use strict';

  if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function (suffix) {
      return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
  }

  Object.keys = Object.keys || (function () {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
      hasDontEnumBug = !{
        toString: null
      }.propertyIsEnumerable("toString"),
      DontEnums = [
        'toString', 'toLocaleString', 'valueOf', 'hasOwnProperty',
        'isPrototypeOf', 'propertyIsEnumerable', 'constructor'
      ],
      DontEnumsLength = DontEnums.length;
    return function (o) {
      if (typeof o != "object" && typeof o != "function" || o === null)
        throw new TypeError("Object.keys called on a non-object");
      var result = [];
      for (var name in o) {
        if (hasOwnProperty.call(o, name))
          result.push(name);
      }
      if (hasDontEnumBug) {
        for (var i = 0; i < DontEnumsLength; i++) {
          if (hasOwnProperty.call(o, DontEnums[i]))
            result.push(DontEnums[i]);
        }
      }
      return result;
    };
  })();

  var script = getScript(),
    contexts = requirejs.s.contexts,
    contextName = 'gk',
    currDir = dirname(window.location.pathname),
    componentBase = normalize(script.src + '/../../'),
    defaultPkg = componentBase + '/gk-jqm1.4/',
    requireConfig = {
      context: contextName,
      map: {
        '*': {
          '@css': componentBase + '/require-css/css',
          '@text': componentBase + '/require-text/text',
          '@html': componentBase + '/gk-loader/element/loader.min',
          '@wdgt': componentBase + '/gk-loader/widget/loader.min'
        }
      },
      skipDataMain: true
    },
    scriptCfg = parseConfig(script);

  var context, defined;

  function parseConfig(script) {
    var init = script.getAttribute('init') || 'true',
      baseUrl = script.getAttribute('baseUrl') || componentBase,
      callback = script.getAttribute('callback'),
      cfg = {};
    cfg.init = init;
    cfg.baseUrl = baseUrl;
    callback && (cfg.callback = callback);
    return cfg;
  }

  function mergedConfig() {
    scriptCfg.baseUrl && (requireConfig.baseUrl = scriptCfg.baseUrl);
    return requireConfig;
  }

  function overwriteMethod(ctx) {
    var origLoad = ctx.load;
    ctx.load = function (id, url) {
      return origLoad.apply(ctx, [id, url.endsWith('.js') ? url : url + '.js']);
    };
  }

  function configure(cfg) {
    var req = requirejs.config(cfg);
    context = contexts[contextName];
    overwriteMethod(context);
    defined = context.defined;
    return req;
  }

  function defineRegistered() {
    each(['_', contextName], function (c) {
      var registry = contexts[c].registry;
      each(Object.keys(registry), function (m) {
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

  function toAbsolutePath(components) {
    each(components, function (c, i) {
      c = absolute(c);
      if (c.endsWith('.html')) {
        c = '@html!' + c.substr(0, c.length - 5);
      }
      components[i] = c;
    });
    return components;
  }

  function tagsToComponents(tags) {
    each(tags, function (t, i) {
      tags[i] = defaultPkg + t + '.html';
    })
    return tags;
  }

  function registryGK(modules, callback) {
    var req = configure(mergedConfig()),
      cb = isFunction(callback) ? callback : function () {};
    defineRegistered();
    modules = toAbsolutePath(modules);
    if (hasUndefined(modules)) {
      req(modules, function () {
        cb();
      });
    } else {
      cb();
    }
  }

  var comAttr = script.getAttribute('components'),
    gkTagsAttr = script.getAttribute('gk-tags'),
    components;
  if (comAttr) {
    components = comAttr.split(/[\s,]+/);
  } else if (gkTagsAttr) {
    components = tagsToComponents(gkTagsAttr.split(/[\s,]+/));
  }
  if (components.length) {
    registryGK(components, function () {
      initGK();
      scriptCfg.callback && new Function('return ' + scriptCfg.callback)()();
    });
  }
  window.registryGK = registryGK;
  window.registryGK.urllib = {
    normalize: normalize,
    absolute: absolute,
    isAbsolute: isAbsolute
  };

  function each(ary, iterator) {
    var nativeForEach = Array.prototype.forEach,
      breaker = {};
    if (ary == null) return ary;
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

  function absolute(url, base) {
    if (!isAbsolute(url)) {
      if (base) {
        url = normalize(base + '/' + url);
      } else {
        url = window.location.protocol + '//' + window.location.host + normalize(currDir + '/' + url);
      }
    }
    return url;
  }

  function isFunction(obj) {
    return typeof obj === 'function';
  }

  function isAbsolute(s) {
    s = s.toLowerCase();
    return s.indexOf('http://') === 0 || s.indexOf('https://') === 0 || s.indexOf('data:') === 0 || s[0] === '/';
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
