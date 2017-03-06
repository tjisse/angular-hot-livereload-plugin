# angular-hot-livereload-plugin
Hot reloading for Angular 1.x controllers, services and templates, using livereload.js

[![Build Status](https://travis-ci.org/tjisse/angular-hot-livereload-plugin.svg?branch=master)](https://travis-ci.org/tjisse/angular-hot-livereload-plugin) [![Bower](https://img.shields.io/bower/v/angular-hot-livereload-plugin.svg)](https://bower.io/search/?q=angular-hot-livereload-plugin)

### About
This plugin allows reloading parts of your Angular 1.x application while developing, without needing to trigger a full page reload. It was inspired by [angular-hot-reloader](https://github.com/honestica/angular-hot-reloader). I needed something similar, but without the Webpack dependency.

### Installation
1. `bower install angular-hot-livereload-plugin`
2. Load the plugin script next to livereload.js in your development workflow

### Usage
For this plugin to work a few things should be kept in mind:
  - Your application should use the Angular 1.5+ component-based application architecture
  - (File)names used should be predictable:
    - `[kebab-case-name].component.js` :
        ```js
        angular.module('...').component('[camelCaseName]', {
                controller: [PascalCaseName]Controller,
                templateUrl: '...'
        });

        function [PascalCaseName]Controller() {
            ...
        }
        ```
    - `[kebab-case-name].service.js` :
        ```js
        angular.module('...').service([PascalCaseName].name, [PascalCaseName]);

        function [PascalCaseName]() {
            ...
        }
        ```
    - `[kebab-case-name].template.js`
    
  - Some kind of LiveReload server is needed, for example [grunt-contrib-watch](https://github.com/gruntjs/grunt-contrib-watch)
