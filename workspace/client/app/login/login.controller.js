angular.module('app').controller('LoginCtrl', LoginCtrl);

function LoginCtrl($rootScope, $scope, $auth, $state) {
    $scope.authenticate = function(provider) {
      $auth.authenticate(provider)
      .then(function(response) {
        //$auth.setToken(response.config.data.code);
        $state.go('main.task');
      })
      .catch(function(response) {
        console.log(response);
        alert("Autentique-se corretamente antes de prosseguir, por favor.");
      });
    };
}