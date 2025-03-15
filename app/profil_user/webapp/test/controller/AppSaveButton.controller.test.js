sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "profiluser/controller/App.controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "profiluser/model/formatter",
    'sap/ui/core/Fragment',
], function (Controller, AppController, JSONModel, MessageBox, MessageToast, formatter, Fragment) {
    "use strict";

    QUnit.module("Save Button Tests", {
        beforeEach: function (assert) {
            this.oAppController = new AppController();

            this.oViewMock = {
                getModel: sinon.stub().returns({
                    getResourceBundle: sinon.stub().returns({
                        getText: sinon.stub().returns("Edit success message")
                    }),
                    update: sinon.stub().callsFake((sService, oEntity, mParameters) => {
                        if (mParameters && typeof mParameters.success === "function") {
                            mParameters.success({}, {}); 
                        }
                    })
                }),
                byId: sinon.stub(),
                getId: sinon.stub().returns("viewId")
            };

            this.editButtonMock = { setVisible: sinon.stub() };
            this.saveButtonMock = { setVisible: sinon.stub() };
            this.cancelButtonMock = { setVisible: sinon.stub() };

            this.oViewMock.byId.withArgs("edit").returns(this.editButtonMock);
            this.oViewMock.byId.withArgs("save").returns(this.saveButtonMock);
            this.oViewMock.byId.withArgs("cancel").returns(this.cancelButtonMock);

            this.dateOfBirthInputMock = { getValue: sinon.stub().returns("2020-01-01") };
            this.heightInputMock = { getValue: sinon.stub().returns("180") };
            this.weightInputMock = { getValue: sinon.stub().returns("75") };

            this.byIdStub = sinon.stub(sap.ui.core.Fragment, "byId");
            this.byIdStub.withArgs("viewId--Change", "dateOfBirthInput").returns(this.dateOfBirthInputMock);
            this.byIdStub.withArgs("viewId--Change", "heightInput").returns(this.heightInputMock);
            this.byIdStub.withArgs("viewId--Change", "weightInput").returns(this.weightInputMock);

            const oFragment = {
                byId: this.byIdStub,
                getModel: this.oViewMock.getModel
            };

            sinon.stub(Fragment, "load").resolves(oFragment);
            sinon.stub(this.oAppController, "getView").returns(this.oViewMock);

            this.oAppController._formFragments = {};
            this.oAppController._getFormFragment = sinon.stub().callsFake((sFragmentName) => {
                return Promise.resolve(oFragment);
            });
        },

        afterEach: function () {
            this.oAppController.getView.restore();
            Fragment.load.restore();
            sap.ui.core.Fragment.byId.restore();
        }
    });


    QUnit.test("handleSavePress should update data and show success message", function (assert) {
        const done = assert.async();
        sinon.stub(sap.m.MessageToast, "show");
        this.oAppController.handleSavePress();
        Promise.resolve().then(() => {
            assert.ok(this.oViewMock.getModel().update.calledOnce, "Update was called on the model");
            assert.ok(sap.m.MessageToast.show.calledWith("Edit success message"), "Success message was shown");

            done();
        }).finally(() => {
            sap.m.MessageToast.show.restore();
        });
    });

    QUnit.test("handleSavePress should handle failure correctly", function (assert) {
        const errorResponse = {
            statusCode: 500,
            statusText: "Internal Server Error"
        };
        this.oViewMock.getModel().update.callsFake((sService, oEntity, mParameters) => {
            if (mParameters && typeof mParameters.error === "function") {
                mParameters.error(errorResponse);
            }
        });
        sinon.stub(sap.m.MessageBox, "error");

        // Arrange
        var done = assert.async();

        // Act
        this.oAppController.handleSavePress();

        // Assert
        setTimeout(() => {
            assert.ok(sap.m.MessageBox.error.calledOnce, "Error MessageBox should be shown");
            assert.ok(sap.m.MessageBox.error.calledWith("500 - Internal Server Error"), "Error MessageBox should be called with correct message");
            done();
        }, 1000);
    });
});
