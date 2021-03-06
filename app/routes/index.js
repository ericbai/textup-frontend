import Ember from 'ember';
import IsPublic from 'textup-frontend/mixins/route/is-public';

export default Ember.Route.extend(IsPublic, {
  redirect() {
    this._super(...arguments);
    this.transitionTo('login');
  },
});
