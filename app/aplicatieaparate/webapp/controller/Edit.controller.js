sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Label",
	"sap/m/TextArea",
	
], function (JSONModel, Controller, MessageBox, MessageToast, Dialog, Button, Label, TextArea,Filter,FilterOperator) {
	"use strict";

	return Controller.extend("aplicatieaparate.controller.Edit", {
		onInit: function () {
			if (window.location.href.includes("applicationstudio")){
                this.loggedUser = "deea.laslo@yahoo.com";
            }else{
                this.loggedUser = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
            }
			var oExitButton = this.getView().byId("exitFullScreenBtnEdit"),
				oEnterButton = this.getView().byId("enterFullScreenBtnEdit");

			this.oRouter = this.getOwnerComponent().getRouter();
			this.oModel = this.getOwnerComponent().getModel();

			this.oRouter.getRoute("edit").attachPatternMatched(this._onFitnessMachineEditMatched, this);
			

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

			var oTable = this.getView().byId("tipsAndTricksTableEdit");
            oTable.attachSelectionChange(this.onSelectionChange, this);
			var oMinusButton = this.getView().byId("minusButton");
			oMinusButton.setVisible(false);
			
		},

	
		handleFullScreen: function () {
			this.bFocusFullScreenButton = true;
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.oRouter.navTo("edit", {layout: sNextLayout, fitnessMachine: this._fitnessMachine});
		},
		handleExitFullScreen: function () {
			this.bFocusFullScreenButton = true;
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
			this.oRouter.navTo("edit", {layout: sNextLayout, fitnessMachine: this._fitnessMachine});
		},
		handleClose: function () {
            window.history.go(-1);
		},
		_onFitnessMachineEditMatched: function (oEvent) {
			this._product = oEvent.getParameter("arguments").fitnessMachine || this._fitnessMachine || "0";
			this.getView().bindElement({
				path: "/" + this._product,
				parameters: {expand: 'TIPS_AND_TRICKS'},
				model: "catalogV2"
			});

			
		},

		onSavePress: function(oEvent){
			var oModel = this.getView().getModel("catalogV2");
			var sService = "/" + this._product;
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sNameValue = this.getView().byId("nameEditInput").getValue();
			var sDescriptionValue = this.getView().byId("descriptionEditInput").getValue();
			var sMuscleZoneValue = this.getView().byId("muscleZoneValueInput").getValue();

			var oEntity = {
				NAME: sNameValue,
				DESCRIPTION: sDescriptionValue,
				MUSCLE_ZONE: sMuscleZoneValue
			}
			
			oModel.update(sService, oEntity, {
				success: function (oRetrievedResult) {
					console.log(oRetrievedResult);
					var sEditMessage = oBundle.getText("editWithSuccess");
					sap.m.MessageToast.show(sEditMessage);
					window.history.go(-1);
				},
				error: function (oError) {
					console.log(oError);
					MessageBox.error(oError.statusCode + " - " + oError.statusText);
				}
			});
			
		},
		onTipsAndTricksAdd: function(){
			var oModel = this.getView().getModel("catalogV2");
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sCreateMessage = oBundle.getText("addTipAndTrickCreation");
			var sService = "/" + this._product;
			var oData = oModel.getProperty(sService);
			var sFitnessMachineID = oData.ID;

			this.oCreateTipTrickDialog = new Dialog({
				title: sCreateMessage,
				content: [
					new Label({
						text: "Description: "

					}),
					new TextArea({
						width: "100%"
					})
				],
				contentWidth: "200px",
				contentHeight: "100px",
				resizable: true,
				draggable: true,
				beginButton: new Button({
					text: "SAVE",
					press: function (oEvent) {
						
						var oEntity = {
							FITNESS_MACHINE_ID: sFitnessMachineID,
							DESCRIPTION: oEvent.getSource().getParent().getContent()[1].getValue(),
							APPROVED: "pending",
                            CREATION_EMAIL: this.loggedUser,
                            NOTIFIED: false
						}
						oModel.create("/FITNESS_MACHINE_TIPS_AND_TRICKS", oEntity, {
							success: function (oRetrievedResult) {
								var sAddMessage = oBundle.getText("addTipAndTrickWithSuccess");
								MessageToast.show(sAddMessage);
							},
							error: function (oError) {
								var oFormattedError = JSON.parse(oError.responseText).error;
								sap.m.MessageBox.error(oFormattedError.code + " - " + oFormattedError.message.value);
							
							}
						});
						this.oCreateTipTrickDialog.destroy();
					}.bind(this)
				}),
				endButton: new Button({
					text: "Cancel",
					press: function () {
						this.oCreateTipTrickDialog.destroy();
					}.bind(this)
				}),
			});

			this.oCreateTipTrickDialog.addStyleClass("sapUiResponsivePadding--content sapUiResponsivePadding--header sapUiResponsivePadding--footer sapUiResponsivePadding--subHeader");
			this.getView().addDependent(this.oCreateTipTrickDialog);
			this.oCreateTipTrickDialog.open();
		},

		onSelectionChange: function(oEvent) {
			var oTable = oEvent.getSource();
			var aSelectedItems = oTable.getSelectedItems();
			var oMinusButton = this.getView().byId("minusButton");
		
			if (aSelectedItems.length > 0) {
				oMinusButton.setVisible(true);
			} else {
				oMinusButton.setVisible(false);
			}
		},

		onTipsAndTricksDelete: function(oEvent){
			var oTable = this.getView().byId("tipsAndTricksTableEdit");
			var aSelectedItems = oTable.getSelectedItems();
			var oModel = this.getView().getModel("catalogV2");
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sConfirmationMessage="";
			
			if (aSelectedItems.length > 1) {
				sConfirmationMessage = oBundle.getText("deleteConfirmationTipsAndTricks");
			} else {
				sConfirmationMessage = oBundle.getText("deleteConfirmationTipAndTrick");
			}

			MessageBox.warning(sConfirmationMessage, {
				actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
				styleClass: "sapUiSizeCompact",
				onClose: function (sAction) {
					if (sAction === MessageBox.Action.DELETE) {
						for (var i = 0; i < aSelectedItems.length; i++) {
							var oItem = aSelectedItems[i];
							var oContext = oItem.getBindingContext("catalogV2");
							var sPath = oContext.getPath();
							oModel.remove(sPath, {
								success: function () {
									const sDeleteMessage = oBundle.getText("deleteTipsAndTricksWithSuccess");
									MessageToast.show(sDeleteMessage);
								},
								error: function (oError) {
									const sErrorMessage = oBundle.getText("deleteTipsAndTricksWithError");
									MessageBox.error(sErrorMessage + oError.statusCode + " - " + oError.statusText);
								}
							})
						}
					}
				}
			});
			var oMinusButton = this.getView().byId("minusButton");
			oMinusButton.setVisible(false);

			
		}
	});
});
