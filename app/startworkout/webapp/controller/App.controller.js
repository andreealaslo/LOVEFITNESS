sap.ui.define([
	"startworkout/controller/BaseController",
	
], function (BaseController) {
	"use strict";

	return BaseController.extend("startworkout.controller.App", {
		onInit: function () {
			this.onGenerateWorkoutsModel();
			
		}
	});
}, true);
