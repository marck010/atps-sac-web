
moduloChat.controller('AtendenteController', function ($scope, $http, $webSocket, $sessionStorage) {

    $scope.Chat = {};
    $scope.Chat.Atendimentos = [];
    $scope.Chat.Remetente = {};
    $scope.Chat.NovoAtendente = {};
    $scope.Chat.Cliente = {};
    $scope.Chat.Conversa = {};
    $scope.Chat.Conversa.Mensagens = [];
    $scope.Chat.AtendimentoSelecionado = false;
    $scope.Chat.Conectado = false;
    $scope.Chat.Cadastro = false;

    function Init() {

        var remetente = $sessionStorage.GetItem("Remetente");
        if (remetente) {
            $scope.Chat.Remetente.Nome = remetente.Nome;
            $scope.Chat.Remetente.ChaveAcesso = remetente.ChaveAcesso;
            $scope.Chat.Remetente.Administrador = remetente.Administrador;
            $scope.Chat.Conectar();
        }
        else {
            $scope.Chat.Conectado = false;
        }
    }

    $scope.Chat.AbrirFormularioCadastro = function () {
        $scope.Chat.Cadastro = true;
    };

    $scope.Chat.CadastrarEnter = function (event) {
        if (!event.shiftKey && event.keyCode == 13) {
            $scope.Chat.Cadastrar();
        }
    }

    $scope.Chat.Cadastrar = function () {
        if ($scope.Chat.NovoAtendente.Senha != $scope.Chat.NovoAtendente.ConfirmarSenha) {
            alert("Senhas não correspondem");
            return;
        }
        var parametros = {
            Nome: $scope.Chat.NovoAtendente.Nome,
            Email: $scope.Chat.NovoAtendente.Email,
            Telefone: $scope.Chat.NovoAtendente.Telefone,
            Login: $scope.Chat.NovoAtendente.Login,
            Senha: $scope.Chat.NovoAtendente.Senha,
        };

        $http({
            url: urlWsHttp + "Chat/CadastroAtendente",
            method: "POST",
            data: JSON.stringify(parametros),
            headers: {
                'Content-Type': 'application/json',
                'ChaveAcesso': $scope.Chat.Remetente.ChaveAcesso,
            }
        }).success(function (data) {
            alert("Atendente cadastrado com sucesso.");
            $scope.Chat.NovoAtendente.Nome = "";
            $scope.Chat.NovoAtendente.Email = "";
            $scope.Chat.NovoAtendente.Telefone = "";
            $scope.Chat.NovoAtendente.Login = "";
            $scope.Chat.NovoAtendente.Senha = "";
            $scope.Chat.NovoAtendente.ConfirmarSenha = "";
            $scope.Chat.Cadastro = false;
        }).error(function (data) {
            TratarErro(data)
        });
    };

    $scope.Chat.LogarEnter = function (event) {
        if (!event.shiftKey && event.keyCode == 13) {
            $scope.Chat.Logar();
        }
    }

    $scope.Chat.Logar = function () {

        if (!$scope.Chat.Remetente.Senha || !$scope.Chat.Remetente.Login) {
            alert("Usuário e senha obrigatório.");
            return;
        }
        var parametros = {
            Login: $scope.Chat.Remetente.Login,
            Senha: $scope.Chat.Remetente.Senha
        };

        $http({
            url: urlWsHttp + "Chat/AutenticarAtendente",
            method: "POST",
            data: JSON.stringify(parametros),
            headers: {
                'Content-Type': 'application/json'
            }
        }).success(function (data) {
            $scope.Chat.Remetente.ChaveAcesso = data.ChaveAcesso;
            $scope.Chat.Remetente.Administrador = data.Administrador;
            $scope.Chat.Conectar();
        }).error(function (data) {
            TratarErro(data, matarSessao)
        });
    };

    $scope.Chat.Conectar = function () {
        $sessionStorage.SetItem("Remetente", $scope.Chat.Remetente);
        $webSocket.Conectar($scope.Chat.Remetente.ChaveAcesso);
        if ($webSocket.ConexaoAberta()) {
            $webSocket.OnMessage(function (mensagem) {

                var retorno = JSON.parse(mensagem.data);
                if (retorno.Error) {
                    TratarErro(retorno, matarSessao)
                    $scope.$apply();
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
                matarSessao();
                $scope.Chat.Conectado = false;
                $scope.$apply();
            });
        }
    };

    $scope.Chat.Desconectar = function () {
        $webSocket.Desconectar();
        $scope.Chat.Cadastro = false;

    };


    $scope.Chat.SelecionarDestinatario = function (atendimentoSelecionado) {

        Enumerable.From($scope.Chat.Atendimentos).Where(function (atendimento) {
            return !!atendimento.Selecionado;
        }).ForEach(function (atendimento) {
            atendimento.Selecionado = false;
        });

        $scope.Chat.AtendimentoSelecionado = true;
        atendimentoSelecionado.Selecionado = true;
        if (atendimentoSelecionado.Conversa) {
            $scope.Chat.Conversa = atendimentoSelecionado.Conversa;
        } else {
            $scope.Chat.Conversa = {};
            $scope.Chat.Conversa.Mensagens = [];
        }

        $scope.Chat.Cliente = atendimentoSelecionado.Usuario;

    };

    $scope.Chat.Remetente.EnviarEnter = function (event) {
        if (!event.shiftKey && event.keyCode == 13) {
            $scope.Chat.Remetente.Enviar();
        }
    }

    $scope.Chat.Remetente.Enviar = function () {

        if ($scope.Chat.Mensagem) {
            var idAtendimento = !$scope.Chat.Conversa || !$scope.Chat.Conversa.Id ? '' : $scope.Chat.Conversa.Id;

            $webSocket.Enviar($scope.Chat.Cliente.Login, $scope.Chat.Mensagem, idAtendimento);

            $scope.Chat.Conversa.Mensagens.push({ Texto: $scope.Chat.Mensagem, Remetente: $scope.Chat.Remetente });

            $scope.Chat.Mensagem = '';
        }
    };

    function listarAtendimentos(retorno) {

        if ($scope.Chat.Atendimentos.length == 0) {
            $scope.Chat.Atendimentos.push(retorno);
        }
        else {
            var atendimentoEmAndamento = Enumerable.From($scope.Chat.Atendimentos).FirstOrDefault(null, function (atendimento) {
                return retorno.Usuario.Login == atendimento.Usuario.Login
            });

            if (atendimentoEmAndamento) {
                if (retorno.UsuarioDesconectado) {
                  var atendimentos =   Enumerable.From($scope.Chat.Atendimentos).ToDictionary();
                  atendimentos.Remove(atendimentoEmAndamento);
                  $scope.Chat.Atendimentos = atendimentos.ToEnumerable().Select(function (item) {
                                                                                  return item.Key;
                                                                              }).ToArray();
                  $scope.Chat.Conversa.Mensagens = [];
                }
                else if (retorno.Conversa) {
                    atendimentoEmAndamento.Conversa = retorno.Conversa;
                    if (atendimentoEmAndamento.Selecionado) {
                        $scope.Chat.Conversa = atendimentoEmAndamento.Conversa;
                    }
                }
            } else {
                $scope.Chat.Atendimentos.push(retorno);
            }
        }
    }

    function matarSessao() {
        $scope.Chat.Atendimentos = [];
        $scope.Chat.Conversa.Mensagens = [];
        $sessionStorage.RemoveItem("Remetente");
        $scope.Chat.Conectado = false;
    }

    Init();

})

