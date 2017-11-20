angular.module('app').controller('TaskManagerCtrl', TaskManagerCtrl);

function TaskManagerCtrl($rootScope, $scope, $auth, $http, $filter, $state, $interval, $mdDialog, TaskManagerService) {
    $scope.tasks = [
        { title: 'Task 1', description: 'Descrição task 1', attachment: [], priority: 1, userName: 'Usuario1', closeBy: '', status: 'Novo', display: 'visible' },
        { title: 'Task 2', description: 'Descrição task 2', attachment: [], priority: 2, userName: 'Usuario2', closeBy: '', status: 'Novo', display: 'visible' },
        { title: 'Task 3', description: 'Descrição task 3', attachment: [], priority: 3, userName: 'Usuario3', closeBy: '', status: 'Novo', display: 'visible' }
    ];
    
    $scope.queueTask = [];
    
    $scope.StartTimer = function () {
        $scope.pooling = $interval(function () {
            if ($scope.queueTask.length > 0) {
                $scope.queueTask.forEach(function(task, index) {
                    if(task.task.attachment != undefined && task.task.attachment.length > 0)
                        uploadFileToAWSS3(task.task.attachment);
                        
                    $scope.tasks[task.id].status = 'Processada';
                    $scope.queueTask.splice(index, 1);
                });
            }
        }, 5000);
    };

    $scope.StopTimer = function () {
        if (angular.isDefined($scope.pooling)) {
            $interval.cancel($scope.pooling);
        }
    };
    
    if(!$auth.isAuthenticated() && $auth.getToken() != null) {
        alert("Não foi detectado uma autenticação válida.");
        $state.go('login');
    }
    
    $scope.priorityList = [ 1, 2, 3, 4, 5 ];
    
    $scope.createTaskForm = function(event) {
        resetForm();
        
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'app/taskManager/templates/create-task.html',
            parent: angular.element(document.body),
            clickOutsideToClose: true,
            scope: $scope,
            preserveScope: true
        });
    };
    
    $scope.showTaskDetailForm = function(task){
        $scope.title = task.title;
        $scope.description = task.description;
        $scope.priority = task.priority;
        $scope.userName = task.userName;
        $scope.status = task.status;
        $scope.closeBy = task.closeBy;
        $scope.attachment = "";
        
        for(var i = 0; i < task.attachment.length; i++) {
            if(i == 0)
                $scope.attachment = task.attachment[i].name;
            else
                $scope.attachment += "; " + task.attachment[i].name;
        }
 
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'app/taskManager/templates/read-task.html',
            parent: angular.element(document.body),
            clickOutsideToClose: true,
            scope: $scope,
            preserveScope: true,
            fullscreen: true
        }).then(
            function() {
                resetForm();
                $mdDialog.close();
            },
            function() {
            }
        );
    }
    
    $scope.showUpdateTaskForm = function(index, task) {
        $scope.index = index;
        $scope.title = task.title;
        $scope.description = task.description;
        $scope.attachment = task.attachment;
        $scope.prioritySelected = task.priority;
        $scope.userName = task.userName;
 
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'app/taskManager/templates/update-task.html',
            parent: angular.element(document.body),
            clickOutsideToClose: true,
            scope: $scope,
            preserveScope: true,
            fullscreen: true
        }).then(
            function() {
                resetForm();
                $mdDialog.close();
            },
            function() {
            }
        );
    }
    
    $scope.submitTask = function(index) {
        if($scope.tasks[index].status == 'Done') {
            alert("Esta task foi encerrada!");
            return;
        }
        
        var queueItem = {id: index, task: $scope.tasks[index]}
        
        $scope.queueTask.push(queueItem);
        $scope.tasks[index].status = 'Processando';
    };
    
    $scope.$watch('taskSearchKeywords', function(newValue, oldValue) {
        if(newValue != undefined) {
            if(newValue == '') {
                $scope.tasks.forEach(function(task, index) {
                    $scope.tasks[index].display = 'visible';
                });
                
                return;
            }
            
            $scope.tasks.filter(el => {
                if(el.title.indexOf($scope.taskSearchKeywords) !== -1) {
                    return true;
                }
                else {
                    el.display = 'none';
                    return false;
                }
            })
        }
    });
    
    $scope.confirmDeleteTask = function(event, task, index) {
        if($scope.tasks[index].status == 'Done') {
            alert("Esta task foi encerrada!");
            return;
        }
        
        var confirm = $mdDialog.confirm()
            .title('Você tem certeza?')
            .textContent('O item "'+ task.title + '" será removido.')
            .targetEvent(event)
            .ok('Sim')
            .cancel('Não');
     
        $mdDialog.show(confirm).then(
            function() {
                deleteTask(index);
            },
            function() {
                $mdDialog.hide();
            }
        );
    }
    
    $scope.closeTask = function(index) {
        if($scope.tasks[index].status == 'Done') {
            alert("Esta task foi encerrada!");
            return;
        }
        else if($scope.tasks[index].status == 'Novo') {
            alert("Favor processar a atividade antes de encerrá-la.");
            return;
        }
        
        /* TODO: Task indexada no Elastic Search para buscas futuras
        var elasticsearch = require('elasticsearch');
        
        var esclient = new elasticsearch.Client({
            host: 'localhost:9200'
        });
        
        esclient.search({
            index: 'social-*',
            body: {
            query: {
              match: { message: $scope.tasks[index].title }
            },
            aggs: {
              top_10_states: {
                terms: {
                    field: 'state',
                    size: 10
                }
              }
            }
            }
        }).then(function (response) {
            var hits = response.hits.hits;
        });
        */
        
        //TODO: Informar o usuário que encerrou a atividade
        $scope.tasks[index].closeBy = $scope.tasks[index].userName;
        $scope.tasks[index].status = 'Done';
    };
    
    function deleteTask(index) {
        $scope.tasks.splice(index, 1);
    }
    
    function resetForm() {
        $scope.title = null;
        $scope.description = null;
        $scope.attachment = null;
        $scope.priority = null;
        $scope.userName = null;
        $scope.status = null;
    }
    
    function uploadFileToAWSS3(files) {
        $scope.credentials = {
          bucket: 'bucket',
          access_key: 'access_key',
          secret_key: 'secret_key'
        }
        
        /* TODO: Salvar os uploads no AWS S3 (falta crendenciais)
        AWS.config.update({ accessKeyId: $scope.credentials.access_key, secretAccessKey: $scope.credentials.secret_key });
        AWS.config.region = 'us-east-1';
        var bucket = new AWS.S3({ params: { Bucket: $scope.credentials.bucket } });
        
        angular.forEach("files", function(file) {
            var params = { Key: file.name, ContentType: $scope.file.type, Body: file, ServerSideEncryption: 'AES256' };
        
            bucket.putObject(params, function(err, data) {
              if(err) {
                alert(err.message);
                return false;
              }
              else {
                console.log('Upload Done');
              }
            })
            .on('httpUploadProgress',function(progress) {
              console.log(Math.round(progress.loaded / progress.total * 100) + '% done');
            });
        });
        */
    }
    
    function DialogController($scope, $mdDialog) {
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
        
        $scope.createTask = function() {
            var task = {
                title: $scope.title, 
                description: $scope.description, 
                attachment: $scope.currentFiles == null ? [] : $scope.currentFiles, 
                priority: $scope.prioritySelected,
                status: 'Novo',
                display: 'visible',
                userName: '',
                closeBy: ''
            };
            
            $scope.tasks.push(task);
            
            $mdDialog.cancel();
        };
        
        $scope.editTask = function(index) {
            $scope.tasks[index].title = $scope.title;
            $scope.tasks[index].description = $scope.description;
            $scope.tasks[index].priority = $scope.prioritySelected;
            
            $mdDialog.cancel();
        };
    }
    
    $scope.setAttachments = function(file) {
        $scope.currentFiles = file.files;
        
        if($scope.tasks[$scope.index] != undefined)
            $scope.tasks[$scope.index].attachment = file.files;
    };
    
    $scope.StartTimer();
}