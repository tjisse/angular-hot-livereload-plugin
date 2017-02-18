angular.module('angular-hot-livereload-plugin-test')
    .service(Test.name, Test);

function Test() {
    Test.prototype.nrReloads = '[nrReloads]';
}