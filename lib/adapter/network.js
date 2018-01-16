'use strict';
const net = require('net');
const util = require('util');
const EventEmitter = require('events');

/**
 * Network Adapter
 *
 * @param address
 * @param port
 * @returns {Network}
 * @constructor
 */
function Network(address, port) {
    EventEmitter.call(this);
    this.address = address;
    this.port = port || 9100;
    this.device = new net.Socket();
    return this;
}

util.inherits(Network, EventEmitter);

/**
 * Connect to remote device
 * @param callback
 * @returns {Network}
 */
Network.prototype.open = function (callback) {
    var self = this;
    //connect to net printer by socket (port,ip)
    this.device.on("error", (err) => {
        callback && callback(err, self.device);
    }).connect(this.port, this.address, function (err) {
        self.emit('connect', self.device);
        callback && callback(err, self.device);
    });
    return this;
};


/**
 * Write data to printer
 * @param data
 * @param callback
 * @returns {Network}
 */
Network.prototype.write = function (data, callback) {
    this.device.write(data, callback);
    return this;
};

/**
 * Close connection
 * @param callback
 * @returns {Network}
 */
Network.prototype.close = function (callback) {
    if ( this.device ) {
        this.device.destroy();
        this.device = null;
    }
    this.emit('disconnect', this.device);
    callback && callback(null, this.device);
    return this;
};

module.exports = Network;
