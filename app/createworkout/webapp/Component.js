/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/f/library",
	"sap/f/FlexibleColumnLayoutSemanticHelper",
    "createworkout/model/models",
    ],
    
    function (UIComponent, JSONModel, library, FlexibleColumnLayoutSemanticHelper,models) {
        "use strict";
        var LayoutType = library.LayoutType;
        return UIComponent.extend("createworkout.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                
                UIComponent.prototype.init.apply(this, arguments);
                
                this.getRouter().initialize();
                
                var oModel = new JSONModel();
			    this.setModel(oModel, "fclModel");

                // var oModel = new JSONModel({
                //     "sections": [
                //         {
                //             "tableName": "Navigate to section 0",
                //             "sectionName": "Section 0"
                //         },
                //         {
                //             "tableName": "Navigate to section 1",
                //             "sectionName": "Section 1"
                //         },
                //         {
                //             "tableName": "Navigate to section 2",
                //             "sectionName": "Section 2"
                //         },
                //         {
                //             "tableName": "Navigate to section 3",
                //             "sectionName": "Section 3"
                //         },
                //         {
                //             "tableName": "Navigate to section 4",
                //             "sectionName": "Section 4"
                //         },
                //         {
                //             "tableName": "Navigate to section 5",
                //             "sectionName": "Section 5"
                //         },
                //         {
                //             "tableName": "Navigate to section 6",
                //             "sectionName": "Section 6"
                //         },
                //         {
                //             "tableName": "Navigate to section 7",
                //             "sectionName": "Section 7"
                //         },
                //         {
                //             "tableName": "Navigate to section 8",
                //             "sectionName": "Section 8"
                //         },
                //         {
                //             "tableName": "Navigate to section 9",
                //             "sectionName": "Section 9"
                //         },
                //         {
                //             "tableName": "Navigate to section 10",
                //             "sectionName": "Section 10"
                //         },
                //         {
                //             "tableName": "Navigate to section 11",
                //             "sectionName": "Section 11"
                //         }
                //     ]
                // }
                // );
                
                // this.setModel(oModel, "products");

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            },

            setFcl: function (oFCL) {
                this.oFCL = oFCL;
            },

            // getFCL: function () {
            //     return this.getRootControl().byId("fcl");
            // },
            /**
             * Returns an instance of the semantic helper
             * @returns {sap.f.FlexibleColumnLayoutSemanticHelper} An instance of the semantic helper
             */
            getHelper: function () {
                var oSettings = {
                        defaultTwoColumnLayoutType: LayoutType.TwoColumnsBeginExpanded,
                        defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
                        maxColumnsCount: 1
                    };
    
                return FlexibleColumnLayoutSemanticHelper.getInstanceFor(this.oFCL, oSettings);
            }
        });
    }
);