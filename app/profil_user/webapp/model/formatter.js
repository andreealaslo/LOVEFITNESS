sap.ui.define([
    "sap/ui/core/format/DateFormat"
  ], function (DateFormat) {
    "use strict";
  
    return {
        formatDate: function(sDate) {
            if (!sDate) {
                return "";
            }
            
            var oDate = new Date(sDate);
            var sFormattedDate = oDate.toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "2-digit"
            });

            return sFormattedDate;
        }
    };
  });
  