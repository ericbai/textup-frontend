import Ember from 'ember';

export default Ember.Route.extend({
	setupController: function(controller) {
		this._super(...arguments);
		controller.set('team', this.controllerFor('admin.people').get('team'));
	},
});
