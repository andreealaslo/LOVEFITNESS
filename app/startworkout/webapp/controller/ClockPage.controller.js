sap.ui.define([
    "startworkout/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/List",
    "sap/m/StandardListItem"
], function (BaseController, JSONModel, MessageBox, Dialog, Button, List, StandardListItem) {
    "use strict";

    var timer;
    var seconds = 0;
    var minutes = 0;
    var hours = 0;
    var running = false;
    var totalExercises = 0;
    var elapsedTime = "";

    function updateClock(oView) {
        var clockText = oView.byId("clock");
        if (hours > 0) {
            clockText.setText(
                (hours < 10 ? "0" + hours : hours) + " : " +
                (minutes < 10 ? "0" + minutes : minutes) + " : " +
                (seconds < 10 ? "0" + seconds : seconds)
            );
        } else {
            clockText.setText(
                (minutes < 10 ? "0" + minutes : minutes) + " : " +
                (seconds < 10 ? "0" + seconds : seconds)
            );
        }
    }

    function startClock(oView) {
        running = true;
        timer = setInterval(function () {
            seconds++;
            if (seconds >= 60) {
                seconds = 0;
                minutes++;
                if (minutes >= 60) {
                    minutes = 0;
                    hours++;
                }
            }
            updateClock(oView);
        }, 1000);
    }

    function pauseClock() {
        running = false;
        clearInterval(timer);
    }

    function stopClock(oView) {
        running = false;
        clearInterval(timer);
        seconds = 0;
        minutes = 0;
        hours = 0;
        updateClock(oView);
    }

    function resetClock(oView) {
        seconds = 0;
        minutes = 0;
        hours = 0;
        updateClock(oView);
    }

    function formatElapsedTime() {
        return (hours > 0 ? (hours < 10 ? "0" + hours : hours) + " : " : "") +
            (minutes < 10 ? "0" + minutes : minutes) + " : " +
            (seconds < 10 ? "0" + seconds : seconds);
    }

    return BaseController.extend("startworkout.controller.ClockPage", {
        onInit: function () {
            if (window.location.href.includes("applicationstudio")){
                this.loggedUser = "deea.laslo@yahoo.com";
            }else{
                this.loggedUser = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
            }   
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("startworkout").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            var oCompletedSetsModel = new sap.ui.model.json.JSONModel({ completedSets: [] });
            this.getView().setModel(oCompletedSetsModel, "completedSets");

            var sWorkoutName = oEvent.getParameter("arguments").workoutName;
            this.workoutName = sWorkoutName;

            var oProcessedWorkoutsModel = this.getOwnerComponent().getModel("processedWorkouts");
            if (!oProcessedWorkoutsModel) {
                this.getRouter().navTo("startpage");
            }

            var aWorkouts = oProcessedWorkoutsModel.getProperty("/Workouts");
            var oSelectedWorkout = aWorkouts.find(workout => workout.name === sWorkoutName);
            this.workoutId = oSelectedWorkout.workoutId;

            if (oSelectedWorkout) {
                this.getView().byId("page").setTitle(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("titleClockPage", [sWorkoutName]));

                var aDisplayData = [];
                oSelectedWorkout.exercises.forEach(function (exercise) {
                    exercise.details.forEach(function (detail) {
                        aDisplayData.push({
                            exerciseName: exercise.sPairNameGrouped,
                            reps: detail.reps,
                            weight: detail.weight,
                            exerciseId: exercise.exerciseId,
                            userExerciseId: detail.userExerciseId,
                            done: false,
                            visible: true,

                        });
                    });
                });

                totalExercises = aDisplayData.length;

                var oDisplayModel = new JSONModel({ Exercises: aDisplayData });
                this.getView().setModel(oDisplayModel, "displayModel");

                this._updateProgressIndicator(0);
            }

            resetClock(this.getView());
            startClock(this.getView());
        },

        onSetDone: function (oEvent) {
            var oModelC = this.getView().getModel("catalogV2");
            var oContext = oEvent.getSource().getBindingContext("displayModel");
            var oModel = oContext.getModel();
            var sPath = oContext.getPath();

            var oData = oModel.getProperty(sPath);
            var sExerciseId = oData.exerciseId;
            var sUserExerciseId = oData.userExerciseId;
            var sService = "/USER_EXERCISES(guid'" + sUserExerciseId + "')";
            var sWorkoutId = this.workoutId;

            var iReps = parseInt(oData.reps, 10);
            var fWeight = parseInt(oData.weight, 10);

            oModel.setProperty(sPath + "/reps", iReps);
            oModel.setProperty(sPath + "/weight", fWeight);

            oModel.setProperty(sPath + "/done", true);

            var oEntity = {
                USER_EMAIL: this.loggedUser,
                EXERCISE_ID: sExerciseId,
                WEIGHT: fWeight,
                NUMBER_OF_REPS: iReps,
                WORKOUT_ID: sWorkoutId
            }

            oModelC.update(sService, oEntity, {
                success: function () {
                },
                error: function (oError) {
                    console.log(oError);
                    MessageBox.error(oError.statusCode + " - " + oError.statusText);
                }
            });

            oModel.refresh();
            oContext.getModel().setProperty(sPath + "/visible", false);

            var oCompletedSetsModel = this.getView().getModel("completedSets");
            var aCompletedSets = oCompletedSetsModel.getProperty("/completedSets");
            aCompletedSets.push({ exerciseId: sExerciseId, reps: iReps, weight: fWeight });
            oCompletedSetsModel.setProperty("/completedSets", aCompletedSets);

            var identicalSets = aCompletedSets.filter(set => set.exerciseId === sExerciseId && set.reps === iReps && set.weight === fWeight);
            if (identicalSets.length >= 3) {
                var exerciseDetails = identicalSets.map(set => `Set: ${set.reps} reps, ${set.weight} kg`).join("\n");
                MessageBox.information(`Great job! It's time for progressive overload! Increase the weight for ${oData.exerciseName}.\n\nDetails:\n${exerciseDetails}`);
            }

            this._updateProgressIndicator();
        },

        _updateProgressIndicator: function () {
            var oModel = this.getView().getModel("displayModel");
            var aExercises = oModel.getProperty("/Exercises");
            var doneExercises = aExercises.filter(exercise => exercise.done).length;
            var percentValue = (doneExercises / totalExercises) * 100;
            this.getView().byId("progressIndicator").setPercentValue(percentValue);

            if (percentValue === 100) {
                pauseClock();
                elapsedTime = formatElapsedTime();
                setTimeout(this._onWorkoutComplete.bind(this), 1000);
            }
        },

        _onWorkoutComplete: function () {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sCompleteMessage = oBundle.getText("workoutComplete");

            var oModelC = this.getView().getModel("catalogV2");
            var sWorkoutId = this.workoutId;

            var oCurrentDate = new Date();

            var oEntityC = {
                DATE: oCurrentDate,
                WORKOUT_ID: sWorkoutId,
                TIME: elapsedTime
            }
            oModelC.create("/WORKOUT_HISTORY", oEntityC, {
                success: function () {
                },
                error: function () {
                }
            });

            var oView = this.getView();
            var oModel = oView.getModel("displayModel");
            var aExercises = oModel.getProperty("/Exercises");

            var oDialogContent = new sap.m.VBox();

            var oLabelW = new sap.m.Label({ text: "Workout: " });
            oLabelW.addStyleClass("boldText");
            oDialogContent.addItem(oLabelW);
            oDialogContent.addItem(new sap.m.Text({ text: this.workoutName }));

            var oLabelT = new sap.m.Label({ text: "Time: " });
            oLabelT.addStyleClass("boldText");
            oDialogContent.addItem(oLabelT);
            oDialogContent.addItem(new sap.m.Text({ text: elapsedTime }));

            var oLabelE = new sap.m.Label({ text: "Exercises: " });
            oLabelE.addStyleClass("boldText");
            oDialogContent.addItem(oLabelE);

            var oExerciseList = new List();

            aExercises.forEach(function (exercise) {
                oExerciseList.addItem(new StandardListItem({
                    title: exercise.exerciseName,
                    description: "Reps: " + exercise.reps + ", Weight: " + exercise.weight
                }));
            });

            oDialogContent.addItem(oExerciseList);
            this.oDialog = new Dialog({
                title: sCompleteMessage,
                content: oDialogContent,
                beginButton: new Button({
                    text: "GO TO START WORKOUT",
                    press: function () {
                        this.oDialog.close();
                        this.onGenerateWorkoutsModel();
                        window.history.go(-1);
                    }.bind(this)
                }),
                afterClose: function () {
                    this.oDialog.destroy();
                }.bind(this)
            });

            this.oDialog.addStyleClass("sapUiResponsivePadding--content sapUiResponsivePadding--header sapUiResponsivePadding--footer sapUiResponsivePadding--subHeader");
            oView.addDependent(this.oDialog);
            this.oDialog.open();
        },

        onPause: function () {
            if (running) {
                pauseClock();
                this.byId("pauseButton").setText("RESUME");
            } else {
                startClock(this.getView());
                this.byId("pauseButton").setText("PAUSE");
            }
        },

        onStop: function () {
            var that = this;

            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sMessage = oBundle.getText("stopMessage");

            MessageBox.warning(sMessage, {
                actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.CANCEL,
                styleClass: "sapUiSizeCompact",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        elapsedTime = formatElapsedTime();
                        var oModelC = this.getView().getModel("catalogV2");
                        var sWorkoutId = this.workoutId;
                        var oCurrentDate = new Date();
                        
                        var oEntityC = {
                            DATE: oCurrentDate,
                            WORKOUT_ID: sWorkoutId,
                            TIME: elapsedTime
                        }
                        oModelC.create("/WORKOUT_HISTORY", oEntityC, {
                            success: function () {
                            },
                            error: function () {
                            }
                        });
                        stopClock(that.getView());
                        this.onGenerateWorkoutsModel();
                        window.history.go(-1);
                    }
                }.bind(this)
            });
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        }
    });
});
