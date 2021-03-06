"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const async_1 = require("async");
const network_1 = require("../schemas/network");
const user_1 = require("../schemas/user");
const logger_1 = require("./logger");
const config_1 = require("./config");
class AuthHandler {
    constructor(server) {
        this.server = server;
    }
    addUserConnection(network, callback) {
        const connector = this.server.getConnectorManager().getConnector(network.name);
        if (connector) {
            connector.addConnection({
                token: network.token,
                username: network.username,
                password: network.password
            }, function (err, id) {
                if (err) {
                    logger_1.logger.debug("Auth error adding connection: " + err.message);
                    return callback(null, null);
                }
                else {
                    return callback(null, id);
                }
            });
        }
        else {
            return callback(null, null);
        }
    }
    stripSensitiveNetworkData(networks) {
        let strippedNetworks = networks.map(function (network) {
            return network.name;
        });
        return strippedNetworks;
    }
    /**
    args: { username: string, password: string }
    */
    authenticate(args, callback) {
        const self = this;
        if (!args.username || !args.password) {
            return callback({ code: 100, message: "Params provided are not { username, password }" });
        }
        user_1.User.findOne({
            username: args.username
        })
            .populate({ path: "networks", model: network_1.Network })
            .exec(function (err, user) {
            if (err)
                throw err;
            if (!user) {
                return callback({ code: 300, message: "User " + args.username + " not found." });
            }
            if (!user.verifyPasswordSync(args.password)) {
                return callback({ code: 301, message: "Incorrect password." });
            }
            else {
                // Creating connections
                async_1.concat(user.networks, function (network, callback) {
                    self.addUserConnection(network, callback);
                }, function (err, ids) {
                    // Creating payload and generating token for user
                    const payload = {
                        networks: self.stripSensitiveNetworkData(user.networks),
                        connections: ids
                    };
                    let token = jwt.sign(payload, config_1.config.tokenConfig.secret, {
                        algorithm: config_1.config.tokenConfig.algorithm,
                        expiresIn: config_1.config.tokenConfig.expiresIn
                    });
                    logger_1.logger.debug("Sending token to user...");
                    logger_1.logger.debug("TOKEN:" + token);
                    return callback(null, token);
                });
            }
        });
    }
    verifyToken(token, callback) {
        const self = this;
        if (token) {
            jwt.verify(token, config_1.config.tokenConfig.secret, { algorithms: [config_1.config.tokenConfig.algorithm] }, function (err, decoded) {
                if (err) {
                    self.closeOldTokenConnections(token);
                    return callback(err);
                }
                else {
                    return callback(null, decoded);
                }
            });
        }
        else {
            return callback(new Error("Token not found."));
        }
    }
    closeOldTokenConnections(token) {
        if (token) {
            let decoded = jwt.decode(token);
            let payload = decoded.payload;
            for (let i = 0; i < payload.networks.length; i++) {
                let connector = this.server.getConnectorManager().getConnector(payload.networks[i].name);
                if (connector && payload.connections[i]) {
                    connector.removeConnection(payload.connections[i], function (err) {
                        if (err) {
                            logger_1.logger.error(err.message);
                        }
                        else {
                            logger_1.logger.debug("Connection closed: (" + payload.networks[i].name + ", " + payload.connections[i] + ")");
                        }
                    });
                }
            }
        }
    }
}
exports.AuthHandler = AuthHandler;
