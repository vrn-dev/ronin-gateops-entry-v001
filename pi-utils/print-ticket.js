const moment = require('moment');
const Pos = require('../lib');
const Device = new Pos.Usb();
const Printer = new Pos.Printer(Device);
const checkSum = require('../lib/utils');

exports.ticketData = function () {
    const getDateText = moment().format('DD-MM-YYYY');
    const getTimeText = moment().format('HH:mm:ss');
    const barcode12 = moment().format('DDMMYYHHmmss');

    const barcode13 = barcode12 + checkSum.getEAN13CheckSum(barcode12).toString();

    Device.open((err) => {
        Printer
            .setTextFont('A')
            .setTextAlignment('CENTER')
            .setTextBold('ON')
            .setTextUnderline('ON')
            .setTextSize('DOUBLE')
            .println('Car Value Parking')
            .setTextBold('OFF')
            .setTextUnderline('OFF')
            .setTextSize('NORMAL')
            .setBarcode(barcode12)
            .feed(2)
            .println(getDateText)
            .println(getTimeText)
            .feed(2)
            .println('1 Hour AED 15')
            // .println('First 15 Minutes Free')
            .println('Lost Ticket AED 150')
            .setTextItalic('ON')
            .println('Thank You')
            .cut('FULL')
            .close();
        if ( err ) console.log(err);
    });
    return {
        barcode: barcode13,
        issuedAt: barcode12
    }
};
