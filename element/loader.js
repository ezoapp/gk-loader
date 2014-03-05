define(function () {

  'use strict';

  var elementExt = '.html',
    urllib = registryGK.urllib,
    normalize = urllib.normalize,
    absolute = urllib.absolute;

  function keys() {
    var f = Object.keys || function (obj) {
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
    return 'function registerElement(n,c){' +
      keys.toString() +
      gk.toString() +
      '$.gk.registry(n,gk(\'' + template + '\',c));' +
      '}';
  }

  function wholeCode(config) {
    return trimNewline(config.script) +
      'define(' + JSON.stringify(config.deps) + ', function(' + config.names.join() + '){' +
      config.moduleText +
      '});';
  }

  function gk(t, c) {
    var props = keys(c || {}),
      sc = function () {
        for (var i = 0, l = props.length; i < l; i += 1) {
          this[props[i]] = c[props[i]];
        }
      };
    return {
      template: t,
      script: sc
    };
  }

  function processScripts($scripts, config) {
    var addScript = function (s, name) {
      config.deps.push(s);
      if (name) {
        config.names.push(name);
      }
    };
    $scripts.each(function (idx, script) {
      var path = script.getAttribute('path'),
        src = script.getAttribute('src'),
        name = script.getAttribute('var');
      if (path) {
        addScript(path, name);
      } else if (src) {
        src = absoluteUrl(config.moduleId, src, 'js');
        addScript(src, name);
      } else {
        config.script += script.text;
      }
    });
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
