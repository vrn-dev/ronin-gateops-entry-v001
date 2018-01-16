/**
 * Get EAN13 Checksum
 * @param code
 * @returns {number}
 */
exports.getEAN13CheckSum = function (code) {
    let sum = 0;
    let codeArr = code.toString(10).split('').map(Number);
    sum += codeArr[ 0 ];
    for ( let i = 1; i < codeArr.length; i++ ) {
        if ( (i + 1) % 2 === 0 ) sum += codeArr[ i ] * 3;
        else sum += codeArr[ i ];
    }
    return ((Math.ceil(sum / 10) * 10) - sum);
};