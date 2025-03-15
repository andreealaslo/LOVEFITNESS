sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
function (Controller) {
    "use strict";

    return Controller.extend("admin.controller.StartPage", {
        onNavToCreateEntities: function(){
			this.getRouter().navTo("create");
        },

        onNavToAcceptEntities: function(){
			this.getRouter().navTo("accept");
        },

		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		}
    });
});
