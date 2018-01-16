module.exports = {
    INIT: '\x1b\x40',
    LF: '\x0a',
    LS: '\x1b\x32',
    CUT: {
        FULL: '\x1b\x69',
        PARTIAL: '\x1b\x6d '
    },
    TEXT: {
        SIZE: {
            NORMAL: '\x1d\x21\x00',
            DOUBLE: '\x1d\x21\x01\x1b\x21\x10'
        },
        UNDERLINE: {
            ON: '\x1b\x2d\x01',
            DOUBLE: '\x1b\x2d\x02',
            OFF: '\x1b\x2d\x00'
        },
        BOLD: {
            ON: '\x1b\x45\x01',
            OFF: '\x1b\x45\x00'
        },
        ITALIC: {
            ON: '\x1b\x34\x01',
            OFF: '\x1b\x34\x00'
        },
        FONT: {
            A: '\x1b\x21\x00',
            B: '\x1b\x21\x01'
        },
        ALIGN: {
            LEFT: '\x1b\x61\x00',
            CENTER: '\x1b\x61\x01',
            RIGHT: '\x1b\x61\x02'
        }
    },
    BARCODE: {
        HRI: {
            OFF: '\x1d\x48\x00',
            ABOVE: '\x1d\x48\x01',
            BELOW: '\x1d\x48\x02',
            BOTH: '\x1d\x48\x03'
        },
        DIMS: {
            HEIGHT: '\x1d\x68\xa2',
            WIDTH: '\x1d\x77\x03'
        },
        TYPE: {
            UPC_A: '\x1d\x6b\x00',
            UPC_E: '\x1d\x6b\x01',
            EAN13: '\x1d\x6b\x02',
            EAN8: '\x1d\x6b\x03',
            CODE39: '\x1d\x6b\x69',
            ITF: '\x1d\x6b\x05',
            CODEABAR: '\x1d\x6b\x06',
            CODE32: '\x1d\x6b\x07',
            CODE93: '\x1d\x6b\x08',
            CODE128: '\x1d\x6b\x14'
        },
        FONT: {
            A: '\x1d\x66\x00',
            B: '\x1d\x66\x01'
        },
        DATA_END: '\x00'
    }
};