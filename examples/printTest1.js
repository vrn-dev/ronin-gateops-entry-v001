const Pos = require('../lib');
const checkSum = require('../lib/utils');
const moment = require('moment');
const Device = new Pos.Usb();
const Printer = new Pos.Printer(Device);

const getDateText = moment().format('DD-MM-YYYY');
const getTimeText = moment().format('HH:mm:ss');
const barcode12 = moment().format('DDMMYYHHmmss');

const barcode13 = checkSum.getEAN13CheckSum(barcode12).toString();

Device.open((err) => {
    Printer
        .setTextFont('A')
        .setTextAlignment('CENTER')
        .setTextBold('ON')
        .setTextUnderline('ON')
        .setTextSize('DOUBLE')
        .println('RoninTech Parking')
        .setTextBold('OFF')
        .setTextUnderline('OFF')
        .setTextSize('NORMAL')
        .setBarcode(barcode12)
        .feed(2)
        .println(getDateText)
        .println(getTimeText)
        .feed(2)
        .println('1 Hours AED 10')
        .println('First 15 Minutes Free')
        .println('Lost Ticket Charge AED 150')
        .setTextItalic('ON')
        .println('Thank You')
        .cut()
        .close();
    if ( err ) console.log(err);
});