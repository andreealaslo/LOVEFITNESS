sap.ui.define([
  'sap/ui/core/Fragment',
  'sap/ui/core/mvc/Controller',
  'profiluser/model/formatter',
  "sap/m/MessageBox",
], function ( Fragment, Controller, formatter, MessageBox) {
  "use strict";

  var PageController = Controller.extend("profiluser.controller.App", {

    formatter: formatter,

    onInit: function () {
      if (window.location.href.includes("applicationstudio")){
        this.loggedUser = "deea.laslo@yahoo.com";
    }else{
        this.loggedUser = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
    }  
      var oModel = this.getOwnerComponent().getModel("catalogV2");
      this.getView().setModel(oModel);

      this.bindView();

      this._formFragments = {};
      this._showFormFragment("Display");
      this._bSelectionHandlerAttached = false;

    },

    bindView() {
      var sPath = "/USERS(\'" + this.loggedUser + "\')";
      this.getView().bindElement({
        path: sPath,
        parameters: { expand: 'MEDICAL_AFFECTIONS/MEDICAL_AFFECTION/MUSCLE_AFFECTED' },
        model: "catalogV2"
      });
    },

    handleEditPress: function () {
      var oContext = this.getView().getBindingContext("catalogV2");
      this._originalContextPath = oContext.getPath();
      this._toggleButtonsAndView(true);
    },

    handleCancelPress: function () {
      if (this._originalContextPath) {
        this.getView().bindElement({
          path: this._originalContextPath,
          model: "catalogV2"
        });
      }
      this._toggleButtonsAndView(false);
    },

    handleSavePress: function () {
      var oFragmentId = this.getView().getId() + "--Change";
      console.log("Fragment ID:", oFragmentId);
      var oModel = this.getView().getModel("catalogV2");
      var sService = "/USERS(\'" + this.loggedUser + "\')";
      var oBundle = this.getView().getModel("i18n").getResourceBundle();

      var oDateOfBirthInput = sap.ui.core.Fragment.byId(oFragmentId, "dateOfBirthInput");
      console.log("Date of Birth Input:", oDateOfBirthInput);
      var oHeightInput = sap.ui.core.Fragment.byId(oFragmentId, "heightInput");
      var oWeightInput = sap.ui.core.Fragment.byId(oFragmentId, "weightInput");

      var sDateOfBirth = oDateOfBirthInput.getValue();
      var iHeight = oHeightInput.getValue();
      var iWeight = oWeightInput.getValue();

      var oEntity = {
        DATE_OF_BIRTH: sDateOfBirth,
        HEIGHT: parseInt(iHeight, 10),
        WEIGHT: parseInt(iWeight, 10),
      };

      oModel.update(sService, oEntity, {
        success: function (oData, oResponse) {
          var sEditMessage = oBundle.getText("editSuccessMessage");
          sap.m.MessageToast.show(sEditMessage);
        },
        error: function (oError) {
          MessageBox.error(oError.statusCode + " - " + oError.statusText);
        }
      });
      this._toggleButtonsAndView(false);
    },

    _toggleButtonsAndView: function (bEdit) {
      var oView = this.getView();
      oView.byId("edit").setVisible(!bEdit);
      oView.byId("save").setVisible(bEdit);
      oView.byId("cancel").setVisible(bEdit);
      this._showFormFragment(bEdit ? "Change" : "Display");
    },

    _getFormFragment: function (sFragmentName) {
      var oView = this.getView();
      var pFormFragmentPromise = this._formFragments[sFragmentName];

      if (!pFormFragmentPromise) {
        pFormFragmentPromise = Fragment.load({
          id: oView.getId() + "--" + sFragmentName,
          name: "profiluser.fragment." + sFragmentName,
          controller: this
        }).then(function (oFragment) {
          this.getView().addDependent(oFragment);
          return oFragment;
        }.bind(this));
        this._formFragments[sFragmentName] = pFormFragmentPromise;
      }

      return pFormFragmentPromise;
    },


    _showFormFragment: function (sFragmentName) {
      var oPage = this.byId("page");

      this._getFormFragment(sFragmentName).then(function (oFragment) {
        oPage.removeAllContent();
        oPage.insertContent(oFragment);

        if (sFragmentName === "Change") {
          this.afterChangeFragmentDisplayed();
        }
      }.bind(this));
    },

    afterChangeFragmentDisplayed: function () {
      var oFragmentId = this.getView().getId() + "--Change";
      var oTable = sap.ui.core.Fragment.byId(oFragmentId, "medicalAffectionsTableChange");
      var oMinusButton = sap.ui.core.Fragment.byId(oFragmentId, "minusButton");

      if (!this._bSelectionHandlerAttached) {
        oTable.attachSelectionChange(this.onSelectionChange, this);
        this._bSelectionHandlerAttached = true;
      }

      this.updateMinusButtonVisibility(oTable, oMinusButton);
    },

    onMedicalAffectionAdd: function () {
      var oView = this.getView();
      var oFragmentId = this.getView().getId() + "--Change"; 
      var oTable = sap.ui.core.Fragment.byId(oFragmentId, "medicalAffectionsTableChange");
      var that = this;

      this._oAddDialog = new sap.m.Dialog({
        title: "Add Medical Affection",
        contentWidth: "500px",
        contentHeight: "140px",
        resizable: true,
        draggable: true,
        content: [
          new sap.m.Label({ text: "Description" }),
          new sap.m.TextArea({ width: "100%", placeholder: "Enter description..." }),
          new sap.m.Label({ text: "Muscle Affected" }),
          new sap.m.ComboBox({
            width: "100%",
            placeholder: "Select or type",
            selectedKey: "{selectedMuscleGroup}",
            showSecondaryValues: true,
            filterSecondaryValues: true,
            items: {
              path: "catalogV2>/MUSCLE_GROUPS",
              template: new sap.ui.core.ListItem({
                key: "{catalogV2>ID}",
                text: "{catalogV2>NAME}"
              })
            }
          })
        ],
        beginButton: new sap.m.Button({
          text: "SAVE",
          press: function (oEvent) {
            var oDialog = this._oAddDialog;
            var oModel = this.getView().getModel("catalogV2");
            var oComboBox = oDialog.getContent()[3];
            var sSelectedKey = oComboBox.getSelectedKey();
            var oEntity1 = {
              DESCRIPTION: oEvent.getSource().getParent().getContent()[1].getValue(),
              MUSCLE_AFFECTED_ID: sSelectedKey
            }
            oModel.create("/MEDICAL_AFFECTIONS", oEntity1, {
              success: function (oRetrievedResult) {
                var oEntity2 = {
                  USER_EMAIL: this.loggedUser,
                  MEDICAL_AFFECTION_ID: oRetrievedResult.ID
                }
                oModel.create("/USERS_AND_MEDICAL_AFFECTIONS", oEntity2, {
                  success: function (oRetrievedResult) {
                    sap.m.MessageToast.show("Successfully added!");
                  }.bind(this),
                  error: function (oError) {
                    
                    var oFormattedError = JSON.parse(oError.responseText).error;
                    sap.m.MessageBox.error(oFormattedError.code + " - " + oFormattedError.message.value);
                  }
                });
              }.bind(this),
              error: function (oError) {
                var oFormattedError = JSON.parse(oError.responseText).error;
                sap.m.MessageBox.error(oFormattedError.code + " - " + oFormattedError.message.value);
              }
            });
            this._oAddDialog.destroy();
          }.bind(this)
        }),
        endButton: new sap.m.Button({
          text: "Cancel",
          press: function () {
            this._oAddDialog.destroy();
          }.bind(this)
        })
      });
      this._oAddDialog.addStyleClass("sapUiResponsivePadding--content sapUiResponsivePadding--header sapUiResponsivePadding--footer sapUiResponsivePadding--subHeader");
      oView.addDependent(this._oAddDialog);
      this._oAddDialog.open();
    },

    onSelectionChange: function (oEvent) {
      var oTable = oEvent.getSource();
      var oFragmentId = this.getView().getId() + "--Change";
      var oMinusButton = sap.ui.core.Fragment.byId(oFragmentId, "minusButton");
      this.updateMinusButtonVisibility(oTable, oMinusButton);
    },

    updateMinusButtonVisibility: function (oTable, oMinusButton) {
      var aSelectedItems = oTable.getSelectedItems();
      oMinusButton.setVisible(aSelectedItems.length > 0);
    },

    onMedicalAffectionDelete: function () {
      var oFragmentId = this.getView().getId() + "--Change";
      var oTable = sap.ui.core.Fragment.byId(oFragmentId, "medicalAffectionsTableChange");
      var aSelectedItems = oTable.getSelectedItems();
      var oModel = this.getView().getModel("catalogV2");
      var oBundle = this.getView().getModel("i18n").getResourceBundle();

      var sConfirmationMessage = aSelectedItems.length > 1 ?
        oBundle.getText("deleteConfirmationMedicalAffections") :
        oBundle.getText("deleteConfirmationMedicalAffection");

      MessageBox.warning(sConfirmationMessage, {
        actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
        styleClass: "sapUiSizeCompact",
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.DELETE) {
            for (var i = 0; i < aSelectedItems.length; i++) {
              var oItem = aSelectedItems[i];
              var oContext = oItem.getBindingContext("catalogV2");
              var sPath = oContext.getPath();
              var oData = oModel.getProperty(sPath);
              var sMedicalAffectionID = oData.MEDICAL_AFFECTION_ID;
              var sPath2 = "/MEDICAL_AFFECTIONS(guid'" + sMedicalAffectionID + "')";
              oModel.remove(sPath, {
                success: function () {
                },
                error: function (oError) {
                  const sErrorMessage = oBundle.getText("deleteMedicalAffectionsWithSuccess");
                  MessageBox.error(sErrorMessage + oError.statusCode + " - " + oError.statusText);
                }
              });
              oModel.remove(sPath2, {
                success: function () {
                  const sDeleteMessage = oBundle.getText("deleteMedicalAffectionsWithSuccess");
                  sap.m.MessageToast.show(sDeleteMessage);
                },
                error: function (oError) {
                  const sErrorMessage = oBundle.getText("deleteMedicalAffectionsWithSuccess");
                  MessageBox.error(sErrorMessage + oError.statusCode + " - " + oError.statusText);
                }
              })
            }

            oTable.removeSelections(true);
            var oMinusButton = sap.ui.core.Fragment.byId(oFragmentId, "minusButton");
            oMinusButton.setVisible(false);
          }
        }
      });
    }
  });

  return PageController;
});