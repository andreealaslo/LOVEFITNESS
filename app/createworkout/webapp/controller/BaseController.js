sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";
 
    return Controller.extend("hxm.controller.BaseController", {
        onGenerateWorkoutsModel: function () {
            var oModel = this.getOwnerComponent().getModel("catalogV2");
            if (window.location.href.includes("applicationstudio")){
                this.loggedUser = "deea.laslo@yahoo.com";
            }else{
                this.loggedUser = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
            }
            var sPath = "/WORKOUTS";

            var oEmailFilter = new sap.ui.model.Filter({
                path: "USER_EMAIL",
                operator: sap.ui.model.FilterOperator.EQ,
                value1: this.loggedUser
            });

            oModel.read(sPath, {
                urlParameters: {
                    "$expand": "USER,EXERCISES/EXERCISE/EXERCISE,EXERCISES/EXERCISE/FITNESS_MACHINE,TYPE,PLACE"
                },
                filters: [oEmailFilter],
                success: (oData) => {
                    console.log(oData);
                    var aProcessedWorkouts = this.processeWorkouts(oData.results);
                    var oProcessedModel = new JSONModel({ Workouts: aProcessedWorkouts , count: oData.results.length});
                    console.log(oProcessedModel.getData());

                    this.getOwnerComponent().setModel(oProcessedModel, "processedWorkouts");
                },
                error: function () {
                    sap.m.MessageToast.show("Error fetching workout data.");
                }
            });
        },

        onGenerateInspirationalWorkoutsModel:function(){
            var oModel = this.getOwnerComponent().getModel("catalogV2");
            var sEmail = "inspirational";
            var sName="Shoulders and triceps"
            var sPath = "/WORKOUTS";

            var oEmailFilter = new sap.ui.model.Filter({
                path: "USER_EMAIL",
                operator: sap.ui.model.FilterOperator.EQ,
                value1: sEmail
            });

            var oNameFilter = new sap.ui.model.Filter({
                path: "NAME",
                operator: sap.ui.model.FilterOperator.EQ,
                value1: sName
            });

            oModel.read(sPath, {
                urlParameters: {
                    "$expand": "EXERCISES/EXERCISE/EXERCISE,EXERCISES/EXERCISE/FITNESS_MACHINE,TYPE,PLACE"
                },
                filters: [oEmailFilter,oNameFilter],
                success: (oData) => {
                    var aProcessedInspirationalWorkouts = this.processeWorkouts(oData.results);
                    var oProcessedInspirationalModel = new JSONModel({ Workouts: aProcessedInspirationalWorkouts , count: oData.results.length});
                    console.log(oProcessedInspirationalModel.getData());

                    this.getOwnerComponent().setModel(oProcessedInspirationalModel, "processedInspirationalWorkouts");
                },
                error: function () {
                    sap.m.MessageToast.show("Error fetching workout data.");
                }
            });
        },

        processeWorkouts: function (oWorkouts) {
            const aProcessedWorkouts = [];
            for (let i = 0; i < oWorkouts.length; i++) {
                const oWorkout = oWorkouts[i];
                const oExercisesGrouped = {};

                if (oWorkout.EXERCISES && oWorkout.EXERCISES.results.length > 0) {
                    for (let j = 0; j < oWorkout.EXERCISES.results.length; j++) {
                        const oExercise = oWorkout.EXERCISES.results[j];
                        const sId = oExercise.EXERCISE_ID;

                        if (!oExercisesGrouped[sId]) {
                            var exerciseID = oExercise.EXERCISE_ID;
                            var sExerciseName = oExercise.EXERCISE.EXERCISE.NAME;
                            var sMachineName = oExercise.EXERCISE.FITNESS_MACHINE ? oExercise.EXERCISE.FITNESS_MACHINE.NAME : "";
                            var sPairName = sMachineName ? `${sExerciseName} on ${sMachineName}` : sExerciseName;
                            oExercisesGrouped[sId] = {
                                sPairNameGrouped: sPairName,
                                exerciseId: exerciseID,
                                details: [],
                                numberOfSets: 0
                            };
                        }
                        oExercisesGrouped[sId].details.push({
                            userExerciseId: oExercise.ID,
                            reps: oExercise.NUMBER_OF_REPS,
                            weight: oExercise.WEIGHT
                        });
                        oExercisesGrouped[sId].numberOfSets += 1;
                    }
                    for (let id in oExercisesGrouped) {
                        const iSetCount = oExercisesGrouped[id].numberOfSets;
                        oExercisesGrouped[id].numberOfSets = iSetCount + (iSetCount === 1 ? ' set' : ' sets');
                    }
                }
                const sortedExercises = Object.values(oExercisesGrouped).sort((a, b) => {
                    return a.sPairNameGrouped.localeCompare(b.sPairNameGrouped);
                });

                sortedExercises.forEach(exercise => {
                    exercise.details.sort((a, b) => {
                        if (a.reps === b.reps) {
                            return a.weight - b.weight; 
                        }
                        return a.reps - b.reps; 
                    });
                });

                aProcessedWorkouts.push({
                    workoutId: oWorkout.ID,
                    name: oWorkout.NAME,
                    place: oWorkout.PLACE.PLACE,
                    type: oWorkout.TYPE.TYPE,
                    exercises: sortedExercises
                });
            }
            return aProcessedWorkouts;
        },


});
});