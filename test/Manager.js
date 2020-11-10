import assert from "assert";
import { Manager, Apis } from "../lib";

var defaultUrl = "wss://testnet.revolutionpopuli.com";

var faultyNodeList = [
    {url: "wss://testnet.revolutionpopuli.com", location: "Public Testnet Server"},
    {url: "ws://127.0.0.1:8090", location: "Local Testnet Server"},
];

var noWorkingNodes = [
    {url: "wss://testnet.revolutionpopuli.com/wqsdsqs", location: "Public Testnet Server"},
    {url: "ws://127.23230.0.1:8091", location: "Local Testnet Server"},
];

var fullNodeList = [
    // Testnet
    {
        url: "wss://testnet.revolutionpopuli.com",
        location: {translate: "TESTNET - RevPop Infrastructure"}
    },
    {url: "ws://127.0.0.1:8090", location: "Locally hosted"},
]


/* This node currently throws an API error for the crypto API */
var failedInitNodes = [
    {url: "wss://testnet.revolutionpopuli.com/ws ", location: "Local Testnet Server"}
];

describe("Connection Manager", function() {

    afterEach(function() {
        return new Promise(function(res) {
            Manager.close().then(res);
        })
    });

    it("Instantiates", function() {
        let man = new Manager({url: defaultUrl, urls: faultyNodeList.map(a => a.url)});
        assert.equal(man.url, defaultUrl);
    });

    it("Instantiates with orders api", function() {
        let man = new Manager({url: "wss://testnet.revolutionpopuli.com", urls: [], optionalApis: {enableOrders: true}});
        return new Promise( function(resolve, reject) {
            man.connect().then(() => {
                assert(!!Apis.instance().orders_api());
                resolve();
            })
        });
    });

    it("Tries to connect default url", function() {
        this.timeout(3000);
        let man = new Manager({url: defaultUrl, urls: faultyNodeList.map(a => a.url)});
        return new Promise( function(resolve, reject) {
            man.connect().then(resolve)
            .catch(reject)
        });
    });

    it("Tries to connect to fallback and updates current url on connection success", function() {
        this.timeout(15000);
        let man = new Manager({url: "ws://127.0.0.1:8092", urls: faultyNodeList.map(a => a.url)});
        return new Promise( function(resolve, reject) {
            man.connectWithFallback().then(function() {
                assert.equal(man.url, "wss://testnet.revolutionpopuli.com");
                resolve();
            })
            .catch(reject)
        });
    });

    it("Tries to connect to fallback and can call a callback when falling back to new url", function() {
        this.timeout(15000);
        let url = "ws://127.0.0.1:8092";
        let callbackCalled = false;
        let urlChangeCallback = function(newUrl) {
            callbackCalled = !!newUrl;
        }
        let man = new Manager({url , urls: faultyNodeList.map(a => a.url), urlChangeCallback});
        return new Promise( function(resolve, reject) {
            man.connectWithFallback().then(function() {
                assert(callbackCalled);
                resolve();
            })
            .catch(reject)
        });
    });

    it("Rejects if no connections are successful ", function() {
        this.timeout(15000);
        let man = new Manager({url: "ws://127.0.0.1:8092", urls: noWorkingNodes.map(a => a.url)});
        return new Promise( function(resolve, reject) {
            man.connectWithFallback().then(reject)
            .catch(resolve);
        });
    });

    it("Can automatically fallback when closed", function() {
        this.timeout(20000);
        let man = new Manager({
            url: "wss://testnet.revolutionpopuli.com",
            urls: ([
                "wss://testnet.revolutionpopuli.com",
                "wss://testnet2.revolutionpopuli.com",
            ]),
            autoFallback: true
        });

        return new Promise( function(resolve, reject) {
            man.connectWithFallback().then(function() {
                // Assign faulty url to simulate faulty connection
                man.url = faultyNodeList[0].url;
                Apis.instance().ws_rpc.ws.close();
                setTimeout(function() {
                    if (man.isConnected) {
                        resolve();
                        /* Set autoFallback to false here to prevent permanent reconnections*/
                        man.autoFallback = false;
                    }
                    else reject();
                }, 2000);
            });
        });
    });

    it("Can call a fallbackCb when closed", function() {
        this.timeout(20000);
        return new Promise( function(resolve, reject) {

        let man = new Manager({
            url: "wss://testnet.revolutionpopuli.com",
            urls: ([
                "wss://testnet.revolutionpopuli.com",
                "wss://testnet2.revolutionpopuli.com",
            ]),
            closeCb: function() {
                resolve();
            }
        });

            man.connectWithFallback().then(function() {
                Apis.instance().ws_rpc.ws.close();
            });
        });
    })

    it("Can check connection times for all connections", function() {
        this.timeout(20000);
        let man = new Manager({url: "ws://127.0.0.1:8090", urls: fullNodeList.map(a => a.url)});
        return new Promise( function(resolve, reject) {
            man.checkConnections().then((latencies => {
                resolve();
            })).catch(reject);
        });
    });

    it("Checks connections for url and urls", function() {
        this.timeout(20000);
        let man = new Manager({url: "wss://testnet.revolutionpopuli.com", urls: ["wss://testnet.revolutionpopuli.com/ws"]});
        return new Promise( function(resolve, reject) {
            man.checkConnections().then((latencies => {
                assert.equal(Object.keys(latencies).length, 2);
                resolve();
            })).catch(reject);
        });
    });

    // it("Throws an error if an API fails to initialize", function() {
    //     this.timeout(5000);
    //     let man = new Manager({url: failedInitNodes[0].url, urls: []});
    //     return new Promise(function(resolve, reject) {
    //         man.connect(undefined, undefined, true).then(function(res) {
    //             reject();
    //         }).catch(function(err) {
    //             resolve();
    //         });
    //     });
    // });

});
