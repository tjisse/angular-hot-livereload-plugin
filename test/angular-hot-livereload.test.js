'use strict';

const connect = require('connect');
const ss = require('serve-static');
const st = require('connect-static-transform');
const livereload = require('livereload');

const port = 3000;
const libDir = __dirname + '/../node_modules';
const distDir = __dirname + '/../dist';
const assetsDir = __dirname + '/assets';
const htmlDir = assetsDir + '/html';
const templatesDir = assetsDir + '/templates';
const jsDir = assetsDir + '/js';

let serverHandle;
let lrServer;
let nrReloads = {
    total: 1,
    controller: 1,
    service: 1,
    template: 1
};

module.exports = {

    'Initial state': brsr => {
        brsr.url('http://localhost:3000/index.html')
            .assert.containsText('#nrReloadsTotal', nrReloads.total)
            .assert.containsText('#nrReloadsController', nrReloads.controller)
            .assert.containsText('#nrReloadsService', nrReloads.service)
            .assert.containsText('#nrReloadsTemplate', nrReloads.template)
            .end();
    },

    'Reload controller': brsr => {
        brsr.url('http://localhost:3000/index.html')
            .waitForElementVisible('#nrReloadsController', 5000)
            .assert.containsText('#nrReloadsController', nrReloads.controller)
            .assert.containsText('#nrReloadsTotal', nrReloads.total)
            .pause(2000)
            .assert.containsText('#nrReloadsController', nrReloads.controller + 1)
            .assert.containsText('#nrReloadsTotal', nrReloads.total)
            .end();

        setTimeout(() => lrServer.refresh('/js/test.component.js'), 4000);
    },

    'Reload service': brsr => {
        brsr.url('http://localhost:3000/index.html')
            .waitForElementVisible('#nrReloadsService', 5000)
            .assert.containsText('#nrReloadsService', nrReloads.service)
            .assert.containsText('#nrReloadsTotal', nrReloads.total)
            .pause(2000)
            .assert.containsText('#nrReloadsService', nrReloads.service + 1)
            .assert.containsText('#nrReloadsTotal', nrReloads.total)
            .end();

        setTimeout(() => lrServer.refresh('/js/test.service.js'), 4000);
    },

    'Reload template': brsr => {
        brsr.url('http://localhost:3000/index.html')
            .waitForElementVisible('#nrReloadsTemplate', 5000)
            .assert.containsText('#nrReloadsTemplate', nrReloads.template)
            .assert.containsText('#nrReloadsTotal', nrReloads.total)
            .pause(2000)
            .assert.containsText('#nrReloadsTemplate', nrReloads.template + 1)
            .assert.containsText('#nrReloadsTotal', nrReloads.total)
            .end();

        setTimeout(() => lrServer.refresh('/templates/test.template.html'), 4000);
    },

    before: () => {
        const server = connect();
        lrServer = livereload.createServer();
        lrServer.watch(assetsDir);
        server.use('/lib', ss(libDir));
        server.use('/dist', ss(distDir));
        server.use(st({
            root: htmlDir,
            match: /.+\.html/,
            transform: (path, text, send) => {
                console.log("Total reload");
                send(text.replace('[nrReloads]', nrReloads.total++));
            }
        }));
        server.use('/js', st({
            root: jsDir,
            match: /.+\.js/,
            transform: (path, text, send) => {
                if (path.match(/.+\.component\..+/)) {
                    console.log("Controller reload");
                    send(text.replace('[nrReloads]', nrReloads.controller++));
                } else if (path.match(/.+\.service\..+/)) {
                    console.log("Service reload");
                    send(text.replace('[nrReloads]', nrReloads.service++));
                } else {
                    send(text)
                }
            }
        }));
        server.use('/templates', st({
            root: templatesDir,
            match: /.+\.html/,
            transform: (path, text, send) => {
                console.log("Template reload");
                send(text.replace('[nrReloads]', nrReloads.template++));
            }
        }));
        serverHandle = server.listen(port);
    },

    after: () => {
        serverHandle.close();
        lrServer.close();
    }
};