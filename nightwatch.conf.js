require('babel-core/register');
const phantomjs = require('phantomjs');
const seleniumPath = require('selenium-server-standalone');

module.exports = {
    src_folders: ["test"],
    output_folder: "reports",

    selenium: {
        start_process: true,
        server_path: seleniumPath
    },

    test_settings: {
        default: {
            desiredCapabilities: {
                browserName: "phantomjs",
                javascriptEnabled : true,
                'phantomjs.binary.path': phantomjs.path
            },
            exclude: ['assets/**', 'lib/**']
        }
    }
};