const moment = require('moment');
const Pos = require('../lib');
const Device = new Pos.Usb();
const Printer = new Pos.Printer(Device);
const checkSum = require('../lib/utils');

exports.ticketData = function () {

};
