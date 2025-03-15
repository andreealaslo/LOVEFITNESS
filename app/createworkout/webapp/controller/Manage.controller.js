sap.ui.define([

    "createworkout/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
], function (BaseController, JSONModel, MessageBox, MessageToast, Dialog, Button, Label) {
    "use strict";


    return BaseController.extend("createworkout.controller.Manage", {

        onInit: function(){
            if (window.location.href.includes("applicationstudio")){
                this.loggedUser = "deea.laslo@yahoo.com";
            }else{
                this.loggedUser = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
            }
            this.onGenerateWorkoutsModel();
        },

        onEditSetPress: function (oEvent) {
            var oButton = oEvent.getSource();
            var oItemLine = oButton.getParent().getParent();
            var oItemLineObject = oItemLine.getBindingContext("processedWorkouts").getObject();
            var sUserExerciseId = oItemLineObject.userExerciseId;

            var oModel = this.getView().getModel("catalogV2");
            var sPath = "/USER_EXERCISES(guid'" + sUserExerciseId + "')";
            var oData = oModel.getProperty(sPath);

            var iOldReps = oItemLineObject.reps;
            var iOldWeights = oItemLineObject.weight;
            var sWorkoutID = oData.WORKOUT_ID;
            var sExerciseID = oData.EXERCISE_ID;
            var sUserEmail = oData.USER_EMAIL;

            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sOpenDialogMessage = oBundle.getText("editSet");
            var sValidation = oBundle.getText("Validation");

            this.oEditSetDialog = new Dialog({
                title: sOpenDialogMessage,
                content: [
                    new Label({ text: "Number of reps: " }),
                    new sap.m.Input({
                        width: "100%",
                        type: "Number",
                        value: iOldReps,
                        
                        liveChange: function (oEvent) {
                            var oInput = oEvent.getSource();
                            var sValue = oInput.getValue();
                            if (!sValue.match(/^\d*\.?\d*$/)) {
                                oInput.setValueState(sap.ui.core.ValueState.Error);
                                oInput.setValueStateText(sValidation);
                            } else {
                                oInput.setValueState(sap.ui.core.ValueState.None);
                            }
                        }
                    }),
                    new Label({ text: "Weight: " }),
                    new sap.m.Input({
                        width: "100%",
                        type: "Number",
                        value: iOldWeights,
                        
                        liveChange: function (oEvent) {
                            var oInput = oEvent.getSource();
                            var sValue = oInput.getValue();
                            if (!sValue.match(/^\d*\.?\d*$/)) {
                                oInput.setValueState(sap.ui.core.ValueState.Error);
                                oInput.setValueStateText(sValidation);
                            } else {
                                oInput.setValueState(sap.ui.core.ValueState.None);
                            }
                        }
                    })
                ],
                contentWidth: "200px",
                contentHeight: "118px",
                resizable: true,
                draggable: true,
                beginButton: new Button({
                    text: "SAVE",
                    press: function (oEvent) {
                        var oEntity = {
                            USER_EMAIL: sUserEmail,
                            EXERCISE_ID: sExerciseID,
                            WEIGHT: oEvent.getSource().getParent().getContent()[3].getValue(),
                            NUMBER_OF_REPS: oEvent.getSource().getParent().getContent()[1].getValue(),
                            WORKOUT_ID: sWorkoutID
                        }
                        oModel.update(sPath, oEntity, {
                            success: function () {
                                var sEditSuccessMessage = oBundle.getText("editSetSuccess");
                                sap.m.MessageToast.show(sEditSuccessMessage);
                                this.onGenerateWorkoutsModel();
                            }.bind(this),
                            error: function () {
                                var sEditFailMessage = oBundle.getText("editSetFail");
                                MessageBox.error(sEditFailMessage);
                            }
                        });

                        this.oEditSetDialog.destroy();
                    }.bind(this)
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        this.oEditSetDialog.destroy();
                    }.bind(this)
                }),
            });

            this.oEditSetDialog.addStyleClass("sapUiResponsivePadding--content sapUiResponsivePadding--header sapUiResponsivePadding--footer sapUiResponsivePadding--subHeader");
            this.getView().addDependent(this.oEditSetDialog);
            this.oEditSetDialog.open();
        },

        onDeleteSetPress: function (oEvent) {
            var oButton = oEvent.getSource();
            var oItemLine = oButton.getParent().getParent();
            var oItemLineObject = oItemLine.getBindingContext("processedWorkouts").getObject();
            var sUserExerciseId = oItemLineObject.userExerciseId;

            var oModel = this.getView().getModel("catalogV2");
            var sPath = "/USER_EXERCISES(guid'" + sUserExerciseId + "')";

            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sConfirmationMessage = oBundle.getText("deleteSetConfirmationMessage");


            MessageBox.warning(sConfirmationMessage, {
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                styleClass: "sapUiSizeCompact",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.DELETE) {
                        oModel.remove(sPath, {
                            success: function () {
                                const sDeleteMessage = oBundle.getText("deleteSetSuccess");
                                MessageToast.show(sDeleteMessage);
                                this.onGenerateWorkoutsModel();
                            }.bind(this),
                            error: function (oError) {
                                const sErrorMessage = oBundle.getText("deleteSetFail");
                                MessageBox.error(sErrorMessage + oError.statusCode + " - " + oError.statusText);
                            }
                        })
                    }
                }.bind(this)
            });
        },

        onAddSetPress: function (oEvent) {
            var oModel = this.getView().getModel("catalogV2");
            var oButton = oEvent.getSource();
            var oSection = oButton.getParent().getParent();
            var oSubsection = oButton.getParent();
            var oSectionObject = oSection.getBindingContext("processedWorkouts").getObject();
            var oSubsectionObject = oSubsection.getBindingContext("processedWorkouts").getObject();

            var sWorkoutId = oSectionObject.workoutId;
            var sExerciseId = oSubsectionObject.exerciseId;
            var sExerciseGroupedName = oSubsectionObject.sPairNameGrouped;
            var sUserEmail = this.loggedUser;

            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sOpenDialogMessage = oBundle.getText("createSet", [sExerciseGroupedName]);
            var sValidation = oBundle.getText("Validation");

            this.oCreateSetDialog = new Dialog({
                title: sOpenDialogMessage,
                content: [
                    new Label({ text: "Number of reps: " }),
                    new sap.m.Input({
                        width: "100%",
                        type: "Number",
                        value: "",  
                        liveChange: function (oEvent) {
                            var oInput = oEvent.getSource();
                            var sValue = oInput.getValue();
                            if (!sValue.match(/^\d*\.?\d*$/)) {
                                oInput.setValueState(sap.ui.core.ValueState.Error);
                                oInput.setValueStateText(sValidation);
                            } else {
                                oInput.setValueState(sap.ui.core.ValueState.None);
                            }
                        }
                    }),
                    new Label({ text: "Weight: " }),
                    new sap.m.Input({
                        width: "100%",
                        type: "Number",
                        value: "",  // Start with an empty value
                        liveChange: function (oEvent) {
                            var oInput = oEvent.getSource();
                            var sValue = oInput.getValue();
                            if (!sValue.match(/^\d*\.?\d*$/)) {
                                oInput.setValueState(sap.ui.core.ValueState.Error);
                                oInput.setValueStateText(sValidation);
                            } else {
                                oInput.setValueState(sap.ui.core.ValueState.None);
                            }
                        }
                    })
                ],
                contentWidth: "300px",
                contentHeight: "120px",
                resizable: true,
                draggable: true,
                beginButton: new Button({
                    text: "SAVE",
                    press: function (oEvent) {
                        var oEntity = {
                            USER_EMAIL: sUserEmail,
                            EXERCISE_ID: sExerciseId,
                            WEIGHT: oEvent.getSource().getParent().getContent()[3].getValue(),
                            NUMBER_OF_REPS: oEvent.getSource().getParent().getContent()[1].getValue(),
                            WORKOUT_ID: sWorkoutId
                        }
                        oModel.create("/USER_EXERCISES", oEntity, {
                            success: function () {
                                var sEditSuccessMessage = oBundle.getText("createSetSuccess");
                                sap.m.MessageToast.show(sEditSuccessMessage);
                                this.onGenerateWorkoutsModel();
                            }.bind(this),
                            error: function () {
                                var sEditFailMessage = oBundle.getText("createSetFail");
                                MessageBox.error(sEditFailMessage);
                            }
                        });

                        this.oCreateSetDialog.destroy();
                    }.bind(this)
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        this.oCreateSetDialog.destroy();
                    }.bind(this)
                }),
            });

            this.oCreateSetDialog.addStyleClass("sapUiResponsivePadding--content sapUiResponsivePadding--header sapUiResponsivePadding--footer sapUiResponsivePadding--subHeader");
            this.getView().addDependent(this.oCreateSetDialog);
            this.oCreateSetDialog.open();
        },

        onAddNewExerciseToWorkout: function (oEvent) {
            var oModel = this.getView().getModel("catalogV2");
            var oBundle = this.getView().getModel("i18n").getResourceBundle();

            var sOpenDialogMessage = oBundle.getText("createExerciseForWorkout");
            var sValidation = oBundle.getText("Validation");
            var requiredField = oBundle.getText("requiredField");
            var requiredFields = oBundle.getText("requiredFields");

            var oComboBoxWorkout = new sap.m.ComboBox({
                items: {
                    path: 'processedWorkouts>/Workouts',
                    template: new sap.ui.core.Item({
                        key: "{processedWorkouts>workoutId}",
                        text: "{processedWorkouts>name}"
                    }),
                    
                },
                width: "100%",
                required: true
            });

            var oComboBoxExercise = new sap.m.ComboBox({
                items: {
                    path: 'catalogV2>/EXERCISES',
                    template: new sap.ui.core.Item({
                        key: "{catalogV2>ID}",
                        text: "{catalogV2>NAME}"
                    }),
                    sorter: new sap.ui.model.Sorter("NAME", false),
                },
                width: "100%",
                required: true
            });

            var oComboBoxFitnessMachine = new sap.m.ComboBox({
                items: {
                    path: 'catalogV2>/FITNESS_MACHINES',
                    sorter: new sap.ui.model.Sorter("NAME", false),
                    template: new sap.ui.core.Item({
                        key: "{catalogV2>ID}",
                        text: "{catalogV2>NAME}"
                    }),
                    
                },
                width: "100%",
            });

        
            this.oAddNewExerciseToWorkoutDialog = new Dialog({
                title: sOpenDialogMessage,
                content: [
                    new Label({
                        text: "Select workout: ",
                        labelFor: oComboBoxWorkout,
                        required: true
                    }),
                    oComboBoxWorkout,
                    new Label({
                        text: "Select exercise: ",
                        labelFor: oComboBoxExercise,
                        required: true
                    }),
                    oComboBoxExercise,
                    new Label({
                        text: "Select fitness machine: ",
                        labelFor: oComboBoxFitnessMachine,

                    }),
                    oComboBoxFitnessMachine,
                    new Label({
                        text: "-----Configure one set-----",
                        textAlign: "Center", 
                        design: "Bold",
                        width: "100%" 
                    }).addStyleClass("centerText"),

                    new Label({ text: "Number of reps: ", required: true}),

                    new sap.m.Input({
                        width: "100%",
                        type: "Number",
                        value: "",  
                        liveChange: function (oEvent) {
                            var oInput = oEvent.getSource();
                            var sValue = oInput.getValue();
                            if (!sValue.match(/^\d*\.?\d*$/)  || sValue === "") {
                                oInput.setValueState(sap.ui.core.ValueState.Error);
                                oInput.setValueStateText(sValidation);
                            } else {
                                oInput.setValueState(sap.ui.core.ValueState.None);
                            }
                        }
                    }),

                    new Label({ text: "Weight: " , required: true}),

                    new sap.m.Input({
                        width: "100%",
                        type: "Number",
                        value: "", 
                        liveChange: function (oEvent) {
                            var oInput = oEvent.getSource();
                            var sValue = oInput.getValue();
                            if (!sValue.match(/^\d*\.?\d*$/)  || sValue === "") {
                                oInput.setValueState(sap.ui.core.ValueState.Error);
                                oInput.setValueStateText(sValidation);
                            } else {
                                oInput.setValueState(sap.ui.core.ValueState.None);
                            }
                        }
                    })
                ],
                contentWidth: "200px",
                contentHeight: "300px",
                resizable: true,
                draggable: true,
                beginButton: new Button({
                    text: "SAVE",
                    press: function (oEvent) {
                        var weight= oEvent.getSource().getParent().getContent()[10].getValue();
                        var reps =  oEvent.getSource().getParent().getContent()[8].getValue();
                        var bValidWorkout = oComboBoxWorkout.getSelectedKey();
                        var bValidExercise = oComboBoxExercise.getSelectedKey();
                        var sSelectedFMId = oComboBoxFitnessMachine.getSelectedKey();

                        oComboBoxWorkout.setValueState(sap.ui.core.ValueState.None);
                        oComboBoxExercise.setValueState(sap.ui.core.ValueState.None);
                        oComboBoxFitnessMachine.setValueState(sap.ui.core.ValueState.None);

                        if (!bValidWorkout) {
                            oComboBoxWorkout.setValueState(sap.ui.core.ValueState.Error);
                            oComboBoxWorkout.setValueStateText(requiredField);
                        }

                        if (!bValidExercise) {
                            oComboBoxExercise.setValueState(sap.ui.core.ValueState.Error);
                            oComboBoxExercise.setValueStateText(requiredField);
                        }

                        if (!bValidWorkout || !bValidExercise || !weight || !reps) {
                            sap.m.MessageToast.show(requiredFields);
                            return;
                        }

                        if (!sSelectedFMId) {
                            sSelectedFMId = null;
                        }

                        var oEntityExerciseFitnessMachine = {
                            FITNESS_MACHINE_ID: sSelectedFMId,
                            EXERCISE_ID: bValidExercise
                        }

                        oModel.create("/EXERCISES_ON_FITNESS_MACHINES", oEntityExerciseFitnessMachine, {
                            success: function (oRetreivedResult) {
                                var sExerciseOnFitnessMachines = oRetreivedResult.ID;
                                var oEntityUserExercise = {
                                    USER_EMAIL: this.loggedUser,
                                    EXERCISE_ID: sExerciseOnFitnessMachines,
                                    WEIGHT: weight,
                                    NUMBER_OF_REPS: reps,
                                    WORKOUT_ID: bValidWorkout
                                }
                                oModel.create("/USER_EXERCISES", oEntityUserExercise, {
                                    success: function (oRetrievedResult) {
                                        var sSuccess = oBundle.getText("createExerciseForWorkoutSuccess");
                                        MessageToast.show(sSuccess);
                                    },
                                    error: function (oError) {
                                        var sError  = oBundle.getText("createExerciseForWorkoutFail");
                                        sap.m.MessageBox.error(sError);
                                    }
                                });
                                this.onGenerateWorkoutsModel();
                            }.bind(this),
                            error: function () {
                            }
                        });
                        this.oAddNewExerciseToWorkoutDialog.destroy();
                    }.bind(this)
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        this.oAddNewExerciseToWorkoutDialog.destroy();
                    }.bind(this)
                }),
            });

            this.oAddNewExerciseToWorkoutDialog.addStyleClass("sapUiResponsivePadding--content sapUiResponsivePadding--header sapUiResponsivePadding--footer sapUiResponsivePadding--subHeader");
            this.getView().addDependent(this.oAddNewExerciseToWorkoutDialog);
            this.oAddNewExerciseToWorkoutDialog.open();
        },

        onDeleteWorkout: function(oEvent){
            var oModel = this.getView().getModel("catalogV2");
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sOpenDialogMessage = oBundle.getText("deleteWorkoutDialog");
            var requiredField = oBundle.getText("requiredField");
            var requiredFields = oBundle.getText("requiredFields");
            var oComboBoxWorkout = new sap.m.ComboBox({
                items: {
                    path: 'processedWorkouts>/Workouts',
                    template: new sap.ui.core.Item({
                        key: "{processedWorkouts>workoutId}",
                        text: "{processedWorkouts>name}"
                    })
                },
                width: "100%",
                required: true
            });

            this.oDeleteWorkoutDialog = new Dialog({
				title: sOpenDialogMessage,
				content: [
					new Label({
						text: "Select workout: ",
                        labelFor: oComboBoxWorkout,
                        required: true

					}),
					oComboBoxWorkout
				],
				contentWidth: "200px",
				contentHeight: "70px",
				resizable: true,
				draggable: true,
				beginButton: new Button({
					text: "DELETE",
					press: function (oEvent) {
						var bValidWorkout = oComboBoxWorkout.getSelectedKey();
                        oComboBoxWorkout.setValueState(sap.ui.core.ValueState.None);
                        if (!bValidWorkout) {
                            oComboBoxWorkout.setValueState(sap.ui.core.ValueState.Error);
                            oComboBoxWorkout.setValueStateText(requiredField);
                            sap.m.MessageToast.show(requiredFields);
                            return;
                        }
                        var sPath = "/WORKOUTS(guid'" + bValidWorkout + "')";
                        var oData = oModel.getProperty(sPath);
                        for(var i=0; i< oData.EXERCISES.__list.length; i++){
                            var sUserExerciseId = "/"+oData.EXERCISES.__list[i];
                            oModel.remove(sUserExerciseId, {
								success: function () {
								},
								error: function () {
								}
							})
                        }
                        oModel.remove(sPath, {
                            success: function () {
                                var deleteWorkoutSuccess = oBundle.getText("deleteWorkoutSuccess");
                                MessageToast.show(deleteWorkoutSuccess);
                                this.onGenerateWorkoutsModel();
                            }.bind(this),
                            error: function () {
                                var sError  = oBundle.getText("deleteWorkoutFail");
                                sap.m.MessageBox.error(sError);
                            }
                        })
						this.oDeleteWorkoutDialog.destroy();
					}.bind(this)
				}),
				endButton: new Button({
					text: "Cancel",
					press: function () {
						this.oDeleteWorkoutDialog.destroy();
					}.bind(this)
				}),
			});

			this.oDeleteWorkoutDialog.addStyleClass("sapUiResponsivePadding--content sapUiResponsivePadding--header sapUiResponsivePadding--footer sapUiResponsivePadding--subHeader");
			this.getView().addDependent(this.oDeleteWorkoutDialog);
			this.oDeleteWorkoutDialog.open();
        }
    });
}, true);
