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
      }.propertyIsEnumerable('toString'),
      DontEnums = [
        'toString', 'toLocaleString', 'valueOf', 'hasOwnProperty',
        'isPrototypeOf', 'propertyIsEnumerable', 'constructor'
      ],
      DontEnumsLength = DontEnums.length;
    return function (o) {
      if (typeof o != 'object' && typeof o != 'function' || o === null)
        throw new TypeError('Object.keys called on a non-object');
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
    wndloc = window.location,
    locorigin = wndloc.origin,
    currloc = dirname(wndloc.pathname),
    absComponentBase = normalize(script.src + '/../../'),
    componentBase = absComponentBase.indexOf(locorigin) === 0 ? absComponentBase.substr(locorigin.length + 1) : absComponentBase,
    defaultPkg = componentBase + '/gk-jqm1.4/',
    requireConfig = {
      context: contextName,
      baseUrl: '/',
      map: {
        '*': {
          '@css': componentBase + '/require-css/css',
          '@text': componentBase + '/require-text/text',
          '@html': componentBase + '/gk-loader/element/loader',
          '@wdgt': componentBase + '/gk-loader/widget/loader'
        }
      },
      skipDataMain: true
    },
    scriptCfg = parseConfig(script);

  var context, defined, status;

  function parseConfig(script) {
    var init = script.getAttribute('init'),
      callback = function () {
        var cb = script.getAttribute('callback');
        cb && (new Function('return ' + cb)()());
      },
      cfg = {};
    cfg.init = init;
    cfg.callback = callback;
    return cfg;
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
    (context.status = {}) && (status = context.status);
    return req;
  }

  function defineRegistered() {
    each(['_', contextName], function (c) {
      var registry = contexts[c].registry;
      each(Object.keys(registry), function (m) {
        var factory = registry[m].factory;
        defined[m] = typeof factory === 'function' ? factory() : factory;
        delete registry[m];
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
    });
    return tags;
  }

  function setLoading(modules) {
    each(modules, function (m) {
      if (!status[m] || status[m] !== 'done') {
        status[m] = 'loading';
      }
    });
  }

  function setDone(modules) {
    each(modules, function (m) {
      status[m] = 'done';
    });
  }

  function initGK() {
    each(Object.keys(status), function (m) {
      if (status[m] !== 'done') {
        return;
      }
    });
    $.gk.init();
  }

  function registryGK(modules, callback) {
    var req = configure(requireConfig),
      cb = isFunction(callback) ? callback : function () {};
    defineRegistered();
    modules = toAbsolutePath(modules);
    if (hasUndefined(modules)) {
      setLoading(modules);
      req(modules, function () {
        setDone(modules);
        cb(initGK);
      });
    } else {
      cb(initGK);
    }
  }

  window.registryGK = registryGK;
  window.registryGK.urllib = {
    normalize: normalize,
    absolute: absolute,
    isAbsolute: isAbsolute
  };
  window.registryGK.registerElement = function (name, tpl, clazz) {
    $.gk.registry(name, {
      template: tpl,
      script: function () {
        var props = Object.keys(clazz || {});
        for (var i = 0, l = props.length; i < l; i += 1) {
          this[props[i]] = clazz[props[i]];
        }
      }
    });
  };
  var comAttr = script.getAttribute('components'),
    gkTagsAttr = script.getAttribute('gk-tags'),
    components = [];
  if (comAttr) {
    components = comAttr.split(/[\s,]+/);
  } else if (gkTagsAttr) {
    components = tagsToComponents(gkTagsAttr.split(/[\s,]+/));
  }
  if (components.length) {
    registryGK(components, function (init) {
      if (scriptCfg.init === null || (scriptCfg.init && scriptCfg.init !== 'false')) {
        init();
      }
      scriptCfg.callback();
    });
  } else {
    scriptCfg.callback();
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
      host && (host += '/');
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
      url = normalize((base || currloc) + '/' + url);
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

  function getScript() {
    var scs = document.getElementsByTagName('script');
    return scs[scs.length - 1];
  }

}(window, requirejs, jQuery));
