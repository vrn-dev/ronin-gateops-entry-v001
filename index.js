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
const Flagger = require('./pi-utils/flagger');
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
    EntryGateOpen.digitalWrite(1);
    EntryGateClose.digitalWrite(1);
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

const EntryGateOpen = new Gpio(19, {
    mode: Gpio.OUTPUT,
    alert: true
});

const EntryGateClose = new Gpio(26, {
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
logger.info('Connecting to mongodb://192.168.1.100:27017/bayTrans_v004...');

const entryLoopActive = new LoopWatcher();
const exitLoopActive = new LoopWatcher();

let thisBarcode = undefined;
let thisIssuedAt = undefined;
const ticketIssued = new Flagger();
const transiting = new Flagger();
//let thisTicketIssued = false;
//let thisIsTransiting = false;

console.log('Ticket Printer Module Acitve. Waiting for inputs....');

// Init entry gate relay
EntryGateOpen.digitalWrite(1);
EntryGateClose.digitalWrite(1);
logger.info('Initialized. Waiting for interrupts');


EntryLoop.on('interrupt', _.debounce((level) => {
    if ( level === 0 )
        entryLoopActive.isActive = true;
    else if ( level === 1 )
        entryLoopActive.isActive = false;
    //if ( thisTicketIssued && !entryLoopActive.isActive && exitLoopActive.isActive ) {
    if ( ticketIssued.isTicketIssued && !entryLoopActive.isActive && exitLoopActive.isActive ) {
        console.log('Saving Ticket');
        logger.info('Saving Ticket');
        saveTicket();
        //thisIsTransiting = true;
        //thisTicketIssued = false;
        transiting.isTransiting(true);
        ticketIssued.isTicketIssued(false);
    }
}, 100));

ExitLoop.on('interrupt', _.debounce((level) => {
    if ( level === 0 )
        exitLoopActive.isActive = true;
    else if ( level === 1 )
        exitLoopActive.isActive = false;

    if ( transiting.isTransiting && !exitLoopActive.isActive ) {
        EntryGateClose.digitalWrite(0);
        setTimeout(() => EntryGateClose.digitalWrite(1), 100);
        logger.log('Gate Closed');
        //thisIsTransiting = false;
        transiting.isTransiting(false);
    }
}, 100));

TicketButton.on('interrupt', _.debounce((level) => {
    if ( level === 1 && entryLoopActive.isActive && !ticketIssued.isTicketIssued )
        printTicket();
}, 1000));

function printTicket() {
    const ticketData = ticketPrinter.ticketData();
    thisBarcode = ticketData.barcode;
    thisIssuedAt = moment(ticketData.issuedAt, 'DDMMYYHHmmss');
    logger.info('Ticket Issue >>> ' + thisBarcode + thisIssuedAt);
    console.log(thisBarcode);
    console.log(thisIssuedAt);
    EntryGateOpen.digitalWrite(0);
    setTimeout(() => EntryGateOpen.digitalWrite(1), 100);
    logger.info('Gate opened');
    // thisTicketIssued = true;
    ticketIssued.isTicketIssued(true);
}

function saveTicket() {
    const newTicket = new Ticket({
        _id: thisBarcode,
        issuedAt: thisIssuedAt
    });

    newTicket.save()
        .then(result => {
            console.log(result);
            if ( result )
                logger.info('Ticket saved >>> TicketID : ' + result._id);
            thisBarcode = undefined;
            thisIssuedAt = undefined;
            //thisTicketIssued = false;
            ticketIssued.isTicketIssued(false);
        })
        .catch(err => {
            logger.error('Error saving ticket to DB ' + err);
            console.error(err)
        })
}