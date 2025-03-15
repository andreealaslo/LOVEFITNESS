sap.ui.define([
    "createworkout/controller/BaseController",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
], function (BaseController, MessageBox, MessageToast, Dialog, Button, Label) {
    "use strict";

    return BaseController.extend("createworkout.controller.CreateWorkout", {
        onInit: function () {
            if (window.location.href.includes("applicationstudio")){
                this.loggedUser = "deea.laslo@yahoo.com";
            }else{
                this.loggedUser = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
            }
            this.oldLevel = 10;
            var oAllExercisesModel = new sap.ui.model.json.JSONModel({
                allExercises: []
            });

            var oProcessedExercises = new sap.ui.model.json.JSONModel({
                processedExercises: []
            });


            this.getView().setModel(oAllExercisesModel, "allExercisesModel");
            this.getView().setModel(oProcessedExercises, "processedExercisesModel");
        },

        onAddExercise: function () {
            this._oDialog = sap.ui.xmlfragment("createworkout.view.ExerciseDialog", this);
            this.getView().addDependent(this._oDialog);
            var oModel = new sap.ui.model.json.JSONModel({
                exercises: [],
                sets: []
            });

            this.sExerciseId = "";
            this.sFitnessMachineId = "";
            this.sExerciseName = "";
            this.sFitnessMachineName = "";
            this._oDialog.setModel(oModel, "exerciseModel");
            this._oDialog.open();
        },

        onComboSelectionChangeEX: function (oEvent) {
            this.sExerciseId = "";
            this.sExerciseName = "";
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            var sSelectedName = oEvent.getParameter("selectedItem").getText();
            this.sExerciseId = sSelectedKey;
            this.sExerciseName = sSelectedName;
        },

        onComboSelectionChangeFM: function (oEvent) {
            this.sFitnessMachineId = "";
            this.sFitnessMachineName = ""
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
            var sSelectedName = oEvent.getParameter("selectedItem").getText();
            this.sFitnessMachineId = sSelectedKey;
            this.sFitnessMachineName = sSelectedName;
        },

        onAddSet: function () {
            var oModel = this._oDialog.getModel("exerciseModel");
            var aData = oModel.getData();
            aData.sets.push({ reps: "", weight: "" });
            oModel.setData(aData);
        },

        onSaveExercise: function () {
            var oAllExercisesModel = this.getView().getModel("allExercisesModel");
            var oProcessedExercisesModel = this.getView().getModel("processedExercisesModel");
            var oData = this._oDialog.getModel("exerciseModel").getData();
            var sPairName = this.sFitnessMachineName ? `${this.sExerciseName} on ${this.sFitnessMachineName}` : this.sExerciseName;

            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sValidationExercise = oBundle.getText("validationExercise");
            var sValidationSet = oBundle.getText("validationSet");

            if (!this.sExerciseId || oData.sets.length === 0) {
                if (!this.sExerciseId) {
                    MessageToast.show(sValidationExercise);
                }
                if (oData.sets.length === 0) {
                    MessageToast.show(sValidationSet);
                }
                return;
            }

            var oSaveData = {
                exerciseId: this.sExerciseId,
                fitnessMachineId: this.sFitnessMachineId,
                name: sPairName,
                sets: oData.sets
            };

            var aCurrentData = oAllExercisesModel.getData().allExercises;
            aCurrentData.push(oSaveData);
            oAllExercisesModel.setData({ allExercises: aCurrentData });

            var aProcessedData = oProcessedExercisesModel.getData().processedExercises;
            oData.sets.forEach(set => {
                aProcessedData.push({
                    name: sPairName,
                    reps: set.reps,
                    weight: set.weight
                });
            });
            oProcessedExercisesModel.setData({ processedExercises: aProcessedData });


            console.log(oAllExercisesModel.getData());
            console.log(oProcessedExercisesModel.getData());
            this._oDialog.destroy();
        },

        onCancel: function () {
            this._oDialog.destroy();
        },

        onSaveEntireWorkout: function (oEvent) {
            var oView = this.getView();
            var oModel = this.getView().getModel("catalogV2");
            var sWorkoutName = oView.byId("nameInput").getValue();
            var sWorkoutPlaceId = oView.byId("placeInput").getSelectedKey();
            var sWorkoutTypeId = oView.byId("typeInput").getSelectedKey();
            var sUserEmail = this.loggedUser;
            var aAllExercises = oView.getModel("allExercisesModel").getData().allExercises;

            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var svalidationWorkoutName = oBundle.getText("validationWorkoutName");
            var svaidationWorkoutPlace = oBundle.getText("vaidationWorkoutPlace");
            var svalidationWorkoutType = oBundle.getText("validationWorkoutType");
            var svalidationAllExercises = oBundle.getText("validationAllExercises");
            var ssaveWorkoutCOnfirmation = oBundle.getText("saveWorkoutConfirmation");
            var snavigationConfirmation = oBundle.getText("navigationConfirmation");
            var ssaveWorkoutFail = oBundle.getText("saveWorkoutFail");


            if (!sWorkoutName || !sWorkoutPlaceId || !sWorkoutTypeId) {
                if (!sWorkoutName) {
                    MessageToast.show(svalidationWorkoutName);
                }
                if (!sWorkoutPlaceId) {
                    MessageToast.show(svaidationWorkoutPlace);
                }
                if (!sWorkoutTypeId) {
                    MessageToast.show(svalidationWorkoutType);
                }
                return;
            }

            if (aAllExercises.length === 0) {
                MessageToast.show(svalidationAllExercises);
                return;
            }

            MessageBox.warning(ssaveWorkoutCOnfirmation, {
                actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                styleClass: "sapUiSizeCompact",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var oEntity = {
                            USER_EMAIL: sUserEmail,
                            TYPE_ID: sWorkoutTypeId,
                            PLACE_ID: sWorkoutPlaceId,
                            NAME: sWorkoutName
                        };
                        this.updateLevelHistory(sWorkoutName);
                        oModel.create("/WORKOUTS", oEntity, {
                            success: function (oRetreivedResult) {
                                var sWorkoutCreatedID = oRetreivedResult.ID;

                                for (var i = 0; i < aAllExercises.length; i++) {
                                    var sExerciseId = aAllExercises[i].exerciseId;
                                    var sFitnessMachineId = aAllExercises[i].fitnessMachineId ? aAllExercises[i].fitnessMachineId : null;

                                    var oEntityExerciseOnFitnessMachine = {
                                        FITNESS_MACHINE_ID: sFitnessMachineId,
                                        EXERCISE_ID: sExerciseId
                                    };

                                    oModel.create("/EXERCISES_ON_FITNESS_MACHINES", oEntityExerciseOnFitnessMachine, {
                                        success: function (oRetreivedResult) {
                                            var sExerciseOnFMID = oRetreivedResult.ID;
                                            var sEXID = oRetreivedResult.EXERCISE_ID;
                                            var sFMID = oRetreivedResult.FITNESS_MACHINE_ID ? oRetreivedResult.FITNESS_MACHINE_ID : "";
                                            var oExerciseData = aAllExercises.find(exercise => exercise.exerciseId === sEXID && exercise.fitnessMachineId == sFMID);

                                            if (oExerciseData && oExerciseData.sets) {
                                                oExerciseData.sets.forEach(set => {
                                                    var oExerciseEntity = {
                                                        USER_EMAIL: sUserEmail,
                                                        EXERCISE_ID: sExerciseOnFMID,
                                                        WEIGHT: set.weight,
                                                        NUMBER_OF_REPS: set.reps,
                                                        WORKOUT_ID: sWorkoutCreatedID
                                                    };

                                                    oModel.create("/USER_EXERCISES", oExerciseEntity, {
                                                        success: function () {
                                                            
                                                        }.bind(this),
                                                        error: function () {
                                                            MessageToast.show(ssaveWorkoutFail); 
                                                        }
                                                    });
                                                });
                                            }
                                            
                                        }.bind(this),
                                        error: function () {
                                        }
                                    });
                                }

                            },
                            error: function () {
                            }
                        })

                        MessageBox.success(snavigationConfirmation, {
                            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                            styleClass: "sapUiSizeCompact",
                            onClose: function (sAction) {
                                if (sAction === MessageBox.Action.YES) {
                                    this.onGenerateWorkoutsModel();
                                    this.clearConfiguration();
                                    this.onNavToMyWorkouts();
                                }
                                if (sAction === MessageBox.Action.NO) {
                                    this.onGenerateWorkoutsModel();
                                    this.clearConfiguration();
                                }
                            }.bind(this)
                        });
                    }
                }.bind(this)
            });
            

        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        onNavToMyWorkouts: function () {
            this.getRouter().navTo("manage");
        },

        onClearConfiguration: function () {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sclearConfirgurationConfirmation = oBundle.getText("clearConfirgurationConfirmation");
            var sclearConfirgurationSuccess = oBundle.getText("clearConfirgurationSuccess");

            sap.m.MessageBox.warning(sclearConfirgurationConfirmation, {
                actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === sap.m.MessageBox.Action.YES) {
                        this.clearConfiguration();
                        sap.m.MessageToast.show(sclearConfirgurationSuccess);
                    }
                }.bind(this)
            });
        },

        clearConfiguration: function () {
            var oView = this.getView();
            oView.byId("nameInput").setValue("");
            oView.byId("placeInput").setSelectedKey("");
            oView.byId("typeInput").setSelectedKey("");

            var oAllExercisesModel = oView.getModel("allExercisesModel");
            oAllExercisesModel.setData({ allExercises: [] });

            var oProcessedExercisesModel = oView.getModel("processedExercisesModel");
            oProcessedExercisesModel.setData({ processedExercises: [] });
        },

        updateLevelHistory: async function (sWorkoutName) {
            var oModel = this.getOwnerComponent().getModel("catalogV2");
            var sPath = "/USERS(\'" + this.loggedUser + "\')";
            try {
                const oData = await new Promise((resolve, reject) => {
                    oModel.read(sPath, {
                        success: function(oData) {
                            resolve(oData);
                        },
                        error: function() {
                            sap.m.MessageToast.show("Error fetching users.");
                            reject();
                        }
                    });
                });
        
                this.oldLevel = oData.LEVEL;
                this.newLevel = this.oldLevel + 1;
                console.log("LEVEL FROM WORKOUT CREATION: " + this.oldLevel + " " + sWorkoutName);
                var oLevelUpdate = {
                    LEVEL: this.newLevel
                }
                oModel.update(sPath, oLevelUpdate, {
                    success: function (oRetrievedResult) {
                        
                        var oLevelHistoryEntity  = {
                            USER_EMAIL: this.loggedUser,
                            DESCIRPTION: "Created a new workout: " + sWorkoutName,
                            OLD_LEVEL: this.oldLevel,
                            NEW_LEVEL: this.newLevel
                        }
                        
                        oModel.create("/LEVEL_HISTORY", oLevelHistoryEntity, {
                            success: function () {
                                
                            }.bind(this),
                            error: function () {
                               
                            }
                        });
                    }.bind(this),
                    error: function (oError) {
                        console.log(oError);
                        MessageBox.error(oError.statusCode + " - " + oError.statusText);
                    }
                });
                
        
            } catch (error) {
                console.error("Failed to fetch level data: ", error);
            }
        }

    });
}, true);
