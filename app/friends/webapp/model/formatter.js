sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function(DateFormat) {
    "use strict";

    return {
        formatDate: function(date) {
            if (date) {
                var oDateFormat = DateFormat.getDateTimeInstance({pattern: "EEE MMM dd yyyy HH:mm:ss"});
                return oDateFormat.format(new Date(date));
            }
            return date;
        },

        formatDateWithoutHour: function(date) {
            if (date) {
                var oDateFormat = DateFormat.getDateTimeInstance({pattern: "MMM dd yyyy"});
                return oDateFormat.format(new Date(date));
            }
            return date;
        },

    };
});