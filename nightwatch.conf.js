require('babel-core/register');
const chromedriver = require('chromedriver');
const seleniumPath = require('selenium-server-standalone');

module.exports = {
    src_folders: ["test"],
    output_folder: "reports",

    selenium: {
        start_process: true,
        server_path: seleniumPath,
        cli_args: {
            "webdriver.chrome.driver": chromedriver.path
        }
    },

    test_settings: {
        default: {
            desiredCapabilities: {
                browserName: "chrome",
                javascriptEnabled : true
            },
            exclude: ['assets/**', 'lib/**']
        }
    }
};