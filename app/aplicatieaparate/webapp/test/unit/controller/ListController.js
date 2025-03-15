sap.ui.define([
    "sap/ui/thirdparty/sinon",
    "sap/ui/thirdparty/sinon-qunit",
    "aplicatieaparate/controller/List.controller"
], function(sinon, sinonQunit, ListController) {
    "use strict";

    QUnit.module("List Controller Tests", {
        beforeEach: function() {
            this.oController = new ListController();
            this.oViewStub = new sap.ui.core.mvc.XMLView({
                viewName: "aplicatieaparate.view.List"
            });
            sinon.stub(this.oController, "getView").returns(this.oViewStub);
        },
        afterEach: function() {
            this.oController.destroy();
            this.oViewStub.destroy();
        }
    });

    QUnit.test("Search functionality", function(assert) {
        var oEvent = {
            getParameter: sinon.stub().withArgs("newValue").returns("test")
        };
        // Assume 
        var oComboBoxStub = {
            getSelectedKey: sinon.stub().returns("NAME")
        };
        sinon.stub(this.oViewStub, "byId").withArgs("comboBox").returns(oComboBoxStub);
        sinon.stub(this.oViewStub, "byId").withArgs("fitnessMachineTable").returns({
            getBinding: function(sName) {
                return {
                    filter: sinon.spy()
                };
            }
        });
        // Act
        this.oController.onSearch(oEvent);
        // Assert
        var oTable = this.oViewStub.byId("fitnessMachineTable");
        assert.ok(oTable.getBinding("items").filter.calledOnce, "Filter was called on the table's items binding");
    });
});