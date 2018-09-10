import Ember from 'ember';

export default Ember.Mixin.create({
  beforeModel: function() {
    this._super(...arguments);
    const user = this.get('authService.authUser'),
      hasSkippedSetup = this.get('stateManager.hasSkippedSetup');
    if (!hasSkippedSetup && !Ember.isPresent(user.get('personalPhoneNumber'))) {
      this.transitionTo('setup');
    }
  }
});
