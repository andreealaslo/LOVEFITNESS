sap.ui.define([
    "statisticshistory/controller/BaseController",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController) {
        "use strict";

        return BaseController.extend("statisticshistory.controller.App", {
            onInit: function () {
                 this.onGenerateHistoryModel();
            }
        });
    });
