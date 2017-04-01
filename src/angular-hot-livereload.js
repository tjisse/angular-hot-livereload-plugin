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

    /**
     * Fetches a script file that contains a controller, then reloads this controller in all elements that use it
     * @param url The url of the script file to be fetched containing a controller
     */
    reloadNgController(url) {
        const fullFileName = url.split('/').pop().substring(-1, url.lastIndexOf('.'));
        const fileName = fullFileName.substring(-1, fullFileName.indexOf('.'));
        const controllerName = NgHotReloadPlugin.capitalize(camelCase(fileName)) + 'Controller';
        const directiveName = camelCase(fileName);
        const tagName = kebabCase(fileName);

        const doc = angular.element(window.document);
        const injector = doc.injector();
        if (injector) {
            // check if directive is available
            const directive = injector.get(directiveName + 'Directive')[0];
            if (directive) {
                // fetch and load changed script
                jquery.getScript(url, function() {
                    // get updated controller definition
                    const updated = window[controllerName];
                    // find all elements with this controller
                    const elems = Array.prototype.slice.call(doc.find(tagName));
                    elems.forEach(elt => {
                        const ngElt = angular.element(elt);
                        // get old controller instance
                        const old = ngElt.controller(directiveName);
                        // get objects to inject
                        const injects_names = injector.annotate(updated);
                        const injects = injects_names.map(el => {
                            // handle $scope
                            if (el === '$scope') {
                                return ngElt.scope();
                            } else {
                                return injector.get(el);
                            }
                        });
                        // create instance from updated controller definition
                        const updated_inst = new window[controllerName](...injects);
                        // assign updated properties and methods to old controller
                        Object.assign(old, updated_inst);
                    });
                    // rootscope update
                    doc.find('html').scope().$apply();
                    console.info('Hot swapped controllers of <' + tagName  + '> components');
                });
            }
        }
    }

    /**
     * Fetches a script file that contains a service, then reloads it
     * @param url The url of the script file to be fetched containing a service
     */
    reloadNgService(url) {
        const fullFileName = url.split('/').pop().substring(-1, url.lastIndexOf('.'));
        const fileName = fullFileName.substring(-1, fullFileName.indexOf('.'));
        const serviceName = NgHotReloadPlugin.capitalize(camelCase(fileName));

        const doc = angular.element(window.document);
        const injector = doc.injector();
        if (injector) {
            // get old service instance
            const old = injector.get(serviceName);
            // fetch and load changed script
            jquery.getScript(url, function() {
                // get updated service definition
                const updated = window[serviceName];
                // get objects to inject
                const injects_names = injector.annotate(updated);
                const injects = injects_names.map(el => injector.get(el));
                // create instance from updated service definition
                const updated_inst = new window[serviceName](injects);
                // assign updated properties and methods to old service
                Object.assign(old, updated_inst);
                // rootscope update
                doc.find('html').scope().$apply();
                console.info('Hot swapped service ' + serviceName);
            });
        }
    }

    /**
     * Fetches a script file that contains a template, then reloads this template in all elements that use it
     * @param url The url of the template file to be fetched
     */
    reloadNgTemplate(url) {
        const fullFileName = url.split('/').pop().substring(-1, url.lastIndexOf('.'));
        const fileName = fullFileName.substring(-1, fullFileName.indexOf('.'));
        const tagName = kebabCase(fileName);
        const directiveName = camelCase(fileName);

        const doc = angular.element(document);
        const injector = doc.injector();
        if (injector) {
            // fetch updated template
            jquery.get(url, resp => {
                const $compile = injector.get('$compile');
                const directive = injector.get(directiveName + 'Directive')[0];
                // set updated template on directive
                directive.template = resp;
                // find all elements with this template
                const elems = Array.prototype.slice.call(doc.find(tagName));
                // for each element, set inner html to updated template
                elems.forEach(elt => {
                    const ngElt = angular.element(elt);
                    const scope = ngElt.isolateScope();
                    ngElt.html(resp);
                    $compile(ngElt.contents())(scope);
                    NgHotReloadPlugin.recompileParentNgIfs($compile, elt);
                });
                // rootscope update
                doc.find('html').scope().$apply();
                console.info('Hot swapped templates of <' + tagName  + '> components');
            });
        }
    }

    /**
     * Main entry point for livereload notifications, matches supported files and handles reloading accordingly
     * @param path File path to the updated file
     * @returns {boolean} True if plugin can handle updated file, false if not
     */
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

    /**
     * Walks up the DOM and recompiles any ng-if directives so the updated template is always persisted
     * @param $compile Angular $compile service
     * @param element The element to start at
     */
    static recompileParentNgIfs($compile, element) {
        let elt = element;
        while (elt.localName !== 'html') {
            if (elt.hasAttribute('ng-if') || elt.hasAttribute('data-ng-if')) {
                const ngElt = angular.element(elt);
                const scope = ngElt.scope();
                $compile(ngElt.contents())(scope);
            }
            elt = elt.parentNode;
        }
    }

    /**
     * Attempts to select the script in DOM that matches the file in the livereload notification
     * @param path File path to the updated file
     * @returns {string|*} URL to the script file that matches the updated file, or `undefined` if no match
     */
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

    /**
     * Attempts to select the template in $templateCache that matches the file in the livereload notification
     * @param path File path to the updated file
     * @returns {string|*} URL to the template file that matches the updated file, or `undefined` if no match
     */
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
        console.info('Setting angular-hot-livereload plugin on window object so it gets loaded with Livereload.js');
        window.LiveReloadPlugin_NgHotReloadPlugin = NgHotReloadPlugin;
    }
}();