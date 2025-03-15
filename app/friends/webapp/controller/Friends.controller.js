sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    'friends/model/formatter',
],
    function (Controller, JSONModel, MessageBox, MessageToast, formatter) {
        "use strict";

        return Controller.extend("friends.controller.Friends", {
            formatter: formatter,

            onInit: function () {
                if (window.location.href.includes("applicationstudio")){
                    this.loggedUser = "deea.laslo@yahoo.com";
                }else{
                    this.loggedUser = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                }
                this.oRouter = this.getOwnerComponent().getRouter();
                this.oRouter.getRoute("friends").attachPatternMatched(this._onRouteMatched, this);
            },

            _onRouteMatched: function () {
                this.readFriendsOfUser().then(() => {
                    this.readPendingRequests().then(() => {
                        this.readUsers();
                        this.readNotifications();
                    });
                });
            },

            extractUsername: function(email) {
                return email.split('@')[0];
            },

            readFriendsOfUser: function () {
                return new Promise((resolve, reject) => {
                    var oModel = this.getOwnerComponent().getModel("catalogV2");
                    var sPath = "/FRIENDS";

                    var oEmailFilter1 = new sap.ui.model.Filter({
                        path: "REQUESTER_EMAIL",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: this.loggedUser
                    });

                    var oEmailFilter2 = new sap.ui.model.Filter({
                        path: "RECEIVER_EMAIL",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: this.loggedUser
                    });

                    var oStatusFilter = new sap.ui.model.Filter({
                        path: "STATUS",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: "Approved"
                    });

                    var oEmailOrFilter = new sap.ui.model.Filter({
                        filters: [oEmailFilter1, oEmailFilter2],
                        and: false
                    });

                    oModel.read(sPath, {
                        filters: [oEmailOrFilter, oStatusFilter],
                        success: (oData) => {
                            var displayFriends = oData.results.map(friend => {
                                return {
                                    ID: friend.ID,
                                    FRIEND_EMAIL: (friend.REQUESTER_EMAIL === this.loggedUser) ? this.extractUsername(friend.RECEIVER_EMAIL) : this.extractUsername(friend.REQUESTER_EMAIL),
                                    FULL_EMAIL: (friend.REQUESTER_EMAIL === this.loggedUser) ? friend.RECEIVER_EMAIL : friend.REQUESTER_EMAIL,
                                    SINCE: friend.SINCE,
                                };
                            });
                            displayFriends.sort((a, b) => new Date(b.SINCE) - new Date(a.SINCE));
                            var displayFriendsModel = new JSONModel({ Friends: displayFriends, friendsCount: displayFriends.length });
                            this.getView().setModel(displayFriendsModel, "friends");
                            resolve();
                        },
                        error: function () {
                            MessageToast.show("Error fetching friends.");
                            reject();
                        }
                    });

                });
            },

            readPendingRequests: function () {
                return new Promise((resolve, reject) => {
                    var oModel = this.getOwnerComponent().getModel("catalogV2");
                    var sPath = "/FRIENDS";

                    var oRequesterFilter = new sap.ui.model.Filter({
                        path: "REQUESTER_EMAIL",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: this.loggedUser
                    });

                    var oStatusFilter = new sap.ui.model.Filter({
                        path: "STATUS",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: "Pending"
                    });

                    oModel.read(sPath, {
                        filters: [oRequesterFilter, oStatusFilter],
                        success: (oData) => {
                            var pendingRequests = oData.results.map(request => {
                                return {
                                    ID: request.ID,
                                    RECEIVER_EMAIL: this.extractUsername(request.RECEIVER_EMAIL),
                                    FULL_RECEIVER_EMAIL: request.RECEIVER_EMAIL
                                };
                            });
                            var oPendingRequestsModel = new JSONModel({ requests: pendingRequests, pendingCount: pendingRequests.length });
                            this.getView().setModel(oPendingRequestsModel, "pendingRequestsModel");
                            resolve();
                        },
                        error: function () {
                            MessageToast.show("Error fetching pending requests.");
                            reject();
                        }
                    });
                });
            },

            readUsers: function () {
                return new Promise((resolve, reject) => {
                    var oModel = this.getOwnerComponent().getModel("catalogV2");
                    var sPath = "/USERS";

                    var oEmailFilter = new sap.ui.model.Filter({
                        path: "EMAIL",
                        operator: sap.ui.model.FilterOperator.NE,
                        value1: this.loggedUser
                    });

                    oModel.read(sPath, {
                        filters: [oEmailFilter],
                        success: (oData) => {
                            var aUsers = this.processeUsers(oData.results);

                            var oFriendsModel = this.getView().getModel("friends");
                            var aFriends = oFriendsModel.getData().Friends;

                            var oPendingRequestsModel = this.getView().getModel("pendingRequestsModel");
                            var aPendingRequests = oPendingRequestsModel.getData().requests;

                            var aFilteredUsers = aUsers.filter(user =>
                                !aFriends.some(friend => friend.FULL_EMAIL === user.email) &&
                                !aPendingRequests.some(request => request.FULL_RECEIVER_EMAIL === user.email)
                            );

                            var oUsersModel = new JSONModel({ Users: aFilteredUsers, count: aFilteredUsers.length });
                            this.getView().setModel(oUsersModel, "users");
                            resolve();
                        },
                        error: function () {
                            MessageToast.show("Error fetching users.");
                            reject();
                        }
                    });
                });
            },

            readNotifications: function () {
                return new Promise((resolve, reject) => {
                    var oModel = this.getView().getModel("catalogV2");
                    var sPath = "/FRIENDS";

                    var oReceiverFilter = new sap.ui.model.Filter({
                        path: "RECEIVER_EMAIL",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: this.loggedUser
                    });

                    var oStatusFilter = new sap.ui.model.Filter({
                        path: "STATUS",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: "Pending"
                    });

                    oModel.read(sPath, {
                        filters: [oReceiverFilter, oStatusFilter],
                        success: (oData) => {
                            var pendingRequests = oData.results.map(request => {
                                return {
                                    ID: request.ID,
                                    REQUESTER_EMAIL: this.extractUsername(request.REQUESTER_EMAIL),
                                    FULL_REQUESTER_EMAIL: request.REQUESTER_EMAIL
                                };
                            });
                            var oNotificationModel = new JSONModel({ requests: pendingRequests, pendingCount: pendingRequests.length });
                            this.getView().setModel(oNotificationModel, "notificationModel");
                            resolve();
                        },
                        error: function () {
                            MessageToast.show("Error fetching notifications.");
                            reject();
                        }
                    });
                });
            },

            processeUsers: function (aUsers) {
                const aProcessedUsers = [];
                for (let i = 0; i < aUsers.length; i++) {
                    const oUser = aUsers[i];
                    aProcessedUsers.push({
                        email: oUser.EMAIL,
                        username: this.extractUsername(oUser.EMAIL)
                    });
                }
                return aProcessedUsers;
            },

            onAddNewFriend: function () {
                var oView = this.getView();
                var oModel = this.getView().getModel("catalogV2");
                var sToBeFriendEmail = oView.byId("emailInput").getSelectedKey();

                var oBundle = this.getView().getModel("i18n").getResourceBundle();
                var sverificationCombo = oBundle.getText("verificationCombo");
                var sfriendRequestToSent = oBundle.getText("friendRequestToSent");

                if (!sToBeFriendEmail) {
                    MessageToast.show(sverificationCombo);
                    return;
                }

                var oEntity = {
                    REQUESTER_EMAIL: this.loggedUser,
                    RECEIVER_EMAIL: sToBeFriendEmail,
                    STATUS: "Pending",
                }

                oModel.create("/FRIENDS", oEntity, {
                    success: function () {
                        MessageToast.show(sfriendRequestToSent);
                        this.readFriendsOfUser().then(() => {
                            this.readPendingRequests().then(() => {
                                this.readUsers();
                                this.readNotifications();
                            });
                        });
                    }.bind(this),
                    error: function () {
                        MessageToast.show("Error sending friend request.");
                    }
                });
                oView.byId("emailInput").clearSelection();
            },

            onCancelRequest: function (oEvent) {
                var oButton = oEvent.getSource();
                var oContext = oButton.getBindingContext("pendingRequestsModel");
                var oRequest = oContext.getObject();
                var oModel = this.getView().getModel("catalogV2");

                var sPath = "/FRIENDS(guid'" + oRequest.ID + "')";

                var oBundle = this.getView().getModel("i18n").getResourceBundle();
                var sfriendCancelConf = oBundle.getText("friendCancelConf");
                var sfriendCancelEnd = oBundle.getText("friendCancelEnd");

                MessageBox.warning(sfriendCancelConf, {
                    actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.CANCEL,
                    styleClass: "sapUiSizeCompact",
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.YES) {
                            oModel.remove(sPath, {
                                success: function () {
                                    MessageToast.show(sfriendCancelEnd);
                                    this.readFriendsOfUser().then(() => {
                                        this.readPendingRequests().then(() => {
                                            this.readUsers();
                                        });
                                    });
                                }.bind(this),
                                error: function () {
                                    MessageToast.show("Error cancelling request.");
                                }
                            });
                        }
                    }.bind(this)
                });
            },

            onUnfriend: function (oEvent) {
                var oModelC = this.getView().getModel("catalogV2");

                var oContext = oEvent.getSource().getBindingContext("friends");
                var oModel = oContext.getModel();
                var sPath = oContext.getPath();
                var oData = oModel.getProperty(sPath);

                var sId = oData.ID;
                var sPathFriend = "/FRIENDS(guid'" + sId + "')";

                var oBundle = this.getView().getModel("i18n").getResourceBundle();
                var sfriendEnd = oBundle.getText("friendEnd");
                var sfriendEndSuccess = oBundle.getText("friendEndSuccess");

                MessageBox.warning(sfriendEnd, {
                    actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                    styleClass: "sapUiSizeCompact",
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.YES) {
                            oModelC.remove(sPathFriend, {
                                success: function () {
                                    this.readFriendsOfUser().then(() => {
                                        this.readUsers();

                                    });
                                    MessageToast.show(sfriendEndSuccess);

                                }.bind(this),
                                error: function () {
                                    MessageToast.show("Error at ending friendship!");
                                }
                            })
                        }
                    }.bind(this)
                });
            },

            onNotificationSight: function () {
                this.readNotifications().then(() => {
                    this.byId("notificationDialog").open();
                });
            },

            onApproveRequest: function (oEvent) {
                var oButton = oEvent.getSource();
                var oContext = oButton.getBindingContext("notificationModel");
                var oRequest = oContext.getObject();
                var oModel = this.getView().getModel("catalogV2");

                var sPath = "/FRIENDS(guid'" + oRequest.ID + "')";
                var sCurrentDate = new Date();
                var oUpdateData = { STATUS: "Approved", SINCE: sCurrentDate };

                var oBundle = this.getView().getModel("i18n").getResourceBundle();
                var sfriendReqApprove = oBundle.getText("friendReqApprove");

                var sRequesterEmail = oRequest.REQUESTER_EMAIL;
                this.updateLevelHistory(sRequesterEmail);

                oModel.update(sPath, oUpdateData, {
                    success: function () {
                        MessageToast.show(sfriendReqApprove);
                        this.onNotificationSight();
                        this.readFriendsOfUser().then(() => {
                            this.readPendingRequests().then(() => {
                                this.readUsers();
                            });
                        });
                    }.bind(this),
                    error: function () {
                        MessageToast.show("Error approving request.");
                    }
                });
            },

            onDeclineRequest: function (oEvent) {
                var oButton = oEvent.getSource();
                var oContext = oButton.getBindingContext("notificationModel");
                var oRequest = oContext.getObject();
                var oModel = this.getView().getModel("catalogV2");

                var oBundle = this.getView().getModel("i18n").getResourceBundle();
                var sfriendDeclineConf = oBundle.getText("friendDeclineConf");
                var sfriendDeclineEnd = oBundle.getText("friendDeclineEnd");

                var sPath = "/FRIENDS(guid'" + oRequest.ID + "')";
                MessageBox.warning(sfriendDeclineConf, {
                    actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.CANCEL,
                    styleClass: "sapUiSizeCompact",
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.YES) {
                            oModel.remove(sPath, {
                                success: function () {
                                    MessageToast.show(sfriendDeclineEnd);
                                    this.onNotificationSight();
                                }.bind(this),
                                error: function () {
                                    MessageToast.show("Error declining request.");
                                }
                            });
                        }
                    }.bind(this)
                });
            },

            onCloseNotificationDialog: function () {
                this.byId("notificationDialog").close();
            },

            onSeeFriendsWorkouts: function (oEvent) {
                var oContext = oEvent.getSource().getBindingContext("friends");
                var oModel = oContext.getModel();
                var sPath = oContext.getPath();
                var oData = oModel.getProperty(sPath);
            
                var sFriendEmail = oData.FULL_EMAIL;
                var sFriendUsername = oData.FRIEND_EMAIL;
                var sTitle = sFriendUsername + "'s workouts";
                var oBundle = this.getView().getModel("i18n").getResourceBundle();
                var sfriendHasNoWorkouts = oBundle.getText("friendHasNoWorkouts",[sFriendUsername]);

                this.onGenerateWorkoutsModel(sFriendEmail);
            
                setTimeout(() => { 
                    var oProcessedWorkoutsModel = this.getView().getModel("processedWorkouts");
                    var aWorkouts = oProcessedWorkoutsModel.getData().Workouts;
            
                    if (!aWorkouts.length || aWorkouts.every(workout => !workout.exercises.length)) {
                        MessageBox.information(sfriendHasNoWorkouts);
                        return;
                    }
            
                    var aFilteredWorkouts = aWorkouts.filter(workout => workout.exercises.length > 0);
            
                    var oCarousel = new sap.m.Carousel({
                        pages: aFilteredWorkouts.map(workout => new sap.m.VBox({
                            items: [
                                new sap.m.HBox({
                                    items: [
                                        new sap.m.Label({ text: "Name: ", design: "Bold" }),
                                        new sap.m.Text({ text: workout.name })
                                    ]
                                }),
                                new sap.m.HBox({
                                    items: [
                                        new sap.m.Label({ text: "Place: ", design: "Bold" }),
                                        new sap.m.Text({ text: workout.place })
                                    ]
                                }),
                                new sap.m.HBox({
                                    items: [
                                        new sap.m.Label({ text: "Type: ", design: "Bold" }),
                                        new sap.m.Text({ text: workout.type })
                                    ]
                                }),
                                new sap.m.Label({ text: "Exercises:", design: "Bold" }),
                                ...workout.exercises.map(exercise => new sap.m.VBox({
                                    items: [
                                        new sap.m.Label({ text: exercise.sPairNameGrouped, design: "Bold" }),
                                        new sap.m.List({
                                            items: exercise.details.map(detail => new sap.m.StandardListItem({
                                                title: "Reps: " + detail.reps + ", Weight: " + detail.weight
                                            }))
                                        })
                                    ]
                                }).addStyleClass("sapUiTinyMargin"))
                            ]
                        }).addStyleClass("sapUiResponsiveMargin"))
                    });
            
                    var oDialog = new sap.m.Dialog({
                        title:sTitle,
                        contentWidth: "500px",
                        contentHeight: "400px",
                        verticalScrolling: true,
                        content: [oCarousel],
                        endButton: new sap.m.Button({
                            text: "Close",
                            press: function () {
                                oDialog.close();
                            }
                        })
                    }).addStyleClass("sapUiContentPadding");
            
                    this.getView().addDependent(oDialog);
                    oDialog.open();
                }, 500);  
            },

            onGenerateWorkoutsModel: function (sFriendEmail) {
                var oModel = this.getOwnerComponent().getModel("catalogV2");
                var sEmail = sFriendEmail;
                var sPath = "/WORKOUTS";
    
                var oEmailFilter = new sap.ui.model.Filter({
                    path: "USER_EMAIL",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: sEmail
                });
    
                oModel.read(sPath, {
                    urlParameters: {
                        "$expand": "USER,EXERCISES/EXERCISE/EXERCISE,EXERCISES/EXERCISE/FITNESS_MACHINE,TYPE,PLACE"
                    },
                    filters: [oEmailFilter],
                    success: (oData) => {
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

            updateLevelHistory: async function (sFriendName) {
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
                    this.newLevel = this.oldLevel + 2;
                    
                    var oLevelUpdate = {
                        LEVEL: this.newLevel
                    }
                    oModel.update(sPath, oLevelUpdate, {
                        success: function (oRetrievedResult) {
                            
                            var oLevelHistoryEntity  = {
                                USER_EMAIL: this.loggedUser,
                                DESCIRPTION: "Becoming friends with: " + sFriendName,
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
    });
