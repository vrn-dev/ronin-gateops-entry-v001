'use strict';

const _ = require('lodash');
const mongoose = require('mongoose');
const moment = require('moment');
const PiGpio = require('pigpio');
const Gpio = PiGpio.Gpio;
// const PiGpioTemp = require('pigpio_temp');
// const GpioTemp = PiGpioTemp.Gpio;
const Pos = require('./lib');
const Device = new Pos.Usb();
const Printer = new Pos.Printer(Device);

// Local imports
const LoopWatcher = require('./pi-utils/loop-watcher');
const ticketPrinter = require('./pi-utils/print-ticket');
const Ticket = require('./models/ticket-model');

// PiGpioTemp.initialize();
PiGpio.initialize();
process.on('SIGINT', () => {
    console.log('Received SIGINT.  Press Control-D to exit.');
    PiGpio.terminate();
    Device.close();
    console.log('Terminating ....');
});

const EntryLoop = new Gpio(5, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_DOWN,
    edge: Gpio.EITHER_EDGE
});

const EntryGate = new Gpio(19, {
    mode: Gpio.OUTPUT,
    alert: true
});

const TicketButton = new Gpio(6, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_DOWN,
    edge: Gpio.RISING_EDGE,
});

const ExitLoop = new Gpio(13, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_DOWN,
    edge: Gpio.EITHER_EDGE
});

mongoose.connect('mongodb://192.168.1.125:27017/gateops_test', { useMongoClient: true });
mongoose.Promise = global.Promise;

const entryLoopActive = new LoopWatcher();
const exitLoopActive = new LoopWatcher();

let thisBarcode = undefined;
let thisIssuedAt = undefined;
let thisTicketIssued = false;

console.log('Ticket Printer Module Acitve. Waiting for inputs....');

EntryLoop.on('interrupt', _.debounce((level) => {
    if ( level === 1 )
        entryLoopActive.isActive = true;
    else if ( level === 0 )
        entryLoopActive.isActive = false;
}, 100));

ExitLoop.on('interrupt', _.debounce((level) => {
    if ( level === 1 )
        exitLoopActive.isActive = true;
    else if ( level === 0 )
        exitLoopActive.isActive = false;
    // if ( !entryLoopActive && exitLoopActive)

    if ( !entryLoopActive.isActive && !exitLoopActive.isActive ) {
        EntryGate.trigger(100, 1);
        console.log('Saving Ticket');
        saveTicket();
    }

}, 100));

TicketButton.on('interrupt', _.debounce((level) => {
    if ( level === 1 && entryLoopActive.isActive && !thisTicketIssued )
        printTicket();
}, 2000));

function printTicket() {
    const ticketData = ticketPrinter.ticketData();
    thisBarcode = ticketData.barcode;
    thisIssuedAt = moment(ticketData.issuedAt, 'DDMMYYHHmmss');
    console.log(thisBarcode);
    console.log(thisIssuedAt);
    EntryGate.trigger(100, 1);
    thisTicketIssued = true;
}

function saveTicket() {
    const newTicket = new Ticket({
        _id: thisBarcode,
        issuedAt: thisIssuedAt
    });

    newTicket.save()
        .then(result => {
            console.log(result);
            thisBarcode = undefined;
            thisIssuedAt = undefined;
            thisTicketIssued = false;
        })
        .catch(err => console.error(err))
}