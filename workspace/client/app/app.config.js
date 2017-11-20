angular.module('app').config(function ($stateProvider, $urlRouterProvider, $mdDateLocaleProvider, $authProvider, $qProvider) {

    $qProvider.errorOnUnhandledRejections(false);
    
    moment.locale("pt-br");

    $mdDateLocaleProvider.formatDate = function(date) {
        var m = moment(date);
        return m.isValid() ? m.format('DD/MM/YYYY') : '';
    };

    $authProvider.httpInterceptor = function() { return true; },
    $authProvider.withCredentials = false;
    $authProvider.tokenRoot = null;
    $authProvider.baseUrl = '/';
    $authProvider.loginUrl = '/auth/login';
    $authProvider.signupUrl = '/auth/signup';
    $authProvider.unlinkUrl = '/auth/unlink/';
    $authProvider.tokenName = 'token';
    $authProvider.tokenPrefix = 'satellizer';
    $authProvider.tokenHeader = 'Authorization';
    $authProvider.tokenType = 'Bearer';
    $authProvider.storageType = 'localStorage';
    
    $authProvider.google({
      clientId: '851705224638-8p26ikf4qifoe2ca1jmra6gft2i0b5k9.apps.googleusercontent.com',
      responseType: 'token'
    });
    
    $authProvider.google({
      url: '/client/index.html#!/main/task-manager',
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
      redirectUri: window.location.origin,
      requiredUrlParams: ['scope'],
      optionalUrlParams: ['display'],
      scope: ['profile', 'email'],
      scopePrefix: 'openid',
      scopeDelimiter: ' ',
      display: 'popup',
      oauthType: '2.0',
      popupOptions: { width: 452, height: 633 }
    });
    
    $urlRouterProvider.otherwise("/login");

    $stateProvider

        .state('login', {
            url: "/login",
            templateUrl: "app/login/templates/login.html",
            controller: 'LoginCtrl'
        })
        .state('main', {
            abstract: true,
            url: "/main",
            templateUrl: "app/common/templates/main.html"
        })
        .state('main.task', {
            url: "/task-manager",
            templateUrl: "app/taskManager/templates/task-manager.html",
            controller: 'TaskManagerCtrl'
        })

});