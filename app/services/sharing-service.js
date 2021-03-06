import ArrayUtils from 'textup-frontend/utils/array';
import Constants from 'textup-frontend/constants';
import Ember from 'ember';
import TypeUtils from 'textup-frontend/utils/type';

const { computed, RSVP } = Ember;

export default Ember.Service.extend({
  requestService: Ember.inject.service(),
  store: Ember.inject.service(),

  // Properties
  // ----------

  staffCandidates: computed('_allCanShareStaffs.[]', function() {
    return ArrayUtils.ensureArrayAndAllDefined(this.get('_allCanShareStaffs'));
  }),

  // Methods
  // -------

  // [NOTE] the backend already excludes the staff with id we are passing-in and staffs
  // that do not have access to any TextUp phone
  loadStaffCandidatesForPhoneOwner(phoneOwner) {
    return new RSVP.Promise((resolve, reject) => {
      if (!TypeUtils.isAnyModel(phoneOwner)) {
        return reject();
      }
      const ownerId = phoneOwner.get('id');
      this.get('requestService')
        .handleIfError(
          this.get('store').query(Constants.MODEL.STAFF, {
            max: 100,
            status: [Constants.STAFF.STATUS.ADMIN, Constants.STAFF.STATUS.STAFF],
            teamId: TypeUtils.isTeam(phoneOwner) ? ownerId : null,
            shareStaffId: TypeUtils.isStaff(phoneOwner) ? ownerId : null,
          })
        )
        .then(results => {
          this.set('_allCanShareStaffs', results.toArray());
          resolve();
        }, reject);
    });
  },

  // Internal
  // --------

  _allCanShareStaffs: null,
});
