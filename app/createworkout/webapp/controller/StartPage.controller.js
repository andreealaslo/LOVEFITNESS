sap.ui.define([
	"createworkout/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/format/NumberFormat",
	"sap/base/strings/formatMessage"
], function (BaseController, JSONModel, NumberFormat, formatMessage) {
	"use strict";

	return BaseController.extend("createworkout.controller.StartPage", {
		
        onNavToCreateWorkout: function(){
			this.getRouter().navTo("create");
        },

		onNavToMyWorkouts: function () {
			this.getRouter().navTo("manage");
		},

        onNavToInspirationalWorkouts: function(){
			this.getRouter().navTo("inspirational");
        },

        onNavToExercises: function(){
			this.getRouter().navTo("flexible");
        },

		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		}
	});
});
