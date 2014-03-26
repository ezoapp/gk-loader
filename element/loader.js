(function (define, registryGK, $) {

  'use strict';

  var elementExt = '.html',
    urllib = registryGK.urllib,
    normalize = urllib.normalize,
    absolute = urllib.absolute;

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
      'registryGK.registerElement(n,\'' + template + '\',c)' +
      '}';
  }

  function wholeCode(config) {
    return trimNewline(config.script) +
      'define(' + JSON.stringify(config.deps) + ', function(' + config.vars.join() + '){' +
      config.moduleText +
      '});';
  }

  function processScripts($scripts, config) {
    var addScript = function (s, var_) {
      config.deps.push(s);
      if (var_) {
        config.vars.push(var_);
      }
    };
    $scripts.each(function (idx, script) {
      var path = script.getAttribute('path'),
        src = script.getAttribute('src'),
        var_ = script.getAttribute('var');
      if (path) {
        addScript(path, var_);
      } else if (src) {
        src = absoluteUrl(config.moduleId, src, 'js');
        addScript(src, var_);
      } else {
        config.script += script.text;
      }
    });
  }

  function processLinkElements($linkEles, config) {
    $linkEles.each(function (idx, link) {
      var rel = link.getAttribute('rel'),
        href = link.getAttribute('href');
      if (href) {
        if (rel === 'import') {
          config.deps.push(absoluteUrl(config.moduleId, href, 'html', '@html!'));
        } else if (rel === 'stylesheet') {
          config.deps.push(absoluteUrl(config.moduleId, href, 'css', '@css!'));
        }
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
    processLinkElements($links, config);
    $links.remove();
    config.template = trimHtml(trimNewline($template[0].innerHTML));
  }

  function processModuleText($module, config) {
    config.moduleText = codeForRegister(config.template) + ($module.length ? $module[0].text : '');
  }

  define({

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
            vars: ['require', 'exports', 'module'],
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

  });

}(define, registryGK, jQuery));
