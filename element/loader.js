define(['module'], function (module) {

  'use strict';

  (function (DOMParser) {
    if (!DOMParser) {
      return;
    }
    var DOMParser_proto = DOMParser.prototype,
      real_parseFromString = DOMParser_proto.parseFromString;

    // Firefox/Opera/IE throw errors on unsupported types
    try {
      // WebKit returns null on unsupported types
      if ((new DOMParser).parseFromString("", "text/html")) {
        // text/html parsing is natively supported
        return;
      }
    } catch (ex) {}

    DOMParser_proto.parseFromString = function (markup, type) {
      if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
        var doc = document.implementation.createHTMLDocument("");
        if (markup.toLowerCase().indexOf('<!doctype') > -1) {
          doc.documentElement.innerHTML = markup;
        } else {
          doc.body.innerHTML = markup;
        }
        return doc;
      } else {
        return real_parseFromString.apply(this, arguments);
      }
    };
  }(window.DOMParser));

  var elementExt = '.html',
    domParser = getDOMParser(),
    scpRex = /<(\/|)script/g,
    gkScp = domParser ? 'script' : 'gk__script__tag',
    gkScpRex = new RegExp(gkScp, 'g'),
    moduleConfig = module.config(),
    lib = moduleConfig.lib,
    normalize = lib.normalize,
    loadUrl = lib.loadUrl,
    trimHtml = lib.trimHtml,
    trimNewline = lib.trimNewline,
    each = lib.each,
    $ = lib.$,
    $gk = $.gk;

  $gk.createTag(['element', 'template', gkScp]);

  var codeGen = {
    requireVariables: function (deps) {
      var ret = [];
      each(deps, function (dep) {
        ret.push('require("' + dep + '")');
      });
      return ret.join(';');
    },
    registerElement: function (template) {
      return 'function registerElement(n,c){$.gk.registerElement(n,\'' + template + '\',c)}';
    },
    moduleInfo: function (id) {
      return 'var module=' + JSON.stringify({
        id: id
      });
    }
  };

  $gk.registerElement = function (name, tpl, clazz) {
    $gk.registry(name, {
      template: tpl,
      script: function () {
        var props = Object.keys(clazz || {});
        for (var i = 0, l = props.length; i < l; i += 1) {
          this[props[i]] = clazz[props[i]];
        }
      }
    });
  };

  function getDOMParser() {
    if (window.DOMParser) {
      return new DOMParser();
    }
  }

  function createElement(src) {
    if (domParser) {
      return domParser.parseFromString('<body>' + src + '</body>', 'text/html').querySelector('body');
    } else {
      var node = document.createElement('div');
      node.style.display = 'none';
      document.body.appendChild(node);
      node.innerHTML = src.replace(scpRex, '<$1' + gkScp);
      return node;
    }
  }

  function removeElement(ele) {
    if (!domParser) {
      document.body.removeChild(ele);
    }
  }

  function processLinkElements($linkEles, config) {
    $linkEles.each(function (idx, link) {
      var href = link.getAttribute('href');
      if (href) {
        config.deps.push(loadUrl(href, config.moduleId + '/../'));
      }
      link.parentNode.removeChild(link);
    });
  }

  function processScripts($scripts, config) {
    var srces = [],
      srclen,
      shim = {},
      cfg = {
        context: 'gk'
      };
    $scripts.each(function (idx, script) {
      var src = script.getAttribute('src');
      if (src) {
        srces.push(loadUrl(src, config.moduleId + '/../'));
      } else {
        config.script += $(script).text();
      }
    });
    srclen = srces.length;
    if (srclen) {
      config.deps.push(srces[srclen - 1]);
      if (srclen > 1) {
        for (var i = srclen - 1; i > 0; i -= 1) {
          shim[srces[i]] = [srces[i - 1]];
        }
        cfg.shim = shim;
        config.script = 'requirejs.config(' + JSON.stringify(cfg) + ');' + config.script;
      }
    }
  }

  function processTemplate($template, config) {
    var $tmp = $('<div>' + $template.html() + '</div>');
    processLinkElements($tmp.find('link'), config);
    config.template = trimHtml(trimNewline($tmp.html()));
    $template.html($tmp.html());
  }

  function processModuleText($module, config) {
    config.moduleText = codeGen.requireVariables(config.deps) + ';' + codeGen.registerElement(config.template) + ($module.length ? $module.text() : '');
  }

  function wrapUp(config) {
    var code = '+(function(){' + codeGen.moduleInfo(config.moduleId) + ';' + trimNewline(config.script) +
      ';define(function(' + config.vars.join() + '){' +
      config.moduleText +
      '})}());';
    code = code.replace(gkScpRex, 'script');
    return code;
  }

  function generateCode(src, config) {
    var ele = createElement(src),
      $html = $(ele),
      $scripts = $html.children(gkScp),
      $linkEles = $html.find('link'),
      $ele = $html.children('element'),
      $template = $ele.children('template'),
      $module = $ele.children(gkScp);
    processLinkElements($linkEles, config);
    processScripts($scripts, config);
    processTemplate($template, config);
    processModuleText($module, config);
    removeElement(ele);
    return wrapUp(config);
  }

  return {
    load: function (name, require, onload, config) {
      require(['@text!' + name + elementExt], function (src) {
        var moduleCfg = {
          deps: [],
          vars: ['require', 'exports', 'module'],
          moduleId: name,
          template: '',
          moduleText: '',
          script: ''
        };
        onload.fromText(generateCode(src, moduleCfg));
      });
    },

    normalize: normalize,

    pluginBuilder: './builder'
  };

});
