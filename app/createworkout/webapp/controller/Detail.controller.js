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

	return Controller.extend("createworkout.controller.Detail", {
		onInit: function () {
			var oExitButton = this.getView().byId("exitFullScreenBtn"),
				oEnterButton = this.getView().byId("enterFullScreenBtn");

			this.oRouter = this.getOwnerComponent().getRouter();
			this.oModel = this.getOwnerComponent().getModel("fclModel");

			this.oRouter.getRoute("detail").attachPatternMatched(this._onExerciseMatched, this);

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
			this.oRouter.navTo("detail", { layout: sNextLayout, exercise: this._exercise });
		},

		handleExitFullScreen: function () {
			this.bFocusFullScreenButton = true;
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
			this.oRouter.navTo("detail", { layout: sNextLayout, exercise: this._exercise });
		},

		handleClose: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
			this.oRouter.navTo("list", { layout: sNextLayout });
		},

		_onExerciseMatched: function (oEvent) {
			this._product = oEvent.getParameter("arguments").exercise || this._exercise || "0";
			this.getView().bindElement({
				path: "/" + this._product,
				parameters: { expand: 'FITNESS_MACHINE/FITNESS_MACHINE' },
				model: "catalogV2"
			});

		

		},

		onEditPress: function () {
			var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1);
			this.oRouter.navTo("edit", { layout: oNextUIState.layout, exercise: this._product });
		},

		onDeletePress: function () {
			var oModel = this.getView().getModel("catalogV2");
			var sService = "/" + this._product;

			var oData = oModel.getProperty(sService);
			var sName = oData.NAME;

			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			const sMessage = oBundle.getText("deleteConfirmation", [sName]);

			MessageBox.warning(sMessage, {
				actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
				styleClass: "sapUiSizeCompact",
				onClose: function (sAction) {
					if (sAction === MessageBox.Action.DELETE) {
						oModel.remove(sService, {
							success: function () {
								window.history.go(-1);
								const sDeleteMessage = oBundle.getText("deleteWithSuccess");
								MessageToast.show(sDeleteMessage, {
									duration: 6000
								});

							},
							error: function (oError) {
								const sErrorMessage = oBundle.getText("deleteWithError");
								MessageBox.error(sErrorMessage + oError.statusCode + " - " + oError.statusText);
								window.history.go(-1);
							}
						})
					}
				}
			});
		},


	});
});
