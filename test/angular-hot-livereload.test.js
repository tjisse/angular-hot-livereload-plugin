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
    total: 0,
    controller: 0,
    service: 0,
    template: 0
};

module.exports = {

    'Initial state': brsr => {
        brsr.expect.element('#nrReloadsTotal').text.to.contain(1);
        brsr.expect.element('#nrReloadsController').text.to.contain(1);
        brsr.expect.element('#nrReloadsService').text.to.contain(1);
        brsr.expect.element('#nrReloadsTemplate').text.to.contain(1);
        brsr.end();
    },

    'Reload controller': brsr => {
        brsr.expect.element('#nrReloadsController').text.to.contain(nrReloads.controller);
        lrServer.refresh('/js/test.component.js');

        brsr.expect.element('#nrReloadsController').text.to.contain(nrReloads.controller);
        brsr.expect.element('#nrReloadsTotal').text.to.contain(1);
        brsr.end();
    },

    'Reload service': brsr => {
        brsr.expect.element('#nrReloadsService').text.to.contain(nrReloads.service);
        lrServer.refresh('/js/test.service.js');

        brsr.expect.element('#nrReloadsService').text.to.contain(nrReloads.service);
        brsr.expect.element('#nrReloadsTotal').text.to.contain(1);
        brsr.end();
    },

    'Reload template': brsr => {
        brsr.expect.element('#nrReloadsTemplate').text.to.contain(nrReloads.template);
        lrServer.refresh('/partials/test.template.html');

        brsr.expect.element('#nrReloadsService').text.to.contain(nrReloads.template);
        brsr.expect.element('#nrReloadsTotal').text.to.contain(1);
        brsr.end();
    },

    beforeEach: brsr => {
        brsr.url('http://localhost:3000/index.html');
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
                send(text.replace('[nrReloads]', ++nrReloads.total));
            }
        }));
        server.use('/js', st({
            root: jsDir,
            match: /.+\.js/,
            transform: (path, text, send) => {
                if (path.match(/.+\.component\..+/)) {
                    send(text.replace('[nrReloads]', ++nrReloads.controller));
                } else if (path.match(/.+\.service\..+/)) {
                    send(text.replace('[nrReloads]', ++nrReloads.service));
                } else {
                    send(text)
                }
            }
        }));
        server.use('/templates', st({
            root: templatesDir,
            match: /.+\.html/,
            transform: (path, text, send) => {
                send(text.replace('[nrReloads]', ++nrReloads.template));
            }
        }));
        serverHandle = server.listen(port);
    },

    after: () => {
        serverHandle.close();
        lrServer.close();
    }
};