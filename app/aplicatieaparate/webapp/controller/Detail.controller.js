sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
], function (JSONModel, Controller, MessageBox, MessageToast,Filter,FilterOperator) {
	"use strict";

	return Controller.extend("aplicatieaparate.controller.Detail", {
		onInit: function () {
			if (window.location.href.includes("applicationstudio")){
                this.loggedUser = "deea.laslo@yahoo.com";
            }else{
                this.loggedUser = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
            }
			var oExitButton = this.getView().byId("exitFullScreenBtn"),
				oEnterButton = this.getView().byId("enterFullScreenBtn");

			this.oRouter = this.getOwnerComponent().getRouter();
			this.oModel = this.getOwnerComponent().getModel();

			this.oRouter.getRoute("detail").attachPatternMatched(this._onFitnessMachineMatched, this);

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
			this.oRouter.navTo("detail", { layout: sNextLayout, fitnessMachine: this._fitnessMachine });
		},

		handleExitFullScreen: function () {
			this.bFocusFullScreenButton = true;
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
			this.oRouter.navTo("detail", { layout: sNextLayout, fitnessMachine: this._fitnessMachine });
		},

		handleClose: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
			this.oRouter.navTo("list", { layout: sNextLayout });
		},

		_onFitnessMachineMatched: function (oEvent) {
			this._product = oEvent.getParameter("arguments").fitnessMachine || this._fitnessMachine || "0";
			this.getView().bindElement({
				path: "/" + this._product,
				parameters: { expand: 'TIPS_AND_TRICKS,EXERCISES/EXERCISE' },
				model: "catalogV2"
			});

			this.checkForApprovedNotifications();
            this.checkForDeclinedNotifications();
		},

		onEditPress: function () {
			var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1);

			this.oRouter.navTo("edit", { layout: oNextUIState.layout, fitnessMachine: this._product });
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

		checkForApprovedNotifications: function () {
            var oModel = this.getView().getModel("catalogV2");
            var that = this;

            var sService = "/" + this._product;
            var oData = oModel.getProperty(sService);
            var sFitnessMachineID = oData.ID;



            oModel.read("/FITNESS_MACHINE_TIPS_AND_TRICKS", {
                filters: [
                    new Filter("CREATION_EMAIL", FilterOperator.EQ, this.loggedUser),
                    new Filter("FITNESS_MACHINE_ID", FilterOperator.EQ, sFitnessMachineID),
                    new Filter("APPROVED", FilterOperator.EQ, "true"),
                    new Filter("NOTIFIED", FilterOperator.EQ, false)
                ],
                success: function (oData) {
                    if (oData.results.length > 0) {
                        oData.results.forEach(function (tip) {
							console.log("tip");
                            MessageBox.success("Your tip and trick has been approved by the admin :)", {
                                title: "Notification",
                                onClose: function () {
                                    oModel.update("/FITNESS_MACHINE_TIPS_AND_TRICKS(guid'" + tip.ID + "')", { NOTIFIED: true });
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
            var oModel = this.getView().getModel("catalogV2");
            var that = this;

            var sService = "/" + this._product;
            var oData = oModel.getProperty(sService);
            var sFitnessMachineID = oData.ID;

            oModel.read("/FITNESS_MACHINE_TIPS_AND_TRICKS", {
                filters: [
                    new Filter("CREATION_EMAIL", FilterOperator.EQ, this.loggedUser),
                    new Filter("FITNESS_MACHINE_ID", FilterOperator.EQ, sFitnessMachineID),
                    new Filter("APPROVED", FilterOperator.EQ, "false"),
                    new Filter("NOTIFIED", FilterOperator.EQ, false)
                ],
                success: function (oData) {
                    if (oData.results.length > 0) {
                        oData.results.forEach(function (tip) {
                            MessageBox.error("Your tip and trick has been declined by the admin :(", {
                                title: "Notification",
                                onClose: function () {
                                    oModel.update("/FITNESS_MACHINE_TIPS_AND_TRICKS(guid'" + tip.ID + "')", { NOTIFIED: true },
									{
										success: function () {
											oModel.remove("/FITNESS_MACHINE_TIPS_AND_TRICKS(guid'" + tip.ID + "')", {
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
        }

		
	});
});
