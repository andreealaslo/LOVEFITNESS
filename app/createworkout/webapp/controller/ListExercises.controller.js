sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/model/Sorter',
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Label",
	"sap/m/TextArea"
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageToast, Dialog, Button, Label, TextArea) {
	'use strict';

	return Controller.extend("createworkout.controller.ListExercises", {
		onInit() {
			this.oRouter = this.getOwnerComponent().getRouter();
			this._bDescendingSort = false;
		},

		onSearch(oEvent) {
			var oTableSearchState = [];
			var sQuery = oEvent.getParameter("newValue");

			if (sQuery && sQuery.length > 0) {
                oTableSearchState = [new Filter("NAME", FilterOperator.Contains, sQuery)];
			}
		
			this.getView().byId("exercisesTable").getBinding("items").filter(oTableSearchState, "Application");
		},

		onAdd: function () {
			var oModel = this.getView().getModel("catalogV2");
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sCreateMessage = oBundle.getText("createExerciseMessage");

			this.oCreateExerciseDialog = new Dialog({
				title: sCreateMessage,
				content: [
					new Label({
						text: "Name: "

					}),
					new TextArea({
						width: "100%"
					}),
					new Label({
						text: "Description: "

					}),
					new TextArea({
						width: "100%"
					})
				],
				contentWidth: "260px",
				contentHeight: "160px",
				resizable: true,
				draggable: true,
				beginButton: new Button({
					text: "SAVE",
					press: function (oEvent) {
						var oEntity = {
							NAME: oEvent.getSource().getParent().getContent()[1].getValue(),
							DESCRIPTION: oEvent.getSource().getParent().getContent()[3].getValue(),
						}
						oModel.create("/EXERCISES", oEntity, {
							success: function (oRetrievedResult) {
								var sAddMessage = oBundle.getText("addConfirmation", [oEntity.NAME]);
								sap.m.MessageBox.success(sAddMessage);
							},
							error: function (oError) {
					
								var oFormattedError = JSON.parse(oError.responseText).error;
								sap.m.MessageBox.error(oFormattedError.code + " - " + oFormattedError.message.value);
							}
						});
						this.oCreateExerciseDialog.destroy();
					}.bind(this)
				}),
				endButton: new Button({
					text: "Cancel",
					press: function () {
						this.oCreateExerciseDialog.destroy();
					}.bind(this)
				}),
			});

			this.oCreateExerciseDialog.addStyleClass("sapUiResponsivePadding--content sapUiResponsivePadding--header sapUiResponsivePadding--footer sapUiResponsivePadding--subHeader");
			this.getView().addDependent(this.oCreateExerciseDialog);
			this.oCreateExerciseDialog.open();
		},

		onSort() {
			this._bDescendingSort = !this._bDescendingSort;
			var oView = this.getView(),
				oTable = oView.byId("exercisesTable"),
				oBinding = oTable.getBinding("items"),
				aSorters = [];

			//aSorters.push(new Sorter("MUSCLE_ZONE", false, true));
			aSorters.push(new Sorter("NAME", this._bDescendingSort));

			oBinding.sort(aSorters);

		},

		onListItemPress: function (oEvent) {
			var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1),
				exercisePath = oEvent.getSource().getSelectedItem().getBindingContext("catalogV2").getPath(),
				exerciseToGo = exercisePath.split("/").slice(-1).pop();

			this.oRouter.navTo("detail", { layout: oNextUIState.layout, exercise: exerciseToGo });
		},

		onTableUpdateFinished: function (oEvent) {
			var oHeaderText = this.getView().byId("headerText");
			var sText = "EXERCISES (" + oEvent.getParameter("total") + ")";
			oHeaderText.setText(sText);
		}

	})

});