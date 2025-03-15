sap.ui.define([
    "startworkout/controller/BaseController",
    "sap/ui/model/json/JSONModel",
],
function (BaseController,JSONModel) {
    "use strict";

    return BaseController.extend("startworkout.controller.StartPage", {
        onInit: function () {
            // this.onGenerateWorkoutsModel();
            var oViewModel = new JSONModel({
                isWorkoutSelected: false
            });
            this.getView().setModel(oViewModel, "view");

        },

        onComboSelectionChange: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var oViewModel = this.getView().getModel("view");

            if (oSelectedItem) {
                var sSelectedKey = oSelectedItem.getKey();
                var oProcessedWorkoutsModel = this.getOwnerComponent().getModel("processedWorkouts");
                var aWorkouts = oProcessedWorkoutsModel.getProperty("/Workouts");

                var oSelectedWorkout = aWorkouts.find(workout => workout.workoutId === sSelectedKey);

                if (oSelectedWorkout) {
                    this._updateWorkoutDetails(oSelectedWorkout);
                    oViewModel.setProperty("/isWorkoutSelected", true);
                    oViewModel.setProperty("/selectedWorkoutName", oSelectedWorkout.name);
                }
            } else {
                oViewModel.setProperty("/isWorkoutSelected", false);
                oViewModel.setProperty("/selectedWorkoutName", "");
            }
        },

        _updateWorkoutDetails: function (oWorkout) {
            var oFormDetails = this.byId("FormDetails");
            oFormDetails.setVisible(true);

            var oPlaceText = this.byId("placeText");
            oPlaceText.setText(oWorkout.place);

            var oTypeText = this.byId("typeText");
            oTypeText.setText(oWorkout.type);

            var oExercisesListVBox = this.byId("exercisesList");
            oExercisesListVBox.removeAllItems();

            oWorkout.exercises.forEach((exercise, index) => {
                var sSetsText = exercise.numberOfSets === "1 set" ? "1 set" : exercise.numberOfSets;
                var oExerciseText = new sap.m.Text({
                    text: (index + 1) + ". " + exercise.sPairNameGrouped + " - " + sSetsText
                });
                oExercisesListVBox.addItem(oExerciseText);
            });
        },

        onStartWorkout: function(oEvent){
            var oViewModel = this.getView().getModel("view");
            var sWorkoutName = oViewModel.getProperty("/selectedWorkoutName");

            this.getRouter().navTo("startworkout", {
                workoutName: sWorkoutName
            });
        },

		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		}
    });
});
