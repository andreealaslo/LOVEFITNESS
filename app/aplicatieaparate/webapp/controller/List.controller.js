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
	"sap/m/TextArea",
	"sap/m/MessageBox",
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageToast, Dialog, Button, Label, TextArea, MessageBox) {
	'use strict';

	return Controller.extend("aplicatieaparate.controller.List", {
		onInit() {
			if (window.location.href.includes("applicationstudio")){
                this.loggedUser = "deea.laslo@yahoo.com";
            }else{
                this.loggedUser = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
            }
			this.oRouter = this.getOwnerComponent().getRouter();
			this._bDescendingSort = false;

			var oComboModel = new JSONModel({
				options: [
					{ key: "NAME", text: "Name" },
					{ key: "MUSCLE_ZONE", text: "Muscle Zone" }
				]
			});
			this.getView().setModel(oComboModel, "comboModel");
			this.getView().byId("searchField").setPlaceholder("Search...");
			this.checkForApprovedNotifications();
			this.checkForDeclinedNotifications();
		},

		onSearch(oEvent) {
			var sQuery = oEvent.getParameter("newValue")
			var sSelectedKey = this.getView().byId("comboBox").getSelectedKey();
			var oTableSearchState = [];

			if (sQuery && sQuery.length > 0) {
				if (sSelectedKey === "" || sSelectedKey === "NAME") {
					oTableSearchState = [new Filter("NAME", FilterOperator.Contains, sQuery)];
				} else if (sSelectedKey === "MUSCLE_ZONE") {
					oTableSearchState = [new Filter("MUSCLE_ZONE", FilterOperator.Contains, sQuery)];
				}
			}

			this.getView().byId("fitnessMachineTable").getBinding("items").filter(oTableSearchState, "Application");
		},

		checkForApprovedNotifications: function () {
			var oModel = this.getOwnerComponent().getModel("catalogV2");
			oModel.read("/FITNESS_MACHINES", {
				filters: [
					new Filter("CREATION_EMAIL", FilterOperator.EQ, this.loggedUser),
					new Filter("APPROVED", FilterOperator.EQ, "true"),
					new Filter("NOTIFIED", FilterOperator.EQ, false)
				],
				success: function (oData) {
					if (oData.results.length > 0) {
						oData.results.forEach(function (machine) {
							MessageBox.success("Your fitness machine '" + machine.NAME + "' has been approved by the admin :).", {
								title: "Notification",
								onClose: function () {
									oModel.update("/FITNESS_MACHINES(guid'" + machine.ID + "')", { NOTIFIED: true });
								}
							});
						});
					}
				},
				error: function (oError) {
					console.log("Error fetching notifications: ", oError);
				}
			});
		},

		checkForDeclinedNotifications: function () {
			var oModel = this.getOwnerComponent().getModel("catalogV2");
			oModel.read("/FITNESS_MACHINES", {
				filters: [
					new Filter("CREATION_EMAIL", FilterOperator.EQ, this.loggedUser),
					new Filter("APPROVED", FilterOperator.EQ, "false"),
					new Filter("NOTIFIED", FilterOperator.EQ, false)
				],
				success: function (oData) {
					if (oData.results.length > 0) {
						oData.results.forEach(function (machine) {
							MessageBox.error("Your fitness machine '" + machine.NAME + "' has been declined by the admin :(.", {
								title: "Notification",
								onClose: function () {
									oModel.update("/FITNESS_MACHINES(guid'" + machine.ID + "')", { NOTIFIED: true },
										{
											success: function () {
												oModel.remove("/FITNESS_MACHINES(guid'" + machine.ID + "')", {
													success: function () {
													},
													error: function (oError) {}
												})
											},
											error: function (oError) {
											}
										});
								}
							});
						});
					}
				},
				error: function (oError) {
					console.log("Error fetching notifications: ", oError);
				}
			});
		},


		onAdd: function () {
			var oModel = this.getView().getModel("catalogV2");
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sCreateMessage = oBundle.getText("addFitnessMachineCreation")

			this.oCreateFitnessMachineDialog = new Dialog({
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
					}),
					new Label({
						text: "Muscle zone: "

					}),
					new TextArea({
						width: "100%"
					})
				],
				contentWidth: "260px",
				contentHeight: "240px",
				resizable: true,
				draggable: true,
				beginButton: new Button({
					text: "SAVE",
					press: function (oEvent) {
						var oEntity = {
							NAME: oEvent.getSource().getParent().getContent()[1].getValue(),
							DESCRIPTION: oEvent.getSource().getParent().getContent()[3].getValue(),
							MUSCLE_ZONE: oEvent.getSource().getParent().getContent()[5].getValue(),
							APPROVED: "pending",
							CREATION_EMAIL: this.loggedUser,
							NOTIFIED: false
						}
						oModel.create("/FITNESS_MACHINES", oEntity, {
							success: function (oRetrievedResult) {
								console.log(oRetrievedResult);
								var sAddMessage = oBundle.getText("addConfirmation", [oEntity.NAME]);
								sap.m.MessageBox.success(sAddMessage);
							},
							error: function (oError) {
								var oFormattedError = JSON.parse(oError.responseText).error;
								sap.m.MessageBox.error(oFormattedError.code + " - " + oFormattedError.message.value);
							}
						});
						this.oCreateFitnessMachineDialog.destroy();
					}.bind(this)
				}),
				endButton: new Button({
					text: "Cancel",
					press: function () {
						this.oCreateFitnessMachineDialog.destroy();
					}.bind(this)
				}),
			});

			this.oCreateFitnessMachineDialog.addStyleClass("sapUiResponsivePadding--content sapUiResponsivePadding--header sapUiResponsivePadding--footer sapUiResponsivePadding--subHeader");
			this.getView().addDependent(this.oCreateFitnessMachineDialog);
			this.oCreateFitnessMachineDialog.open();
		},

		onSort(oEvent) {
			this._bDescendingSort = !this._bDescendingSort;
			var oView = this.getView(),
				oTable = oView.byId("fitnessMachineTable"),
				oBinding = oTable.getBinding("items"),
				aSorters = [];

			aSorters.push(new Sorter("MUSCLE_ZONE", false, true));
			aSorters.push(new Sorter("NAME", this._bDescendingSort));

			oBinding.sort(aSorters);

		},

		onListItemPress: function (oEvent) {
			var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1),
				productPath = oEvent.getSource().getSelectedItem().getBindingContext("catalogV2").getPath(),
				product = productPath.split("/").slice(-1).pop();

			this.oRouter.navTo("detail", { layout: oNextUIState.layout, fitnessMachine: product });
		},

		onTableUpdateFinished: function (oEvent) {
			var oHeaderText = this.getView().byId("headerText");
			var sText = "FITNESS MACHINES (" + oEvent.getParameter("total") + ")";
			oHeaderText.setText(sText);

		},

		onComboSelectionChange: function (oEvent) {
			var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
			var sPlaceholder = "";

			if (sSelectedKey === "NAME") {
				sPlaceholder = "Search by name...";
			} else if (sSelectedKey === "MUSCLE_ZONE") {
				sPlaceholder = "Search by muscle zone...";
			}

			this.getView().byId("searchField").setPlaceholder(sPlaceholder);
			this.onSearch();
		},

	})

});