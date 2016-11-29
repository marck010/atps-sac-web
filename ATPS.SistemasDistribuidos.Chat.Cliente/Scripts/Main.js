var moduloChat = angular.module("ModuloChat", []);

var urlWsHttp = "http://104.198.254.136/";
var urlWs = "ws://104.198.254.136/";
//var urlWsHttp = "http://localhost:6100/";
//var urlWs = "ws://localhost:610

function TratarErro(retorno, matarSessao) {
    if (!retorno) {
        alert("Ocorreu um erro inesperado");
    }

    switch (retorno.TipoErro) {
        case Enums.TipoErro.SessaoExpirada:
            if (typeof (matarSessao) == "function") {
                matarSessao();
            }
            break;
        case Enums.TipoErro.NaoTratado:
            alert("Ocorreu um erro inesperado");
            break;

        case Enums.TipoErro.ErroTratado:
            alert(retorno.Error);
            break;

    }

    console.log(retorno);
}

var Enums = {
    TipoErro: {
        SessaoExpirada : 1,
        NaoTratado : 2,
        ErroTratado : 3
    }
};
