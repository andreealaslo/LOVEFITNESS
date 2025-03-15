/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "aplicatieaparate/model/models",
    "sap/ui/model/json/JSONModel",
    "sap/f/library",
    "sap/f/FlexibleColumnLayoutSemanticHelper"
],
    function (UIComponent, Device, models, JSONModel, library, FlexibleColumnLayoutSemanticHelper) {
        "use strict";
        var LayoutType = library.LayoutType;
        return UIComponent.extend("aplicatieaparate.Component", {
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

                // enable routing
                this.getRouter().initialize();

                this.setModel(new JSONModel());

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            },
            getHelper: function () {
                var oFCL = this.getRootControl().byId("fcl"),
                    oParams = new URLSearchParams(window.location.search),
                    oSettings = {
                        defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
                        defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
                        maxColumnsCount: oParams.get("max")
                    };
    
                return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
            }
        });
    }
);