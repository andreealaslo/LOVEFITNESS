sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller,JSONModel) {
    "use strict";

    return Controller.extend("hxm.controller.BaseController", {
        onGenerateHistoryModel: function(){
            if (window.location.href.includes("applicationstudio")){
                this.loggedUser = "deea.laslo@yahoo.com";
            }else{
                this.loggedUser = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
            }   
            var oModel = this.getOwnerComponent().getModel("catalogV2");
            var sPath = "/WORKOUT_HISTORY";

            oModel.read(sPath, {
                urlParameters: {
                    "$expand": "WORKOUT/TYPE,WORKOUT/PLACE"
                },
                success: (oData) => {
                    var aHistoryOfWorkouts = this.processeHistory(oData.results);
                    var oHistoryModel = new JSONModel({ Workouts: aHistoryOfWorkouts , count: oData.results.length});
                    console.log(oHistoryModel.getData());
                    this.getOwnerComponent().setModel(oHistoryModel, "historyWorkouts");
                },
                error: function () {
                    sap.m.MessageToast.show("Error fetching workout data.");
                }
            });
        },

        processeHistory: function(oWorkoutsHistory){
            const aProcessedWorkouts = [];
            for (let i = 0; i < oWorkoutsHistory.length; i++) {
                const oWorkout = oWorkoutsHistory[i];
                if (oWorkout.WORKOUT.USER_EMAIL === this.loggedUser) {
                    aProcessedWorkouts.push({
                        date: oWorkout.DATE,
                        time: oWorkout.TIME,
                        workoutName: oWorkout.WORKOUT.NAME,
                        place: oWorkout.WORKOUT.PLACE.PLACE,
                        type: oWorkout.WORKOUT.TYPE.TYPE,
                    });
                }
                
            }
            return aProcessedWorkouts;
        }
    });
});