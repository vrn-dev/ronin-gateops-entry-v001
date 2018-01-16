'use strict';
const util = require('util');
const iconv = require('iconv-lite');
const Buffer = require('mutable-buffer');
const EventEmitter = require('events');
const checksum = require('./utils');
const c = require('./commands/customBiz-commands');

/**
 * Class POS Printer
 * @param adapter
 * @returns {Printer}
 * @constructor
 */
function Printer(adapter) {
    if ( !(this instanceof Printer) )
        return new Printer(adapter);

    EventEmitter.call(this);
    this.adapter = adapter;
    this.buffer = new Buffer();
    this.encoding = 'utf8';
    this._model = null;
}

/**
 * Printer extends EventEmitter
 */
util.inherits(Printer, EventEmitter);

Printer.prototype = {

    /**
     * Print and Line Feed
     * @param {string} content
     * @returns {Printer}
     */
    println(content) {
        this.buffer.write(iconv.encode(content, this.encoding) + c.LF);
        return this;
    },

    /**
     * Line Feed
     * @param {string} count
     * @returns {Printer}
     */
    feed(count) {
        count = count || 1;
        for ( let i = 0; i < count; i++ )
            this.buffer.write(c.LF)
        return this;
    },

    /**
     * Set Text Size
     * @param {string} size [ NORMAL, DOUBLE ]
     * @returns {Printer}
     */
    setTextSize(size) {
        size = size.toUpperCase() || 'NORMAL';

        if ( size === 'NORMAL' )
            this.buffer.write(c.TEXT.SIZE.NORMAL);
        else if ( size === 'DOUBLE' )
            this.buffer.write(c.TEXT.SIZE.DOUBLE);

        return this;
    },

    /**
     * Set Text Underline
     * @param {string} state [ ON, OFF, DOUBLE ]
     * @returns {Printer}
     */
    setTextUnderline(state) {
        state = state.toUpperCase() || 'OFF';

        if ( state === 'ON' )
            this.buffer.write(c.TEXT.UNDERLINE.ON);
        else if ( state === 'DOUBLE' )
            this.buffer.write(c.TEXT.UNDERLINE.DOUBLE);
        else if ( state === 'OFF' )
            this.buffer.write(c.TEXT.UNDERLINE.OFF);

        return this;
    },

    /**
     * Set Text Bold
     * @param {string} state [ ON, OFF ]
     * @returns {Printer}
     */
    setTextBold(state) {
        state = state.toUpperCase() || 'OFF';

        if ( state === 'ON' )
            this.buffer.write(c.TEXT.BOLD.ON);
        else if ( state === 'OFF' )
            this.buffer.write(c.TEXT.BOLD.OFF);

        return this;
    },

    /**
     * Set Text Italic
     * @param {string} state [ ON, OFF ]
     * @returns {Printer}
     */
    setTextItalic(state) {
        state = state.toUpperCase() || 'OFF';

        if ( state === 'ON' )
            this.buffer.write(c.TEXT.ITALIC.ON);
        else if ( state === 'OFF' )
            this.buffer.write(c.TEXT.ITALIC.OFF);

        return this;
    },

    /**
     * Set Text Font
     * @param {string} type [ A, B ]
     * @returns {Printer}
     */
    setTextFont(type) {
        type = type.toUpperCase() || 'A';

        if ( type === 'A' )
            this.buffer.write(c.TEXT.FONT.A);
        else if ( type === 'B' )
            this.buffer.write(c.TEXT.FONT.B);

        return this;
    },

    /**
     * Set Text Alignment
     * @param {string} state [ LEFT, CENTER, RIGHT ]
     * @returns {Printer}
     */
    setTextAlignment(state) {
        state = state.toUpperCase() || 'CENTER';

        if ( state === 'LEFT' )
            this.buffer.write(c.TEXT.ALIGN.LEFT);
        else if ( state === 'CENTER' )
            this.buffer.write(c.TEXT.ALIGN.CENTER);
        else if ( state === 'RIGHT' )
            this.buffer.write(c.TEXT.ALIGN.RIGHT);

        return this;
    },

    /**
     * Cut Paper
     * @param {string} type [ FULL, PARTIAL ]
     * @returns {Printer}
     */
    cut(type) {
        type = type.toUpperCase() || 'FULL';

        if ( type === 'FULL' )
            this.buffer.write(c.CUT.FULL);
        else if ( type === 'PARTIAL' )
            this.buffer.write(c.CUT.PARTIAL);

        return this;
    },

    /**
     * Set Barcode
     * @param {string} code
     * @returns {Printer}
     */
    setBarcode(code) {
        if ( code.length > 12 )
            throw new Error('EAN13 cannot be more than 12 digits');

        const csum = checksum.getEAN13CheckSum(code);
        const barcode = iconv.encode(code + csum, this.encoding);

        this.buffer.write(c.BARCODE.DIMS.WIDTH);
        this.buffer.write(c.BARCODE.DIMS.HEIGHT);
        this.buffer.write(c.BARCODE.FONT.A);
        this.buffer.write(c.BARCODE.HRI.BELOW);
        this.buffer.write(c.BARCODE.TYPE.EAN13);
        this.buffer.write(barcode);
        this.buffer.write(c.BARCODE.DATA_END);

        return this;
    },

    /**
     * INIT Printer
     * @returns {*}
     */
    hwInit() {
        this.buffer.write(c.INIT);
        return this.flush();
    },

    /**
     * Flush Buffer
     * @param callback
     * @returns {Printer}
     */
    flush(callback) {
        const buf = this.Buffer.flush();
        this.adapter.write(buf, callback);
        return this;
    },

    /**
     * Close printer
     * @param callback
     */
    close(callback) {
        const self = this;
        this.flush(() => {
            self.adapter.close();
        })
    }
};

module.exports = Printer;


