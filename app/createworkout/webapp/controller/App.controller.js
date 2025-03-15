sap.ui.define([
	"createworkout/controller/BaseController",
	
], function (BaseController) {
	"use strict";

	return BaseController.extend("createworkout.controller.App", {
		onInit: function () {
			this.onGenerateWorkoutsModel();
			this.onGenerateInspirationalWorkoutsModel();
		}
	});
}, true);
