
moduloChat.factory('$sessionStorage', function () {
    var webSockets;

    var SetItem = function (key, objeto) {

        var objetoSerializado = JSON.stringify(objeto);

        sessionStorage.setItem(key, objetoSerializado);

    }

    var GetItem = function (key) {
        var objetoSerializado = sessionStorage.getItem(key);
        try {
            var objetoJson = JSON.parse(objetoSerializado);

            return objetoJson;
        } 
        catch (e) {

            return objetoSerializado;
        }
    };

    var RemoveItem = function (key) {

        sessionStorage.removeItem(key);

    }

    var IsPresent = function (onMessage) {

        var objetoSerializado = sessionStorage.getItem(key);

        return !!objetoSerializado;
    }

    return {
        SetItem: SetItem,
        GetItem: GetItem,
        RemoveItem: RemoveItem,
        IsPresent: IsPresent
    }
});