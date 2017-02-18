import angular from 'angular'
import jquery from 'jquery'
import livereload from 'livereload-js'
import camelCase from 'lodash/camelCase'
import kebabCase from 'lodash/kebabCase'

class NgHotReloadPlugin {

    static identifier = 'ngHotReload';
    static version = '1.0';

    constructor(window, host) {
        this.window = window;
        this.host = host;
        console.info('Angular hot livereload plugin loaded')
    }

    reloadNgController(url) {
        const fullFileName = url.split('/').pop().substring(-1, url.lastIndexOf('.'));
        const fileName = fullFileName.substring(-1, fullFileName.indexOf('.'));
        const controllerName = NgHotReloadPlugin.capitalize(camelCase(fileName)) + 'Controller';
        const directiveName = camelCase(fileName);

        const doc = angular.element(window.document);
        const injector = doc.injector();
        if (injector) {
            const directive = injector.get(directiveName + 'Directive')[0];
            if (directive) {
                jquery.getScript(url, function() {
                    const old = directive.controller;
                    const updated = new window[controllerName]();
                    Object.assign(old.prototype, updated.__proto__);
                    // trigger rootscope update
                    doc.find('html').scope().$apply();
                    console.info('Hot swapped controller ' + controllerName);
                });
            }
        }
    }

    reloadNgService(url) {
        const fullFileName = url.split('/').pop().substring(-1, url.lastIndexOf('.'));
        const fileName = fullFileName.substring(-1, fullFileName.indexOf('.'));
        const serviceName = NgHotReloadPlugin.capitalize(camelCase(fileName));

        const doc = angular.element(window.document);
        const injector = doc.injector();
        if (injector) {
            jquery.getScript(url, function() {
                const old = injector.get(serviceName);
                const updated = new window[serviceName]();
                Object.assign(old.__proto__, updated.__proto__);
                // trigger rootscope update
                doc.find('html').scope().$apply();
                console.info('Hot swapped service ' + serviceName);
            });
        }
    }

    reloadNgTemplate(url) {
        const fullFileName = url.split('/').pop().substring(-1, url.lastIndexOf('.'));
        const fileName = fullFileName.substring(-1, fullFileName.indexOf('.'));
        const tagName = kebabCase(fileName);

        const doc = angular.element(document);
        const injector = doc.injector();
        if (injector) {
            jquery.get(url, resp => {
                const $compile = injector.get('$compile');
                // doc.find has to be cast to an Array
                const elems = Array.prototype.slice.call(doc.find(tagName));
                elems.forEach(elt => {
                    const angularElement = angular.element(elt);
                    const scope = angularElement.isolateScope();
                    angularElement.html(resp);
                    $compile(angularElement.contents())(scope);
                });
                doc.find('html').scope().$apply();
                console.info('Hot swapped templates of <' + tagName  + '> components');
            });
        }
    }

    reload(path) {
        path = path.replace(/\\/g, '/');
        if (path.match(/\.js$/i)) {
            let url = NgHotReloadPlugin.matchPathInScripts(path);
            if (!url) {
                return false;
            }
            if (url.match(/\.component\.js$/i)) {
                this.reloadNgController(url);
                return true;
            }
            if (url.match(/\.service\.js$/i)) {
                this.reloadNgService(url);
                return true;
            }
            return false;
        }
        if (path.match(/\.html$/i)) {
            let url = NgHotReloadPlugin.matchPathInTemplateCache(path);
            if (!url) {
                return false;
            }
            this.reloadNgTemplate(url);
            return true;
        }
    }

    static matchPathInScripts(path) {
        const scriptElements = window.document.getElementsByTagName('script');
        let splitPath = path.split('/');
        while (splitPath.length > 0) {
            for (let i = 0; i < scriptElements.length; i++) {
                const url = scriptElements[i].getAttribute('src');
                if (url) {
                    const splitUrl = url.split('/');
                    if (splitPath.join('') === splitUrl.join('')) {
                        return url;
                    }
                }
            }
            splitPath = splitPath.slice(1);
        }
    }

    static matchPathInTemplateCache(path) {
        const doc = angular.element(window.document.body);
        const injector = doc.injector();
        if (injector) {
            let splitPath = path.split('/');
            while (splitPath.length > 0) {
                const $templateCache = injector.get('$templateCache');
                const url = splitPath.join('/');
                const template = $templateCache.get(splitPath.join('/'));
                if (template) {
                    return url;
                }
                splitPath = splitPath.slice(1);
            }
        }
    }

    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

module.exports = function() {
    if (livereload && typeof livereload.addPlugin == 'function') {
        livereload.addPlugin(NgHotReloadPlugin);
    } else {
        console.error('Error adding angular-hot-livereload-plugin, make sure to load livereload-js first');
    }
}();