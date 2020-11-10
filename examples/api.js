// Node.js example
/* running 'npm run build' is necessary before launching the examples */
var {Apis} = require("../cjs")
// let wsString = "wss://core.revolutionpopuli.com/ws";
let wsStringLocal = "ws://127.0.0.1:8090";

Apis.instance(wsStringLocal, true).init_promise.then((res) => {
    console.log("connected to:", res[0].network);

    Apis.instance().db_api().exec( "set_subscribe_callback", [ updateListener, true ] );
});

function updateListener(object) {
    console.log("set_subscribe_callback update:\n", object);
}
