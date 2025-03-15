sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	'statisticshistory/model/formatter',
], function (JSONModel, Controller, MessageBox, MessageToast, formatter) {
	"use strict";


	return Controller.extend("statisticshistory.controller.Challenges", {
		formatter: formatter,

		onInit: function () {
			if (window.location.href.includes("applicationstudio")){
                this.loggedUser = "deea.laslo@yahoo.com";
            }else{
                this.loggedUser = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
            }   
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("challenges").attachPatternMatched(this._onRouteMatched, this);
			var visibilityModel = new JSONModel();
			this.getView().setModel(visibilityModel, "visibility");
			this.readChallenges().then(() => {
				this.readAllChallenges();
			});

		},

		onGenerateHistoryModel: function () {
			return new Promise((resolve, reject) => {
				var oModel = this.getOwnerComponent().getModel("catalogV2");
				var sPath = "/WORKOUT_HISTORY";

				oModel.read(sPath, {
					urlParameters: {
						"$expand": "WORKOUT/TYPE,WORKOUT/PLACE"
					},
					success: (oData) => {
						console.log(oData);
						var aHistoryOfWorkouts = this.processeHistory(oData.results);
						var oHistoryModel = new JSONModel(aHistoryOfWorkouts);
						console.log("challenges: " + oHistoryModel.getData());
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
			let numberUpperBody = 0;
			let numberFullBody = 0;
			let numberLowerBody = 0;

			for (let i = 0; i < oWorkoutsHistory.length; i++) {
				const oWorkout = oWorkoutsHistory[i];
				const workoutType = oWorkout.WORKOUT.TYPE.TYPE;

				// Count the number of workouts based on type
				if (workoutType === "Upper Body") {
					numberUpperBody++;
				} else if (workoutType === "Full Body") {
					numberFullBody++;
				} else if (workoutType === "Lower Body") {
					numberLowerBody++;
				}

				aProcessedWorkouts.push({
					date: oWorkout.DATE,
					time: oWorkout.TIME,
					workoutName: oWorkout.WORKOUT.NAME,
					place: oWorkout.WORKOUT.PLACE.PLACE,
					type: workoutType,
				});
			}

			return {
				Workouts: aProcessedWorkouts,
				count: oWorkoutsHistory.length,
				numberUpperBody: numberUpperBody,
				numberFullBody: numberFullBody,
				numberLowerBody: numberLowerBody
			};
		},

		_onRouteMatched: function () {
			this.onGenerateHistoryModel().then(() => {
				this.readChallenges().then(() => {
					this.readAllChallenges();
					this.checkPerformanceChallenges();
				});
			});
		},

		checkPerformanceChallenges: function () {
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var schallengeCompleteTitle = oBundle.getText("challengeCompleteTitle");
			this.workoutsModel = this.getView().getModel("historyWorkouts").getData();
			var challengem = this.getView().getModel("challenges").getData().Challenges;
			for (let i = 0; i < challengem.length; i++) {
				var sUserChallengeId = challengem[i].userChallenge_id;
				var sChallengeId = challengem[i].challenge_id;
				var sDescription = challengem[i].description;
				var sstartDate = this.formatter.formatDate(challengem[i].startDate);
				if (sDescription === "Perform 15 lower body workouts") {
					var iNumber = this.workoutsModel.numberLowerBody;
					if (iNumber >= 15) {
						var array = this._perform(sUserChallengeId, sChallengeId, sDescription);
						var status = array[1];
						var endDate = this.formatter.formatDate(array[0]);

						var challengeCompletePart1 = oBundle.getText("challengeCompletePart1", [sDescription]);
						var sdetailsStatus = oBundle.getText("detailsStatus", [status]);
						var sstartDateStatus = oBundle.getText("startDateStatus", [sstartDate]);
						var sendDateStatus = oBundle.getText("endDateStatus", [endDate]);
						var duration = this.calculateDurationChallenge(sstartDate, endDate);
						var durationStatus = oBundle.getText("durationStatus", [duration]);

						MessageBox.show(challengeCompletePart1 + "\n" + sdetailsStatus + "\n" + sstartDateStatus + "\n" + sendDateStatus + "\n" + durationStatus, {
							icon: MessageBox.Icon.SUCCESS,
							title: schallengeCompleteTitle,
							actions: [MessageBox.Action.OK],
							styleClass: "customMessageBoxWidthCompleteChallenge"
						});
					}
				}
				else if (sDescription === "Perform 15 full body workouts") {
					var iNumber = this.workoutsModel.numberFullBody;
					if (iNumber >= 3) {
						var array = this._perform(sUserChallengeId, sChallengeId, sDescription);
						var status = array[1];
						var endDate = this.formatter.formatDate(array[0]);

						var challengeCompletePart1 = oBundle.getText("challengeCompletePart1", [sDescription]);
						var sdetailsStatus = oBundle.getText("detailsStatus", [status]);
						var sstartDateStatus = oBundle.getText("startDateStatus", [sstartDate]);
						var sendDateStatus = oBundle.getText("endDateStatus", [endDate]);
						var duration = this.calculateDurationChallenge(sstartDate, endDate);
						var durationStatus = oBundle.getText("durationStatus", [duration]);

						MessageBox.show(challengeCompletePart1 + "\n\n" + sdetailsStatus + "\n" + sstartDateStatus + "\n" + sendDateStatus + "\n" + durationStatus, {
							icon: MessageBox.Icon.SUCCESS,
							title: schallengeCompleteTitle,
							actions: [MessageBox.Action.OK],
							styleClass: "customMessageBoxWidthCompleteChallenge"
						});
					}

				}
			}

		},

		_perform: function (sUserChallengeId, sChallengeId, sDescription) {
			var oModelC = this.getView().getModel("catalogV2");
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sstatusDone = oBundle.getText("statusDone");
			var sPathUserChallenge = "/USER_CHALLENGES(guid'" + sUserChallengeId + "')";
			var oCurrentDate = new Date();
			var oEntity = {
				STATUS: sstatusDone,
				END_DATE: oCurrentDate
			}
			this.updateLevelHistory(sDescription);
			oModelC.update(sPathUserChallenge, oEntity, {
				success: function () {
					this.readChallenges().then(() => {
						this.readAllChallenges();
					});
				}.bind(this),
				error: function () {
					MessageToast.show("fail");
				}
			});

			this._updateModels(sUserChallengeId, sChallengeId);
			return [oCurrentDate, sstatusDone];

		},

		calculateDurationChallenge: function (startDate, endDate) {
			var start = new Date(startDate).getTime();
			var end = new Date(endDate).getTime();
			var duration = end - start;

			var seconds = Math.floor((duration / 1000) % 60);
			var minutes = Math.floor((duration / (1000 * 60)) % 60);
			var hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
			var days = Math.floor(duration / (1000 * 60 * 60 * 24));

			var durationString = "";

			if (days > 0) {
				durationString += days + (days === 1 ? " day" : " days");
			}
			if (hours > 0) {
				if (durationString !== "") durationString += ", ";
				durationString += hours + (hours === 1 ? " hour" : " hours");
			}
			if (minutes > 0) {
				if (durationString !== "") durationString += ", ";
				durationString += minutes + (minutes === 1 ? " minute" : " minutes");
			}
			if (seconds > 0 || durationString === "") { // Show seconds if no other time units are present
				if (durationString !== "") durationString += " and ";
				durationString += seconds + (seconds === 1 ? " second" : " seconds");
			}

			return durationString;
		},

		readChallenges: function () {
			return new Promise((resolve, reject) => {
				var oModel = this.getOwnerComponent().getModel("catalogV2");
				var sPath = "/USER_CHALLENGES";

				var oEmailFilter = new sap.ui.model.Filter({
					path: "USER_EMAIL",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: this.loggedUser
				});

				var oStatusFilter = new sap.ui.model.Filter({
					path: "STATUS",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: "In progress"
				});

				oModel.read(sPath, {
					filters: [oEmailFilter, oStatusFilter],
					urlParameters: {
						"$expand": "CHALLENGE"
					},
					success: (oData) => {
						var aChallenges = this.processeChallenges(oData.results);
						var oChallengesModel = new JSONModel({ Challenges: aChallenges, count: oData.results.length });
						this.getView().setModel(oChallengesModel, "challenges");
						resolve();
					},
					error: function () {
						MessageToast.show("Error fetching user challenges.");
						reject();
					}
				});
			});
		},

		processeChallenges: function (aChallenges) {
			const aProcessedChallenges = [];
			for (let i = 0; i < aChallenges.length; i++) {
				const oChallenge = aChallenges[i];
				aProcessedChallenges.push({
					challenge_id: oChallenge.CHALLENGE_ID,
					userChallenge_id: oChallenge.ID,
					description: oChallenge.CHALLENGE.DESCRIPTION,
					status: oChallenge.STATUS,
					startDate: oChallenge.createdAt,
					endDate: oChallenge.END_DATE,
				});
			}
			aProcessedChallenges.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
			return aProcessedChallenges;
		},

		readAllChallenges: function () {
			var oModel = this.getOwnerComponent().getModel("catalogV2");
			var userChallenges = this.getView().getModel("challenges").getData().Challenges;
			var userChallengeIds = userChallenges.map(challenge => challenge.challenge_id);

			oModel.read("/CHALLENGES", {
				success: (oData) => {
					var displayAllChallengesData = oData.results.map(challenge => {
						return {
							ID: challenge.ID,
							DESCRIPTION: challenge.DESCRIPTION,
							visibility: !userChallengeIds.includes(challenge.ID)
						};
					});
					var displayAllChallengesModel = new JSONModel(displayAllChallengesData);
					this.getView().setModel(displayAllChallengesModel, "displayAllChallenges");
				},
				error: function () {
					MessageToast.show("Error fetching all challenges.");
				}
			});
		},

		onPerformChallenge: function () {
			var oModel = this.getView().getModel("catalogV2");
			var oTable = this.getView().byId("allChallengesTable");
			var aSelectedItems = oTable.getSelectedItems();

			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sVerificationChallenge = oBundle.getText("verificationChallenge");
			var sperformChallengeSuccess = oBundle.getText("performChallengeSuccess");
			var sperformChallengeFail = oBundle.getText("performChallengeFail");
			var sstatusInProgress = oBundle.getText("statusInProgress");

			if (aSelectedItems.length === 0) {
				MessageToast.show(sVerificationChallenge);
				return;
			}

			var sChallengeID = aSelectedItems[0].getBindingContext("displayAllChallenges").getProperty("ID");

			var oEntity = {
				CHALLENGE_ID: sChallengeID,
				USER_EMAIL: this.loggedUser,
				STATUS: sstatusInProgress,
			};

			oModel.create("/USER_CHALLENGES", oEntity, {
				success: function () {
					MessageToast.show(sperformChallengeSuccess);
					this.readChallenges().then(() => {
						this.readAllChallenges();
					});
				}.bind(this),
				error: function () {
					MessageToast.show(sperformChallengeFail);
				}
			});

			var displayAllChallengesModel = this.getView().getModel("displayAllChallenges");
			var displayAllChallengesData = displayAllChallengesModel.getData();
			var selectedChallenge = displayAllChallengesData.find(challenge => challenge.ID === sChallengeID);
			if (selectedChallenge) {
				selectedChallenge.visibility = false;
			}
			displayAllChallengesModel.setData(displayAllChallengesData);
			displayAllChallengesModel.refresh(true);
		},

		onStopChallenge: function (oEvent) {
			var oModelC = this.getView().getModel("catalogV2");

			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sstatusStopped = oBundle.getText("statusStopped");
			var sconfirmationStopChallenge = oBundle.getText("confirmationStopChallenge");
			var sstopChallengeFail = oBundle.getText("stopChallengeFail");
			var sfirstPartStopInfo = oBundle.getText("firstPartStopInfo");
			var ssecondPartStopInfo = oBundle.getText("secondPartStopInfo");

			var oContext = oEvent.getSource().getBindingContext("challenges");
			var oModel = oContext.getModel();
			var sPath = oContext.getPath();
			var oData = oModel.getProperty(sPath);
			var sUserChallengeId = oData.userChallenge_id;
			var sChallengeId = oData.challenge_id;
			var sChallengeDescription = oData.description;
			var sstoppingTitle = oBundle.getText("stoppingTitle", [sChallengeDescription]);

			var sPathUserChallenge = "/USER_CHALLENGES(guid'" + sUserChallengeId + "')";
			var oCurrentDate = new Date();

			var oEntity = {
				STATUS: sstatusStopped,
				END_DATE: oCurrentDate
			}

			MessageBox.warning(sconfirmationStopChallenge, {
				actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
				styleClass: "sapUiSizeCompact",
				onClose: function (sAction) {
					if (sAction === MessageBox.Action.YES) {
						oModelC.update(sPathUserChallenge, oEntity, {
							success: function () {
								this.readChallenges().then(() => {
									this.readAllChallenges();
								});
							}.bind(this),
							error: function () {
								MessageToast.show(sstopChallengeFail);
							}
						});

						this._updateModels(sUserChallengeId, sChallengeId);

						MessageBox.show(sfirstPartStopInfo + "\n" + ssecondPartStopInfo, {
							icon: MessageBox.Icon.INFORMATION,
							title: sstoppingTitle,
							actions: [MessageBox.Action.OK],
							styleClass: "customMessageBoxWidthStopped"
						});
					}
				}.bind(this)
			});
		},

		_updateModels: function (sUserChallengeId, sChallengeId) {
			var oChallengesModel = this.getView().getModel("challenges");
			var aChallenges = oChallengesModel.getData().Challenges;
			var aUpdatedChallenges = aChallenges.filter(challenge => challenge.userChallenge_id !== sUserChallengeId);
			oChallengesModel.setData({ Challenges: aUpdatedChallenges });

			var oDisplayAllChallengesModel = this.getView().getModel("displayAllChallenges");
			var aDisplayAllChallengesData = oDisplayAllChallengesModel.getData();
			var oStoppedChallenge = aDisplayAllChallengesData.find(challenge => challenge.ID === sChallengeId);
			if (oStoppedChallenge) {
				oStoppedChallenge.visibility = true;
			}
			oDisplayAllChallengesModel.setData(aDisplayAllChallengesData);
			oDisplayAllChallengesModel.refresh(true);
		},

		onPressDetails: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("challenges");
			var oModel = oContext.getModel();
			var sPath = oContext.getPath();
			var oData = oModel.getProperty(sPath);

			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sdetailsStatus = oBundle.getText("detailsStatus", [oData.status]);

			var sFormattedDate = this.formatter.formatDate(oData.startDate);
			var sstartDateStatus = oBundle.getText("startDateStatus", [sFormattedDate]);

			MessageBox.show(sdetailsStatus + "\n\n" + sstartDateStatus, {
				icon: MessageBox.Icon.INFORMATION,
				title: oData.description,
				actions: [MessageBox.Action.OK],
				styleClass: "customMessageBoxWidth"
			}
			);
		},

		onChallengesHistory: function () {
			var oModel = this.getOwnerComponent().getModel("catalogV2");
			var sPath = "/USER_CHALLENGES";

			var oEmailFilter = new sap.ui.model.Filter({
				path: "USER_EMAIL",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.loggedUser
			});

			var oStatusFilter = new sap.ui.model.Filter({
				path: "STATUS",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: "Stopped",
			});

			var oStatusFilter1 = new sap.ui.model.Filter({
				path: "STATUS",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: "Done"
			});

			oModel.read(sPath, {
				filters: [oEmailFilter, oStatusFilter, oStatusFilter1],
				urlParameters: {
					"$expand": "CHALLENGE"
				},
				success: (oData) => {
					var aChallenges = this.processeChallenges(oData.results);
					var oChallengesModel = new JSONModel({ Challenges: aChallenges, count: oData.results.length });
					oChallengesModel.getData().Challenges.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
					this.getView().setModel(oChallengesModel, "challengesHistory");
					this._openChallengesHistoryDialog();
				},
				error: function () {
					MessageToast.show("Error fetching user challenges.");
				}
			});
		},

		_openChallengesHistoryDialog: function () {
			if (!this._challengesHistoryDialog) {
				this._challengesHistoryDialog = this.byId("challengesHistoryDialog");
			}
			this._challengesHistoryDialog.open();
		},

		onCloseHistoryDialog: function () {
			if (this._challengesHistoryDialog) {
				this._challengesHistoryDialog.close();
			}
		},

		updateLevelHistory: async function (sDescriptionChallenge) {
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
							DESCIRPTION: "Completed challenge: " + sDescriptionChallenge,
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

