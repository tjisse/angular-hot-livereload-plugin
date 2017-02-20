angular.module('angular-hot-livereload-plugin-test')
    .component('test',
        {
            controller: TestController,
            templateUrl: 'templates/test.template.html'
        }
    );

function TestController(Test) {
    this.Test = Test;
    this.nrReloads = '[nrReloads]';
}