import AppUtils from 'textup-frontend/utils/app';
import Constants from 'textup-frontend/constants';
import Ember from 'ember';
import moment from 'moment';

const { isArray, RSVP } = Ember;

export default Ember.Mixin.create({
  composeSlideoutService: Ember.inject.service(),
  recordItemService: Ember.inject.service(),
  tutorialService: Ember.inject.service(),

  setupController(controller) {
    this._super(...arguments);
    this._initializeProperties(controller);
  },

  actions: {
    startSingleExportSlideout(recordOwner) {
      this._initializeProperties(this.get('controller'), [recordOwner]);
      this.send(
        'toggleSlideout',
        'slideouts/export/single',
        AppUtils.controllerNameForRoute(this),
        Constants.SLIDEOUT.OUTLET.DETAIL
      );
    },
    startMultipleExportSlideout(selectedRecordOwnersOrEvent) {
      this._initializeProperties(this.get('controller'), selectedRecordOwnersOrEvent);
      this.send(
        'toggleSlideout',
        'slideouts/export/multiple',
        AppUtils.controllerNameForRoute(this),
        Constants.SLIDEOUT.OUTLET.DEFAULT
      );
    },

    cancelExportSlideout() {
      this.send('closeSlideout');
    },
    finishExportSlideout() {
      const controller = this.get('controller'),
        dateStart = controller.get('exportStartDate'),
        dateEnd = controller.get('exportEndDate'),
        exportAsGrouped = controller.get('exportAsGrouped'),
        exportRecordOwners = controller.get('exportForEntirePhone')
          ? [] // pass no record owners if we want to export entire phone
          : controller.get('exportRecordOwners');

      return new RSVP.Promise((resolve, reject) => {
        this.get('recordItemService')
          .exportRecordItems(dateStart, dateEnd, exportAsGrouped, exportRecordOwners)
          .then(() => {
            this.send('closeSlideout');
            this.get('tutorialService').startCompleteTask(Constants.TASK.EXPORT);
            resolve();
          }, reject);
      });
    },

    exportDoSearch() {
      return this.get('composeSlideoutService').doSearch(...arguments);
    },
    exportInsertRecordOwner(index, recordOwner) {
      return new RSVP.Promise(resolve => {
        this.get('controller.exportRecordOwners').replace(index, 1, [recordOwner]);
        resolve();
      });
    },
    exportRemoveRecordOwner(recordOwner) {
      this.get('controller.exportRecordOwners').removeObject(recordOwner);
    },
  },

  _initializeProperties(controller, models) {
    controller.setProperties({
      exportStartDate: moment()
        .subtract(7, 'days')
        .toDate(),
      exportEndDate: moment().toDate(),
      exportForEntirePhone: false,
      exportAsGrouped: false,
      exportRecordOwners: isArray(models) ? models : [],
    });
  },
});
