sap.ui.define([
    "statisticshistory/controller/BaseController",
    'sap/ui/unified/CalendarLegendItem',
    'sap/ui/unified/DateTypeRange',
    'sap/ui/unified/library',
    'sap/ui/core/date/UI5Date',
    'sap/m/Popover',
    'sap/m/VBox',
    'sap/m/Text',
    'sap/ui/model/json/JSONModel',
    'sap/viz/ui5/data/FlattenedDataset',
    'sap/viz/ui5/controls/common/feeds/FeedItem'],
    function (BaseController, CalendarLegendItem, DateTypeRange, unifiedLibrary, UI5Date, Popover, VBox, Text, JSONModel, FlattenedDataset, FeedItem) {
        "use strict";
        var CalendarDayType = unifiedLibrary.CalendarDayType;

        var oPageController = BaseController.extend("statisticshistory.controller.StartPage", {
            onInit: function () {
                if (window.location.href.includes("applicationstudio")){
                    this.loggedUser = "deea.laslo@yahoo.com";
                }else{
                    this.loggedUser = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                }   
                this._oPopover = new Popover({
                    title: "Workout Details",
                    contentWidth: "300px",
                    placement: sap.m.PlacementType.Auto,
                    content: new VBox({
                        items: [
                            new Text({ id: this.createId("workoutName"), text: "Name: " }),
                            new Text({ id: this.createId("workoutType"), text: "Type: " }),
                            new Text({ id: this.createId("workoutPlace"), text: "Place: " }),
                            new Text({ id: this.createId("workoutTime"), text: "Time: " })
                        ]
                    })
                });

                this.getOwnerComponent().getModel("catalogV2").read("/WORKOUT_HISTORY", {
                    urlParameters: {
                        "$expand": "WORKOUT/TYPE,WORKOUT/PLACE"
                    },
                    success: (oData) => {
                        console.log(oData.results);
                        var aHistoryOfWorkouts = this.processeHistory(oData.results);
                        var oHistoryModel = new sap.ui.model.json.JSONModel({ Workouts: aHistoryOfWorkouts, count: oData.results.length });
                        this.getOwnerComponent().setModel(oHistoryModel, "historyWorkouts");
                        this.initializeSpecialDays();

                        var oVizFrame = this.getView().byId(this._constants.vizFrame.id);
                        this._updateVizFrame(oVizFrame, oHistoryModel, "line");
                    },
                    error: function () {
                        sap.m.MessageToast.show("Error fetching workout data.");
                    }
                });
            },

            _constants: {
                sampleName: "statisticshistory/controller",
                vizFrame: {
                    id: "chartContainerVizFrame"
                }
            },

            _updateVizFrame: function (vizFrame, historyModel, chartType) {
                vizFrame.removeAllFeeds();
                vizFrame.destroyDataset();

                var oDataset, oChartModel;
                var aWorkouts = historyModel.getData().Workouts;
                var oChartData = this._countWorkoutsPerMonth(aWorkouts);

                if (chartType === "line") {
                    oDataset = new FlattenedDataset({
                        dimensions: [{
                            name: 'Month',
                            value: "{Month}"
                        }],
                        measures: [{
                            group: 1,
                            name: "Workouts",
                            value: "{Total}"
                        }],
                        data: {
                            path: "/Months"
                        }
                    });

                    oChartModel = new JSONModel(oChartData);

                    vizFrame.setVizProperties({
                        plotArea: {
                            dataLabel: {
                                visible: true
                            },
                            colorPalette: ["#0000FF"]
                        },
                        title: {
                            visible: true,
                            text: "Total Workout times per month"
                        }
                    });

                } else if (chartType === "stacked_column") {
                    oDataset = new FlattenedDataset({
                        dimensions: [{
                            name: 'Month',
                            value: "{Month}"
                        }],
                        measures: [{
                            group: 1,
                            name: "Lower Body",
                            value: "{Lower Body}"
                        }, {
                            group: 1,
                            name: "Upper Body",
                            value: "{Upper Body}"
                        }, {
                            group: 1,
                            name: "Full Body",
                            value: "{Full Body}"
                        }],
                        data: {
                            path: "/Months"
                        }
                    });

                    oChartModel = new JSONModel(oChartData);

                    vizFrame.setVizProperties({
                        plotArea: {
                            dataLabel: {
                                visible: true
                            },
                            colorPalette: ["#FF0000", "#00FF00", "#0000FF"] // Custom colors
                        },
                        title: {
                            visible: true,
                            text: "Workouts Per Month by Type"
                        }
                    });

                } else if (chartType === "bar") {
                    oDataset = new FlattenedDataset({
                        dimensions: [{
                            name: 'Month',
                            value: "{Month}"
                        }],
                        measures: [{
                            group: 1,
                            name: "Hours",
                            value: "{Hours}"
                        }],
                        data: {
                            path: "/Months"
                        }
                    });

                    oChartModel = new JSONModel(oChartData);

                    vizFrame.setVizProperties({
                        plotArea: {
                            dataLabel: {
                                visible: true
                            },
                            colorPalette: ["#0000FF"]
                        },
                        title: {
                            visible: true,
                            text: "Total Workout Hours Per Month"
                        }
                    });
                }

                vizFrame.setModel(oChartModel);
                vizFrame.setDataset(oDataset);

                this._addFeedItems(vizFrame, chartType === "line" ? [
                    { 'uid': "primaryValues", 'type': "Measure", 'values': ["Workouts"] },
                    { 'uid': "axisLabels", 'type': "Dimension", 'values': ["Month"] }
                ] : chartType === "stacked_column" ? [
                    { 'uid': "primaryValues", 'type': "Measure", 'values': ["Lower Body", "Upper Body", "Full Body"] },
                    { 'uid': "axisLabels", 'type': "Dimension", 'values': ["Month"] }
                ] : [
                    { 'uid': "primaryValues", 'type': "Measure", 'values': ["Hours"] },
                    { 'uid': "axisLabels", 'type': "Dimension", 'values': ["Month"] }
                ]);

                vizFrame.setVizType(chartType);
            },

            _addFeedItems: function (vizFrame, feedItems) {
                for (var i = 0; i < feedItems.length; i++) {
                    vizFrame.addFeed(new FeedItem(feedItems[i]));
                }
            },

            onChartTypeChange: function (oEvent) {
                var selectedKey = oEvent.getSource().getSelectedKey();
                var oVizFrame = this.getView().byId(this._constants.vizFrame.id);
                var oHistoryModel = this.getOwnerComponent().getModel("historyWorkouts");
                this._updateVizFrame(oVizFrame, oHistoryModel, selectedKey);
            },

            initializeSpecialDays: function () {
                var oCal2 = this.byId("calendar2"),
                    oLeg2 = this.byId("legend2"),
                    workoutsModel = this.getOwnerComponent().getModel("historyWorkouts").getData(),
                    workoutColors = {
                        "Lower Body": "#FF0000",
                        "Upper Body": "#00FF00",
                        "Full Body": "#0000FF"
                    },
                    workoutTypes = {
                        "Lower Body": CalendarDayType.Type01,
                        "Upper Body": CalendarDayType.Type02,
                        "Full Body": CalendarDayType.Type03
                    },
                    addedTypes = {};

                if (!workoutsModel || !workoutsModel.Workouts) {
                    return;
                }

                workoutsModel.Workouts.forEach(workout => {
                    let workoutDate = new Date(workout.date);
                    let color = workoutColors[workout.type] || "#FFFFFF";
                    let type = workoutTypes[workout.type] || CalendarDayType.Type00;

                    let dateRange = new DateTypeRange({
                        startDate: workoutDate,
                        type: type,
                        tooltip: "", 
                        color: color
                    });

                    oCal2.addSpecialDate(dateRange);
                    dateRange.data("workoutInfo", workout);

                    if (!addedTypes[workout.type]) {
                        oLeg2.addItem(new CalendarLegendItem({
                            type: type,
                            text: workout.type,
                            color: color
                        }));
                        addedTypes[workout.type] = true;
                    }
                });

                oCal2.attachSelect(this.handleDateSelect.bind(this));
            },

            handleDateSelect: function (oEvent) {
                var oCalendar = oEvent.getSource(),
                    aSelectedDates = oCalendar.getSelectedDates(),
                    oSelectedDate = aSelectedDates.length ? aSelectedDates[0] : null;

                if (oSelectedDate) {
                    var oSelectedStartDate = oSelectedDate.getStartDate();
                    var oSpecialDates = oCalendar.getSpecialDates();

                    oSpecialDates.forEach(function (dateRange) {
                        if (dateRange.getStartDate().toDateString() === oSelectedStartDate.toDateString()) {
                            var workout = dateRange.data("workoutInfo");
                            if (workout) {
                                console.log("Selected workout:", workout);
                                this.byId("workoutName").setText(`Name: ${workout.workoutName}`);
                                this.byId("workoutType").setText(`Type: ${workout.type}`);
                                this.byId("workoutPlace").setText(`Place: ${workout.place}`);
                                this.byId("workoutTime").setText(`Time: ${workout.time}`);
                                this._oPopover.openBy(oCalendar);
                            }
                        }
                    }.bind(this));
                }
            },

            processeHistory: function (oWorkoutsHistory) {
                const aProcessedWorkouts = [];
                for (let i = 0; i < oWorkoutsHistory.length; i++) {
                    const oWorkout = oWorkoutsHistory[i];
                    if(oWorkout.WORKOUT.USER_EMAIL === this.loggedUser){
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
            },

            _countWorkoutsPerMonth: function (aWorkouts) {
                var oMonths = {
                    January: { "Lower Body": 0, "Upper Body": 0, "Full Body": 0, Total: 0, Hours: 0 },
                    February: { "Lower Body": 0, "Upper Body": 0, "Full Body": 0, Total: 0, Hours: 0 },
                    March: { "Lower Body": 0, "Upper Body": 0, "Full Body": 0, Total: 0, Hours: 0 },
                    April: { "Lower Body": 0, "Upper Body": 0, "Full Body": 0, Total: 0, Hours: 0 },
                    May: { "Lower Body": 0, "Upper Body": 0, "Full Body": 0, Total: 0, Hours: 0 },
                    June: { "Lower Body": 0, "Upper Body": 0, "Full Body": 0, Total: 0, Hours: 0 },
                    July: { "Lower Body": 0, "Upper Body": 0, "Full Body": 0, Total: 0, Hours: 0 },
                    August: { "Lower Body": 0, "Upper Body": 0, "Full Body": 0, Total: 0, Hours: 0 },
                    September: { "Lower Body": 0, "Upper Body": 0, "Full Body": 0, Total: 0, Hours: 0 },
                    October: { "Lower Body": 0, "Upper Body": 0, "Full Body": 0, Total: 0, Hours: 0 },
                    November: { "Lower Body": 0, "Upper Body": 0, "Full Body": 0, Total: 0, Hours: 0 },
                    December: { "Lower Body": 0, "Upper Body": 0, "Full Body": 0, Total: 0, Hours: 0 }
                };

                aWorkouts.forEach(function (workout) {
                    var oDate = new Date(workout.date);
                    var sMonth = oDate.toLocaleString('default', { month: 'long' });

                    oMonths[sMonth][workout.type]++;
                    oMonths[sMonth].Total++;

                    var timeParts = workout.time.split(':');
                    var hours = 0, minutes = 0, seconds = 0;

                    if (timeParts.length === 3) {
                        hours = parseInt(timeParts[0], 10);
                        minutes = parseInt(timeParts[1], 10);
                        seconds = parseInt(timeParts[2], 10);
                    } else if (timeParts.length === 2) {
                        minutes = parseInt(timeParts[0], 10);
                        seconds = parseInt(timeParts[1], 10);
                    }

                    var totalHours = hours + minutes / 60 + seconds / 3600;
                    oMonths[sMonth].Hours += totalHours;
                });

                var aChartData = { Months: [] };
                for (var sMonth in oMonths) {
                    aChartData.Months.push({
                        Month: sMonth,
                        "Lower Body": oMonths[sMonth]["Lower Body"],
                        "Upper Body": oMonths[sMonth]["Upper Body"],
                        "Full Body": oMonths[sMonth]["Full Body"],
                        "Total": oMonths[sMonth].Total,
                        "Hours": oMonths[sMonth].Hours
                    });
                }
                return aChartData;
            },

            getRouter: function () {
                return this.getOwnerComponent().getRouter();
            },

            onChallengeButtonPress: function(){
                this.getRouter().navTo("challenges");
            }
        });

        return oPageController;
    });
