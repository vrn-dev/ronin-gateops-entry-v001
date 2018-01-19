const Flagger = function () {
    this._ticketIssued = false;
    this._isTransiting = false;
};

Flagger.prototype = {
    set isTicketIssued(flag) {
        this._ticketIssued = flag;
    },
    get isTicketIssued() {
        return this._ticketIssued;
    },
    set isTransiting(flag) {
        this._isTransiting = flag;
    },
    get isTransiting() {
        return this._isTransiting;
    }
};

module.exports = Flagger;