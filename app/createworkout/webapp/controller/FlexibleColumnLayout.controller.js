sap.ui.define([
    "sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller"
], function(JSONModel, Controller)  {
    'use strict';

    return Controller.extend("createworkout.controller.FlexibleColumnLayout", {
        onInit(){
			this.bInit = true;
			this.getOwnerComponent().setFcl(this.getView().byId("fcl"));
            this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.attachRouteMatched(this.onRouteMatched, this);
			this.oRouter.attachBeforeRouteMatched(this.onBeforeRouteMatched, this);
        },

        onBeforeRouteMatched: function(oEvent) {
			var oModel = this.getOwnerComponent().getModel("fclModel");
			var sLayout = oEvent.getParameters().arguments.layout;

			if (!sLayout) {
				var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(0);
				sLayout = oNextUIState.layout;
			}

			if (sLayout) {
				oModel.setProperty("/layout", sLayout);
			}
		},

		onRouteMatched: function (oEvent) {
			var sRouteName = oEvent.getParameter("name"),
				oArguments = oEvent.getParameter("arguments");
			this._updateUIElements();

			this.currentRouteName = sRouteName;
			this.currentExercise = oArguments.exercise;

			if(this.bInit){
				this.oRouter.navTo("list", {}, true);
				this.bInit = false;
			}
			
		},

        onStateChanged: function (oEvent) {
			var bIsNavigationArrow = oEvent.getParameter("isNavigationArrow"),
				sLayout = oEvent.getParameter("layout");

			this._updateUIElements();

			if (bIsNavigationArrow) {
				this.oRouter.navTo(this.currentRouteName, {layout: sLayout, exercise: this.currentExercise}, true);
			}
		},

		_updateUIElements: function () {
			var oModel = this.getOwnerComponent().getModel("fclModel");
			var oUIState = this.getOwnerComponent().getHelper().getCurrentUIState();
        
			oModel.setData(oUIState);
		},

		onExit: function () {
			this.oRouter.detachRouteMatched(this.onRouteMatched, this);
			this.oRouter.detachBeforeRouteMatched(this.onBeforeRouteMatched, this);
		}

    })
    
});