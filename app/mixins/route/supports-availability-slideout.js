import Ember from 'ember';

export default Ember.Mixin.create({
  authService: Ember.inject.service(),
  availabilitySlideoutService: Ember.inject.service(),
  constants: Ember.inject.service(),
  dataService: Ember.inject.service(),
  tutorialService: Ember.inject.service(),

  actions: {
    startAvailabilitySlideout() {
      this.send(
        'toggleSlideout',
        'slideouts/availability',
        this.get('routeName'),
        this.get('constants.SLIDEOUT.OUTLET.DEFAULT')
      );
    },
    cancelAvailabilitySlideout() {
      const model = this.get('currentModel'),
        authUser = this.get('authService.authUser');
      model.rollbackAttributes();
      authUser.rollbackAttributes();
      this.get('tutorialService').startCompleteTask('setAvailability');
      this.send('closeSlideout');
    },
    finishAvailabilitySlideout() {
      const model = this.get('currentModel'),
        authUser = this.get('authService.authUser');
      this.get('tutorialService').startCompleteTask('setAvailability');
      return this.get('dataService')
        .persist([model, authUser])
        .then(() => {
          this.send('closeSlideout');
        });
    },

    onAvailabilityEntitySwitch(scheduleOwner) {
      return this.get('availabilitySlideoutService').ensureScheduleIsPresent(scheduleOwner);
    },

    onFinishRecordingGreeting(mimeType, data) {
      const phone = this.get('currentModel.phone.content');
      this.get('availabilitySlideoutService').onAddAudio(phone, mimeType, data);
    },
    onRequestVoicemailGreetingCall(numToCall) {
      return this.get('availabilitySlideoutService').onRequestVoicemailGreetingCall(
        this.get('currentModel'),
        numToCall
      );
    }
  }
});
