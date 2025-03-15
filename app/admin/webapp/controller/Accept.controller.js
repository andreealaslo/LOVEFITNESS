sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
],
    function (Controller, Dialog, Button, Label, Text, VBox, HBox,MessageBox,MessageToast) {
        "use strict";

        return Controller.extend("admin.controller.Accept", {
            onInit: function () {

            },

            onDetailsFM: function (oEvent) {
                var oContext = oEvent.getSource().getBindingContext("catalogV2");
                var sName = oContext.getProperty("NAME");
                var sDescription = oContext.getProperty("DESCRIPTION");
                var sMuscleZone = oContext.getProperty("MUSCLE_ZONE");
                var sUser=oContext.getProperty("CREATION_EMAIL");

                var oDialog = new Dialog({
                    title: "Fitness Machine Details",
                    contentWidth: "350px",
                    contentHeight: "auto",
                    resizable: true,
                    draggable: true,
                    content: new VBox({
                        items: [
                            new HBox({
                                items: [new Label({ text: "Name:" }),
                                new Text({ text: sName })]
                            }),
                            new HBox({
                                items: [new Label({ text: "Description:" }),
                                new Text({ text: sDescription })]
                            }),
                            new HBox({
                                items: [new Label({ text: "Muscle Zone:" }),
                                new Text({ text: sMuscleZone })]
                            }),
                            new HBox({
                                items: [new Label({ text: "Created by:" }),
                                new Text({ text: sUser })]
                            }),
                        ]
                    }),
                    beginButton: new Button({
                        text: "Close",
                        press: function () {
                            oDialog.close();
                        }
                    })
                });
                oDialog.addStyleClass("sapUiResponsivePadding--content sapUiResponsivePadding--header sapUiResponsivePadding--footer sapUiResponsivePadding--subHeader");
                oDialog.open();
            },

            onAcceptFM: function (oEvent) {
                var oContext = oEvent.getSource().getBindingContext("catalogV2");
                var sPath = oContext.getPath();
                var oModel = oContext.getModel();

                var oEntity = { APPROVED: "true" };

                MessageBox.warning("Are you sure you want to accept the fitness machine?", {
                    actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                    styleClass: "sapUiSizeCompact",
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.YES) {
                            oModel.update(sPath, oEntity, {
                                success: function () {
                                    MessageToast.show("The fitness machine has been approved successfully.");
                                },
                                error: function (oError) {
                                    MessageBox.error("Error approving the fitness machine: " + oError.message);
                                }
                            });
    
                        }
                            
                }});
            },

            onDeclineFM: function(oEvent){
                var oContext = oEvent.getSource().getBindingContext("catalogV2");
                var sPath = oContext.getPath();
                var oModel = oContext.getModel();

                var oEntity = { APPROVED: "false" };

                MessageBox.warning("Are you sure you want to decline the fitness machine?", {
                    actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                    styleClass: "sapUiSizeCompact",
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.YES) {
                            oModel.update(sPath, oEntity, {
                                success: function () {
                                    MessageToast.show("The fitness machine has been declined.");
                                },
                                error: function (oError) {
                                    MessageBox.error("Error approving the fitness machine: " + oError.message);
                                }
                            });
    
                        }
                            
                }});
            },

            onDetailsTT: function (oEvent) {
                var oContext = oEvent.getSource().getBindingContext("catalogV2");
                var sFitnessMachineID = oContext.getProperty("FITNESS_MACHINE_ID");
                var sDescription = oContext.getProperty("DESCRIPTION");
                var sUser = oContext.getProperty("CREATION_EMAIL");
                var oModel = this.getView().getModel("catalogV2");
    
                
                oModel.read("/FITNESS_MACHINES(guid'" + sFitnessMachineID + "')", {
                    success: function (oData) {
                        var sName = oData.NAME;
    
                        var oDialog = new Dialog({
                            title: "Tip and Trick Details",
                            contentWidth: "350px",
                            contentHeight: "auto",
                            resizable: true,
                            draggable: true,
                            content: new VBox({
                                items: [
                                    new HBox({
                                        items: [new Label({ text: "Fitness Machine Name:" }), new Text({ text: sName })]
                                    }),
                                    new HBox({
                                        items: [new Label({ text: "Description:" }), new Text({ text: sDescription })]
                                    }),
                                    new HBox({
                                        items: [new Label({ text: "Created by:" }), new Text({ text: sUser })]
                                    }),
                                ]
                            }),
                            beginButton: new Button({
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            })
                        });
                        oDialog.addStyleClass("sapUiResponsivePadding--content sapUiResponsivePadding--header sapUiResponsivePadding--footer sapUiResponsivePadding--subHeader");
                        oDialog.open();
                    },
                    error: function (oError) {
                        MessageBox.error("Error fetching the fitness machine details: " + oError.message);
                    }
                });
            },

            onAcceptTT: function (oEvent) {
                var oContext = oEvent.getSource().getBindingContext("catalogV2");
                var sPath = oContext.getPath();
                var oModel = oContext.getModel();

                var oEntity = { APPROVED: "true" };

                MessageBox.warning("Are you sure you want to accept the tip?", {
                    actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                    styleClass: "sapUiSizeCompact",
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.YES) {
                            oModel.update(sPath, oEntity, {
                                success: function () {
                                    MessageToast.show("The tip has been approved successfully.");
                                },
                                error: function (oError) {
                                    MessageBox.error("Error approving the tip: " + oError.message);
                                }
                            });
    
                        }
                            
                }});
            },

            onDeclineTT: function(oEvent){
                var oContext = oEvent.getSource().getBindingContext("catalogV2");
                var sPath = oContext.getPath();
                var oModel = oContext.getModel();

                var oEntity = { APPROVED: "false" };

                MessageBox.warning("Are you sure you want to decline the tip?", {
                    actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                    styleClass: "sapUiSizeCompact",
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.YES) {
                            oModel.update(sPath, oEntity, {
                                success: function () {
                                    MessageToast.show("The tip has been declined.");
                                },
                                error: function (oError) {
                                    MessageBox.error("Error approving the tip: " + oError.message);
                                }
                            });
    
                        }
                            
                }});
            }


        });
    });
