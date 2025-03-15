sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
],
function (Controller, MessageBox, MessageToast, Dialog, Button, Label) {
    "use strict";

    return Controller.extend("admin.controller.Create", {
        onInit: function () {
        },

        onSaveFitnessMachine: function(){
            var oView = this.getView();
            var oModel = this.getView().getModel("catalogV2");
            var sFMName = oView.byId("nameFMInput").getValue();
            var sFMDescription = oView.byId("descriptionFMInput").getValue();
            var sFMMuscleZone = oView.byId("muscleZoneFMInput").getValue();

            if (!sFMName || !sFMDescription || !sFMMuscleZone) {
                if (!sFMName) {
                    MessageToast.show("Name of the fitness machine is required!");
                    return;
                }
                if (!sFMDescription) {
                    MessageToast.show("Description of the fitness machine is required!");
                    return;
                }
                if (!sFMMuscleZone) {
                    MessageToast.show("Muscle zone of the fitness machine is required!");
                    return;
                }
                return;
            }

            MessageBox.warning("Are you sure you want to save the fitness machine?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                styleClass: "sapUiSizeCompact",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oEntity = {
                            NAME: sFMName,
                            DESCRIPTION:sFMDescription,
                            MUSCLE_ZONE: sFMMuscleZone,
                            APPROVED: "true",
                            CREATION_EMAIL: "admin"
                        }
                        oModel.create("/FITNESS_MACHINES", oEntity, {
                            success: function () {
                                MessageToast.show("Fitness machine successfully saved!");
                            },
                            error: function () {
                                MessageToast.show("Error saving the fitness machine!");
                            }
                        });

                    }
                        
            }});

            oView.byId("nameFMInput").setValue("");
            oView.byId("descriptionFMInput").setValue("");
            oView.byId("muscleZoneFMInput").setValue("");

        },

        onSaveTipsTricks: function(){
            var oView = this.getView();
            var oModel = this.getView().getModel("catalogV2");
            var sFMID = oView.byId("FMInput").getSelectedKey();
            var sTTDescription = oView.byId("descriptionTTInput").getValue();
            

            if (!sFMID || !sTTDescription) {
                if (!sFMID) {
                    MessageToast.show("Name of the fitness machine is required!");
                    return;
                }
                if (!sTTDescription) {
                    MessageToast.show("Description of the tip is required!");
                    return;
                }
                
                return;
            }

            MessageBox.warning("Are you sure you want to save the tip?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                styleClass: "sapUiSizeCompact",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oEntity = {
                            FITNESS_MACHINE_ID: sFMID,
                            DESCRIPTION:sTTDescription,
                            APPROVED: "true",
                            CREATION_EMAIL: "admin"
                        }
                        oModel.create("/FITNESS_MACHINE_TIPS_AND_TRICKS", oEntity, {
                            success: function () {
                                MessageToast.show("Tip successfully saved!");
                            },
                            error: function () {
                                MessageToast.show("Error saving the tip!");
                            }
                        });

                    }
                        
            }});

            oView.byId("FMInput").setSelectedKey("");
            oView.byId("descriptionTTInput").setValue("");
        
        },
        onSaveExercise: function(){
            var oView = this.getView();
            var oModel = this.getView().getModel("catalogV2");
            var sEName = oView.byId("nameEInput").getValue();
            var sEDescription = oView.byId("descriptionEInput").getValue();
            var sEMGID = oView.byId("EMGInput").getSelectedKey();

            if (!sEName || !sEDescription || !sEMGID) {
                if (!sEName) {
                    MessageToast.show("Name of the exercise is required!");
                    return;
                }
                if (!sEDescription) {
                    MessageToast.show("Description of the exercise is required!");
                    return;
                }
                if (!sEMGID) {
                    MessageToast.show("Muscle group of the exercise is required!");
                    return;
                }
                return;
            }

            MessageBox.warning("Are you sure you want to save the exercise?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                styleClass: "sapUiSizeCompact",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oEntity = {
                            NAME: sEName,
                            MUSCLE_GROUP_ID:sEMGID,
                            DESCRIPTION: sEDescription
                        }
                        oModel.create("/EXERCISES", oEntity, {
                            success: function () {
                                MessageToast.show("Exercise successfully saved!");
                            },
                            error: function () {
                                MessageToast.show("Error saving the exercise!");
                            }
                        });

                    }
                        
            }});

            oView.byId("EMGInput").setSelectedKey("");
            oView.byId("nameEInput").setValue("");
            oView.byId("descriptionEInput").setValue("");
        },
        onSaveChallenge: function(){
            var oView = this.getView();
            var oModel = this.getView().getModel("catalogV2");
            var sCDescription = oView.byId("descriptionCInput").getValue();
            

            if (!sCDescription) { 
                MessageToast.show("Description of the challenge is required!");
                return;
            }

            MessageBox.warning("Are you sure you want to save the challenge?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                styleClass: "sapUiSizeCompact",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oEntity = {
                            DESCRIPTION:sCDescription,
                        }
                        oModel.create("/CHALLENGES", oEntity, {
                            success: function () {
                                MessageToast.show("Challenge successfully saved!");
                            },
                            error: function () {
                                MessageToast.show("Error saving the challenge!");
                            }
                        });

                    }
                        
            }});

            oView.byId("descriptionCInput").setValue("");
        },
    });
});
