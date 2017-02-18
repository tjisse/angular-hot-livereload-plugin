angular.module('angular-hot-livereload-plugin-test')
    .component('test',
        {
            controller: TestController,
            templateUrl: 'partials/test.template.html'
        }
    );

function TestController(Test) {
    this.Test = Test;
    TestController.prototype.nrReloads = '[nrReloads]';
}