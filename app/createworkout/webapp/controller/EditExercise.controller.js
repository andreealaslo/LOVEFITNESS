sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Label",
	"sap/m/TextArea"
], function (JSONModel, Controller, MessageBox, MessageToast, Dialog, Button, Label, TextArea) {
	"use strict";

	return Controller.extend("createworkout.controller.EditExercise", {
		onInit: function () {
			var oExitButton = this.getView().byId("exitFullScreenBtnEdit"),
				oEnterButton = this.getView().byId("enterFullScreenBtnEdit");

			this.oRouter = this.getOwnerComponent().getRouter();
			this.oModel = this.getOwnerComponent().getModel("fclModel");

			this.oRouter.getRoute("edit").attachPatternMatched(this._onExerciseEditMatched, this);

			[oExitButton, oEnterButton].forEach(function (oButton) {
				oButton.addEventDelegate({
					onAfterRendering: function () {
						if (this.bFocusFullScreenButton) {
							this.bFocusFullScreenButton = false;
							oButton.focus();
						}
					}.bind(this)
				});
			}, this);
		},

	
		handleFullScreen: function () {
			this.bFocusFullScreenButton = true;
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.oRouter.navTo("edit", {layout: sNextLayout, exercise: this._exercise});
		},
		handleExitFullScreen: function () {
			this.bFocusFullScreenButton = true;
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
			this.oRouter.navTo("edit", {layout: sNextLayout, exercise: this._exercise});
		},
		handleClose: function () {
            window.history.go(-1);
		},
		_onExerciseEditMatched: function (oEvent) {
			this._product = oEvent.getParameter("arguments").exercise || this._exercise || "0";
			this.getView().bindElement({
				path: "/" + this._product,
				parameters: {expand: ''},
				model: "catalogV2"
			});
		},

		onSavePress: function(oEvent){
			var oModel = this.getView().getModel("catalogV2");
			var sService = "/" + this._product;
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sNameValue = this.getView().byId("nameEditInput").getValue();
			var sDescriptionValue = this.getView().byId("descriptionEditInput").getValue();
			
			var oEntity = {
				NAME: sNameValue,
				DESCRIPTION: sDescriptionValue,
				
			}
			oModel.update(sService, oEntity, {
				success: function (oRetrievedResult) {
					var sEditMessage = oBundle.getText("editWithSuccess");
					sap.m.MessageToast.show(sEditMessage);
					window.history.go(-1);
				},
				error: function (oError) {
					
					MessageBox.error(oError.statusCode + " - " + oError.statusText);
				}
			});
			
		}
	});
});
