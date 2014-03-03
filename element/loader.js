define(function () {

  'use strict';

  var elementExt = '.html',
    urllib = registryGK.urllib,
    normalize = urllib.normalize,
    absolute = urllib.absolute;

  function keys() {
    var f = Object.keys || function (obj) {
        if (obj !== Object(obj)) {
          throw new TypeError('Invalid object');
        }
        var ret = [];
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            ret.push(key);
          }
        }
        return ret;
      };
    return f.apply(null, arguments);
  }

  function each(ary, func) {
    if (ary) {
      for (var i = 0, len = ary.length; i < len; i += 1) {
        if (ary[i] && func(ary[i], i, ary)) {
          break;
        }
      }
    }
  }

  function trimHtml(s) {
    return s.replace(/<!--[\s\S]*?-->/gm, '').replace(/>\s+</gm, '><');
  }

  function trimNewline(s) {
    return s.replace(/\s*(\r\n|\n|\r)\s*/gm, '');
  }

  function absoluteUrl(moduleId, url, ext, prefix) {
    url = absolute(url, moduleId + '/../');
    url = url.substr(0, url.length - ext.length - 1);
    return (prefix || '') + url;
  }

  function codeForRegister(template) {
    return 'function registerElement(name,clazz){' +
      keys.toString() +
      gkClass.toString() +
      'var template=\'' + template + '\';' +
      '$.gk.registry(name,gkClass(template,clazz));' +
      '}';
  }

  function codeForConfig(shim) {
    return 'requirejs.config(' +
      JSON.stringify({
        context: 'gk',
        shim: shim
      }) +
      ');';
  }

  function wholeCode(config) {
    return trimNewline((keys(config.shim).length ? codeForConfig(config.shim) : '') + config.script) +
      'define(' + JSON.stringify(config.deps) + ', function(' + config.names.join() + '){' +
      config.moduleText +
      '});';
  }

  function gkClass(t, c) {
    var props = keys(c || {}),
      sc = function () {
        for (var i = 0, l = props.length; i < l; i++) {
          this[props[i]] = c[props[i]];
        }
      };
    return {
      template: t,
      script: sc
    };
  }

  function processScripts($scripts, config) {
    var shim = {},
      nameMap = {},
      addScript = function (name, depends, s) {
        config.deps.push(s);
        if (name) {
          config.names.push(name);
          nameMap[name] = s;
        }
        if (depends) {
          shim[s] = depends.split(/[\s,]+/);
        }
      };
    $scripts.each(function (idx, script) {
      var id = script.getAttribute('id'),
        src = script.getAttribute('src'),
        name = script.getAttribute('name'),
        depends = script.getAttribute('depends');
      if (id) {
        addScript(name, depends, id);
      } else if (src) {
        src = absoluteUrl(config.moduleId, src, 'js');
        addScript(name, depends, src);
      } else {
        config.script += script.text;
      }
    });
    each(keys(shim), function (name) {
      each(shim[name], function (test, idx) {
        each(keys(nameMap), function (find) {
          if (find === test) {
            shim[name][idx] = nameMap[find];
          }
        });
      });
    });
    config.shim = shim;
  }

  function processLinkElements($linkEles, config) {
    $linkEles.each(function (idx, link) {
      var href = link.getAttribute('href');
      if (href) {
        config.deps.push(absoluteUrl(config.moduleId, href, 'html', '@html!'));
      }
    });
  }

  function processTemplate($template, config) {
    var $links;
    if (!$template.length) {
      return;
    }
    $template = $('<div>' + $template[0].innerHTML + '</div>');
    $links = $template.children('link');
    $links.each(function (idx, link) {
      var href = link.getAttribute('href');
      if (href) {
        config.deps.push(absoluteUrl(config.moduleId, href, 'css', '@css!'));
      }
    });
    $links.remove();
    config.template = trimHtml(trimNewline($template[0].innerHTML));
  }

  function processModuleText($module, config) {
    config.moduleText = codeForRegister(config.template) + ($module.length ? $module[0].text : '');
  }

  return {
    load: function (name, require, onload) {
      require(['@text!' + name + elementExt], function (text) {
        var $html = $('<div>' + text + '</div>'),
          $scripts = $html.children('script'),
          $linkEles = $html.children('link'),
          $ele = $html.children('element'),
          $template = $ele.children('template'),
          $module = $ele.children('script'),
          config = {
            deps: ['require', 'exports', 'module'],
            shim: {},
            names: ['require', 'exports', 'module'],
            moduleId: name,
            template: '',
            moduleText: '',
            script: ''
          };
        processScripts($scripts, config);
        processLinkElements($linkEles, config);
        processTemplate($template, config);
        processModuleText($module, config);
        onload.fromText(wholeCode(config));
      });
    },
    normalize: normalize
  };

});
