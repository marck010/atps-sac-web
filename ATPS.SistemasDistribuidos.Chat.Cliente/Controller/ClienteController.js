
moduloChat.controller('ClienteController', function ($scope, $http, $webSocket, $sessionStorage) {

    $scope.Chat = {};
    $scope.Chat.Atendente;
    $scope.Chat.Remetente = {};
    $scope.Chat.Conectado = false;
    $scope.Chat.Conversa = {};
    $scope.Chat.Conversa.Mensagens = [];

    function Init() {
        var remetente = $sessionStorage.GetItem("Remetente");
        if (remetente) {
            $scope.Chat.Remetente.Nome = remetente.Nome;
            $scope.Chat.Remetente.ChaveAcesso = remetente.ChaveAcesso;
            $scope.Chat.Conectar();
        }
    }

    $scope.Chat.CadastrarEnter = function (event) {
        if (!event.shiftKey && event.keyCode == 13) {
            $scope.Chat.Cadastrar();
        }
    }

    $scope.Chat.Cadastrar = function () {
        var parametros = {
            Nome: $scope.Chat.Remetente.Nome,
            Email: $scope.Chat.Remetente.Email,
            Telefone: $scope.Chat.Remetente.Telefone,
            Login: '',
            Senha: ''
        };

        $http({
            url: urlWsHttp + "Chat/CadastroCliente",
            method: "POST",
            data: JSON.stringify(parametros),
            headers: {
                'Content-Type': 'application/json'
            }
        }).success(function (data) {
            $scope.Chat.Remetente.ChaveAcesso = data.ChaveAcesso;
            $scope.Chat.Conectar();
        })
        .error(function (data) {
            TratarErro(data, matarSessao)
        });;
    };

    $scope.Chat.Conectar = function () {
        if ($scope.Chat.Remetente.ChaveAcesso) {

            $sessionStorage.SetItem("Remetente", $scope.Chat.Remetente);

            $webSocket.Conectar($scope.Chat.Remetente.ChaveAcesso);

            $webSocket.OnMessage(function (mensagem) {

                var retorno = JSON.parse(mensagem.data);
                if (retorno.Error) {
                    if (retorno.Error) {
                        TratarErro(retorno, matarSessao)
                        $scope.$apply();
                        return;
                    }
                    return;
                }

                listarAtendimentos(retorno);
                $scope.$apply();

            });

            $webSocket.OnOpen(function () {
                $scope.Chat.Conectado = true;
                $scope.$apply();
            });

            $webSocket.OnError(function () {
                alert("Ocorreu um erro na conexão.");
            });

            $webSocket.OnClose(function () {
                $sessionStorage.RemoveItem("Remetente");
                $scope.Chat.Conectado = false;
                matarSessao();
                $scope.$apply();
            });
        }
    };

    $scope.Chat.Desconectar = function () {
        $webSocket.Desconectar();
        $scope.Chat.Atendente = null;
        $scope.Chat.Conversa.Mensagens = [];
    };

    $scope.Chat.Remetente.EnviarEnter = function (event) {
        if (!event.shiftKey && event.keyCode == 13) {
            $scope.Chat.Remetente.Enviar();
        }
    }

    $scope.Chat.Remetente.Enviar = function () {
        if (!$scope.Chat.Atendente) {
            alert("Favor informar aguardar o atendimento");
            return;
        }
        if ($scope.Chat.Mensagem) {
            var id = $scope.Chat.Atendente.Conversa.Id;
            $webSocket.Enviar($scope.Chat.Atendente.Usuario.Conversa.Login, $scope.Chat.Mensagem, id);
            $scope.Chat.Conversa.Mensagens.push({ Texto: $scope.Chat.Mensagem, Remetente: $scope.Chat.Remetente });
            $scope.Chat.Mensagem = '';
        }
    };

    function listarAtendimentos(retorno) {
        if (!retorno.UsuarioDesconectado) {
            if (!$scope.Chat.Atendente) {
                $scope.Chat.Atendente = retorno;
            }
            else {
                $scope.Chat.Atendente.Conversa = retorno.Conversa;
            }
        } else {
            $scope.Chat.Atendente = null;
        }

    }

    function matarSessao() {

        $scope.Chat.Conversa.Mensagens = [];
        $sessionStorage.RemoveItem("Remetente");
        $scope.Chat.Conectado = false;
    }

    Init();
})

