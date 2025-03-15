sap.ui.define([
    "createworkout/controller/BaseController",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
], function (BaseController, MessageBox, MessageToast, Dialog, Button, Label) {
    "use strict";

    return BaseController.extend("createworkout.controller.Inspirational", {
        onInit: function () {
            if (window.location.href.includes("applicationstudio")){
                this.loggedUser = "deea.laslo@yahoo.com";
            }else{
                this.loggedUser = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
            }
        },

        onMakeInspirationalWorkoutYours: function (oEvent) {
            var oModel = this.getView().getModel("catalogV2");
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sOpenDialogMessage = oBundle.getText("openDialogMakeItYours");
            var sSuccess = oBundle.getText("successCreation");

            var oComboBoxWorkout = new sap.m.ComboBox({
                items: {
                    path: 'processedInspirationalWorkouts>/Workouts',
                    template: new sap.ui.core.Item({
                        key: "{processedInspirationalWorkouts>workoutId}",
                        text: "{processedInspirationalWorkouts>name}"
                    })
                },
                width: "100%",
                required: true
            });

            this.oDeleteWorkoutDialog = new Dialog({
                title: sOpenDialogMessage,
                content: [
                    new Label({
                        text: "Desired workout: ",
                        labelFor: oComboBoxWorkout,
                        required: true

                    }),
                    oComboBoxWorkout
                ],
                contentWidth: "300px",
                contentHeight: "75px",
                resizable: true,
                draggable: true,
                beginButton: new Button({
                    text: "MAKE IT YOURS",
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

                        var oWorkoutEntity = {
                            USER_EMAIL: this.loggedUser,
                            TYPE_ID: oData.TYPE_ID,
                            PLACE_ID: oData.PLACE_ID,
                            NAME: oData.NAME
                        }

                        oModel.create("/WORKOUTS", oWorkoutEntity, {
                            success: function (oRetreivedResult) {
                                var sWorkoutCreatedID = oRetreivedResult.ID;
                                for (var i = 0; i < oData.EXERCISES.__list.length; i++) {
                                    var sUserExerciseId = "/" + oData.EXERCISES.__list[i];
                                    var oDataExercise = oModel.getProperty(sUserExerciseId);
                                    var oExerciseEntity = {
                                        USER_EMAIL: this.loggedUser,
                                        EXERCISE_ID: oDataExercise.EXERCISE_ID,
                                        WEIGHT: oDataExercise.WEIGHT,
                                        NUMBER_OF_REPS: oDataExercise.NUMBER_OF_REPS,
                                        WORKOUT_ID: sWorkoutCreatedID
                                    }
                                    oModel.create("/USER_EXERCISES", oExerciseEntity, {
                                        success: function () {
                                        },
                                        error: function () {
                                        }
                                    });
                                }
                                this.onGenerateWorkoutsModel();
                                MessageBox.success(sSuccess, {
                                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                                    styleClass: "sapUiSizeCompact",
                                    onClose: function (sAction) {
                                        if (sAction === MessageBox.Action.YES) {
                                            this.onNavToMyWorkouts();
                                        }
                                    }.bind(this)
                                });
                            }.bind(this),
                            error: function () {
                            }
                        });
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

        },

        getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

        onNavToMyWorkouts: function () {
			this.getRouter().navTo("manage");
		},
        

    });
}, true);
