'use strict';
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const _ = require('lodash');
const mongoose = require('mongoose');
const moment = require('moment');
const PiGpio = require('pigpio');
const Gpio = PiGpio.Gpio;
// const PiGpioTemp = require('pigpio_temp');
// const GpioTemp = PiGpioTemp.Gpio;
const Pos = require('./lib');
const Device = new Pos.Usb();

// Local imports
const LoopWatcher = require('./pi-utils/loop-watcher');
const ticketPrinter = require('./pi-utils/print-ticket');
const Ticket = require('./models/ticket-model');

const myFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

const logger = createLogger({
    level: 'info',
    format: combine(
        label({ label: 'entry-gate' }),
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.File({ filename: 'error.log', level: 'error', maxsize: '10000000' }),
        new transports.File({ filename: 'combined.log', maxsize: '10000000' })
    ]
});

logger.info('Initializing...');
// PiGpioTemp.initialize();
PiGpio.initialize();
process.on('SIGINT', () => {
    console.log('Received SIGINT.  Press Control-D to exit.');
    EntryGate.trigger(100, 0);
    PiGpio.terminate();
    Device.close();
    logger.info('Terminating...');
    console.log('Terminating ....');
});

const EntryLoop = new Gpio(5, {
    mode: Gpio.INPUT,
    //pullUpDown: Gpio.PUD_DOWN,
    edge: Gpio.EITHER_EDGE
});

const EntryGate = new Gpio(19, {
    mode: Gpio.OUTPUT,
    alert: true
});

const TicketButton = new Gpio(6, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_UP,
    edge: Gpio.RISING_EDGE,
});

const ExitLoop = new Gpio(13, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_UP,
    edge: Gpio.EITHER_EDGE
});

mongoose.connect('mongodb://192.168.1.100:27017/bayTrans_v004', { useMongoClient: true });
mongoose.Promise = global.Promise;
logger.log('Connecting to mongodb://192.168.1.100:27017/bayTrans_v004...');

const entryLoopActive = new LoopWatcher();
const exitLoopActive = new LoopWatcher();

let thisBarcode = undefined;
let thisIssuedAt = undefined;
let thisTicketIssued = false;
let thisIsTransiting = false;

console.log('Ticket Printer Module Acitve. Waiting for inputs....');
logger.info('Initialized. Waiting for interrupts');

//EntryLoop.on('interrupt',(level) => {
//console.log('entry',level)
//});
//ExitLoop.on('interrupt',(level) => {
//console.log('exit',level)
//});
//TicketButton.on('interrupt',(level) => {
//console.log('btn',level)
//});

// Init entry gate relay
EntryGate.trigger(100, 0);

EntryLoop.on('interrupt', _.debounce((level) => {
    if ( level === 0 )
        entryLoopActive.isActive = true;
    else if ( level === 1 )
        entryLoopActive.isActive = false;
    if ( thisTicketIssued && !entryLoopActive.isActive && exitLoopActive.isActive ) {
        console.log('Saving Ticket');
        logger.info('Saving Ticket');
        saveTicket();
        thisIsTransiting = true;
        thisTicketIssued = false;
    }
}, 100));

ExitLoop.on('interrupt', _.debounce((level) => {
    if ( level === 0 )
        exitLoopActive.isActive = true;
    else if ( level === 1 )
        exitLoopActive.isActive = false;

    if ( thisIsTransiting && !exitLoopActive.isActive ) {
        EntryGate.trigger(100, 1);
        thisIsTransiting = false;
    }
}, 100));

TicketButton.on('interrupt', _.debounce((level) => {
    if ( level === 1 && entryLoopActive.isActive && !thisTicketIssued )
        printTicket();
}, 1000));

function printTicket() {
    const ticketData = ticketPrinter.ticketData();
    thisBarcode = ticketData.barcode;
    thisIssuedAt = moment(ticketData.issuedAt, 'DDMMYYHHmmss');
    logger.info('Ticket Issue >>> ' + thisBarcode + thisIssuedAt);
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
            logger.info('Ticket saved >>> ' + result);
            thisBarcode = undefined;
            thisIssuedAt = undefined;
            thisTicketIssued = false;
        })
        .catch(err => {
            logger.error('Error saving ticket to DB ' + err);
            console.error(err)
        })
}