sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("level.controller.Level", {
        onInit: function () {
            if (window.location.href.includes("applicationstudio")){
                this.loggedUser = "deea.laslo@yahoo.com";
            }else{
                this.loggedUser = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
            }            
            this.badges = {
                0: "Beginner",
                5: "Novice",
                10: "Experienced",
                20: "Master",
                30: "Grand Master"
            };
            this.userModel = new JSONModel({
                userLevel: "",
                userBadge: "",
                displayLevelHistory: []
            });
            this.getView().setModel(this.userModel);

            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("level").attachPatternMatched(this._onRouteMatched, this);
        },


        _onRouteMatched: function () {
            this.readWorkoutsHistory().then(() => {
                this.updateLevelHistory();
                this.readLevel();
            });
        },

        readLevel: function () {
            return new Promise((resolve, reject) => {
                var oModel = this.getOwnerComponent().getModel("catalogV2");
                var sPath = "/USERS(\'" + this.loggedUser + "\')";
        
                oModel.read(sPath, {
                    urlParameters: {
                        "$expand": "LEVEL_HISTORY"
                    },
                    success: (oData) => {
                        const lastShownBadgeKey = `lastShownBadge_${this.loggedUser}`;
                        const oldBadge = localStorage.getItem(lastShownBadgeKey) || "Beginner"; 
                        
                        const newLevel = oData.LEVEL;
                        this.userModel.setProperty("/userLevel", newLevel);
                        this.updateBadge(newLevel, oldBadge);
                        
                        oData.LEVEL_HISTORY.results.sort((a, b) => b.createdAt - a.createdAt);
                        var levelHistory = oData.LEVEL_HISTORY.results.map(item => {
                            return {
                                id: item.ID,
                                description: item.DESCIRPTION,
                                oldLevel: item.OLD_LEVEL,
                                newLevel: item.NEW_LEVEL
                            };
                        });
        
                        this.userModel.setProperty("/displayLevelHistory", levelHistory);
        
                        resolve();
                    },
                    error: () => {
                        sap.m.MessageToast.show("Error fetching users.");
                        reject();
                    }
                });
            });
        },

        readWorkoutsHistory: function () {
            return new Promise((resolve, reject) => {
                this.getOwnerComponent().getModel("catalogV2").read("/WORKOUT_HISTORY", {
                    urlParameters: {
                        "$expand": "WORKOUT"
                    },
                    success: (oData) => {
                        console.log(oData.results);
                        var aHistoryOfWorkouts = this.processeHistory(oData.results);
                        var oHistoryModel = new sap.ui.model.json.JSONModel({ Workouts: aHistoryOfWorkouts });
                        console.log(oHistoryModel.getData());
                        this.getView().setModel(oHistoryModel, "historyWorkouts");
                        resolve();
                    },
                    error: function () {
                        sap.m.MessageToast.show("Error fetching workout data.");
                        reject();
                    }
                });
            });
        },

        processeHistory: function (oWorkoutsHistory) {
            const aProcessedWorkouts = [];
            for (let i = 0; i < oWorkoutsHistory.length; i++) {
                const oWorkout = oWorkoutsHistory[i];
                if (oWorkout.WORKOUT.USER_EMAIL === this.loggedUser) {
                    aProcessedWorkouts.push({
                        date: oWorkout.DATE,
                    });
                }
            }
            return aProcessedWorkouts;
        },

        calculateWeeksOfInactivity: function (historyWorkouts) {
            if (!historyWorkouts || historyWorkouts.length === 0) {
                return { weeksDiff: 0, mostRecentDate: null };
            }
            const mostRecentDate = new Date(Math.max.apply(null, historyWorkouts.map(w => new Date(w.date))));
            const currentDate = new Date();

            const timeDiff = currentDate.getTime() - mostRecentDate.getTime();
            const daysDiff = timeDiff / (1000 * 3600 * 24);
            const weeksDiff = Math.floor(daysDiff / 7);

            return {
                weeksDiff,
                mostRecentDate
            };
        },

        updateBadge: function (level, oldBadge) {
            let newBadge = "Beginner";
            if (level >= 30) {
                newBadge = "Grand Master";
            } else if (level >= 20) {
                newBadge = "Master";
            } else if (level >= 10) {
                newBadge = "Experienced";
            } else if (level >= 5) {
                newBadge = "Novice";
            }
        
            const lastShownBadgeKey = `lastShownBadge_${this.loggedUser}`;
            const lastShownBadge = localStorage.getItem(lastShownBadgeKey);
        
            if (newBadge !== oldBadge) {
                this.userModel.setProperty("/userBadge", newBadge);
                if (newBadge !== lastShownBadge) {
                    MessageBox.success(`Congratulations! You have been upgraded from ${oldBadge} to ${newBadge}.`);
                    localStorage.setItem(lastShownBadgeKey, newBadge);
                }
            }
            else{
                this.userModel.setProperty("/userBadge", oldBadge);
            }
        },

        onDisplayPoints: function () {
            var ofirstPart = new sap.m.HBox({
                items: [
                    new sap.m.Text({ text: "The level" }).addStyleClass("a"),
                    new sap.m.Text({ text: "increases" }).addStyleClass("green-bold"),
                    new sap.m.Text({ text: " if:" }).addStyleClass("b"),
                ]
            });
            var osecondtPart = new sap.m.HBox({
                items: [
                    new sap.m.Text({ text: "The level " }).addStyleClass("a"),
                    new sap.m.Text({ text: "decreases" }).addStyleClass("red-bold"),
                    new sap.m.Text({ text: " if:" }).addStyleClass("b"),
                ]
            });
            var othridPart = new sap.m.VBox({
                items: [
                    new sap.m.Text({ text: "Ranks:" }),
                    new sap.m.Text({ text: "1) Beginner - level 0 to 5" }),
                    new sap.m.Text({ text: "2) Novice - level 5 to 10"}),
                    new sap.m.Text({ text: "3) Experienced - level 10 to 20" }),
                    new sap.m.Text({ text: "4) Master - level 20 to 30" }),
                    new sap.m.Text({ text: "5) Grand Master - up level 30" }),
                ]
            });

            var oMessageBox = new sap.m.VBox({
                items: [
                    ofirstPart,
                    new sap.m.Text({ text: "1) You create a new workout:   +1 point" }).addStyleClass(""),
                    new sap.m.Text({ text: "2) You complete a challenge:   +2 points" }).addStyleClass(""),
                    new sap.m.Text({ text: "3) Somebody adds you as a new friend:   +2 points" }).addStyleClass(""),
                    new sap.m.Text({ text: "" }).addStyleClass(""),
                    osecondtPart,
                    new sap.m.Text({ text: "1) You are inactive a whole week:   -2 points/week " }).addStyleClass(""),
                    new sap.m.Text({ text: "" }).addStyleClass(""),
                    othridPart
                ]
            });

            MessageBox.information(oMessageBox, {
                title: "Level Points Information"
            });
        },

        onEraseAll: function () {
            var oModel = this.getView().getModel("catalogV2");
            var oLevelModel = this.getView().getModel();
            var aLevelHistory = oLevelModel.getProperty("/displayLevelHistory");

            MessageBox.warning("Are you sure that you want to erase the history? Your level won't be affected!", {
                actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.CANCEL,
                styleClass: "sapUiSizeCompact",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        var deletePromises = aLevelHistory.map((entry) => {
                            return new Promise((resolve, reject) => {
                                var sLevelHistoryID = entry.id;
                                var sPath = "/LEVEL_HISTORY(guid'" + sLevelHistoryID + "')";
                                oModel.remove(sPath, {
                                    success: resolve,
                                    error: reject
                                });
                            });
                        });

                        Promise.all(deletePromises)
                            .then(() => {
                                this.readLevel();
                                MessageToast.show("History successfully deleted!");
                            })
                            .catch(() => {
                                MessageToast.show("Error deleting history.");
                            });
                    }
                }.bind(this)
            });
        },

        updateLevelHistory: async function () {
            var oModel = this.getOwnerComponent().getModel("catalogV2");
            var sPath = "/USERS(\'" + this.loggedUser + "\')";
            try {
                const oData = await new Promise((resolve, reject) => {
                    oModel.read(sPath, {
                        success: function (oData) {
                            resolve(oData);
                        },
                        error: function () {
                            sap.m.MessageToast.show("Error fetching users.");
                            reject();
                        }
                    });
                });

                this.oldLevel = oData.LEVEL;

                const oHistoryModel = this.getView().getModel("historyWorkouts");
                const aHistoryOfWorkouts = oHistoryModel.getProperty("/Workouts");

                const { weeksDiff, mostRecentDate } = this.calculateWeeksOfInactivity(aHistoryOfWorkouts);

                const lastInactiveDateKey = `lastInactiveDate_${this.loggedUser}`;
                const lastInactiveDate = new Date(localStorage.getItem(lastInactiveDateKey));
                if (!lastInactiveDate || mostRecentDate > lastInactiveDate) {
                    this.newLevel = this.oldLevel - (weeksDiff * 2); 

                    var oLevelUpdate = {
                        LEVEL: this.newLevel
                    };

                    oModel.update(sPath, oLevelUpdate, {
                        success: function (oRetrievedResult) {
                            var oLevelHistoryEntity = {
                                USER_EMAIL: this.loggedUser,
                                DESCIRPTION: "Was not active since: " + mostRecentDate.toDateString(),
                                OLD_LEVEL: this.oldLevel,
                                NEW_LEVEL: this.newLevel
                            };

                            oModel.create("/LEVEL_HISTORY", oLevelHistoryEntity, {
                                success: function () {
                                    localStorage.setItem(lastInactiveDateKey, mostRecentDate.toISOString());
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
                } else {
                    console.log("Points for this inactivity period have already been subtracted.");
                }

            } catch (error) {
                console.error("Failed to fetch level data: ", error);
            }
        }

    });
});





