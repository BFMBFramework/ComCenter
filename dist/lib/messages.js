"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const util = require("util");
class MessageHandler {
    constructor(server) {
        this.server = server;
    }
    /**
    args: { token: string, network: string, options: any }
    */
    getMe(args, callback) {
        const self = this;
        if (!args.token || !args.network || !args.options) {
            return callback({ code: 100, message: 'Params provided are not { token, network, Object }' });
        }
        self.server.getAuthHandler().verifyToken(args.token, function (err, decoded) {
            if (err) {
                return callback({ code: 399, message: "Auth error. -> " + err.message });
            }
            else {
                // Check if network selected is configured for this user
                let connectionIndex = self.server.getMessageHandler().tokenHasNetwork(args.network, decoded.networks);
                if (connectionIndex > -1) {
                    // Get connector
                    let connector = self.server.getConnectorManager().getConnector(args.network);
                    logger_1.logger.log('debug', 'Connector has this data: ');
                    logger_1.logger.log('debug', util.inspect(connector, false, null, true));
                    logger_1.logger.log('debug', 'Decoded has this data: ');
                    logger_1.logger.log('debug', util.inspect(decoded, false, null, true));
                    if (connector) {
                        connector.getMe(decoded.connections[connectionIndex], args.options, function (err, response) {
                            if (err) {
                                return callback({ code: 402, message: err.message });
                            }
                            else {
                                return callback(null, response);
                            }
                        });
                    }
                    else {
                        return callback({ code: 401, message: "Network module " + args.network + " is not activated." });
                    }
                }
                else {
                    return callback({ code: 400, message: "Network " + args.network + " not found in user network list." });
                }
            }
        });
    }
    /**
    args: { token : string, network : string, options : any }
    */
    sendMessage(args, callback) {
        const self = this;
        if (!args.token || !args.network || !args.options) {
            return callback({ code: 100, message: 'Params provided are not { token, network, Object }' });
        }
        // RPC token verification
        self.server.getAuthHandler().verifyToken(args.token, function (err, decoded) {
            if (err) {
                return callback({ code: 399, message: "Auth error. -> " + err.message });
            }
            else {
                // Check if network selected is configured for this user
                let connectionIndex = self.server.getMessageHandler().tokenHasNetwork(args.network, decoded.networks);
                if (connectionIndex > -1) {
                    // Get connector
                    let connector = self.server.getConnectorManager().getConnector(args.network);
                    if (connector) {
                        connector.sendMessage(decoded.connections[connectionIndex], args.options, function (err, response) {
                            if (err) {
                                return callback({ code: 402, message: err.message });
                            }
                            else {
                                return callback(null, response);
                            }
                        });
                    }
                    else {
                        return callback({ code: 401, message: "Network module " + args.network + " is not activated." });
                    }
                }
                else {
                    return callback({ code: 400, message: "Network " + args.network + " not found in user network list." });
                }
            }
        });
    }
    /**
    args: { token: string, network: string, options: any }
    */
    receiveMessage(args, callback) {
        const self = this;
        if (!args.token || !args.network || !args.options) {
            return callback({ code: 100, message: 'Params provided are not { token, network, Object }' });
        }
        self.server.getAuthHandler().verifyToken(args.token, function (err, decoded) {
            if (err) {
                return callback({ code: 399, message: "Auth error. -> " + err.message });
            }
            else {
                let connectionIndex = self.server.getMessageHandler().tokenHasNetwork(args.network, decoded.networks);
                if (connectionIndex > -1) {
                    let connector = self.server.getConnectorManager().getConnector(args.network);
                    if (connector) {
                        connector.receiveMessage(decoded.connections[connectionIndex], args.options, function (err, response) {
                            if (err) {
                                return callback({ code: 402, message: err.message });
                            }
                            else {
                                return callback(null, response);
                            }
                        });
                    }
                    else {
                        return callback({ code: 401, message: "Network module " + args.network + " is not activated." });
                    }
                }
                else {
                    return callback({ code: 400, message: "Network " + args.network + " not found in user network list." });
                }
            }
        });
    }
    tokenHasNetwork(network, networks) {
        for (let i = 0; i < networks.length; i++) {
            if (networks[i] === network) {
                return i;
            }
        }
        return -1;
    }
}
exports.MessageHandler = MessageHandler;
