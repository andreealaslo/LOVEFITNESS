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
                var oDateFormat = DateFormat.getDateTimeInstance({pattern: "EEE MMM dd yyyy"});
                return oDateFormat.format(new Date(date));
            }
            return date;
        },

        statusTextClass: function(status) {
            if (status === "Stopped") {
                return "Error"; 
            } else if (status === "Done") {
                return "Success"; 
            }
            return "None";
        }

    };
});