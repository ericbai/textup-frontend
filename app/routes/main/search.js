import Ember from 'ember';

const {
	$,
	isBlank,
	isNone,
	isPresent,
	computed: {
		match
	}
} = Ember;

export default Ember.Route.extend({

	queryParams: {
		searchQuery: {
			refreshModel: true
		},
	},

	storage: Ember.inject.service(),

	_scheduledResetJob: null,

	_prevUrl: null,
	_prevUrlIsSearch: match('_prevUrl', /main\/.*\/search/),

	afterModel: function() {
		this._super(...arguments);
		// usually would call resetController in the setupController hook
		// when we are resetting the search list for a new search. However,
		// this doesn't work here because the setupController hook is not called
		// on subsequent full transitions to the same route when we don't have
		// a model associated with this route.
		this.set('_scheduledResetJob', Ember.run.next(this, this._resetController));
	},
	setupController: function() {
		this._super(...arguments);
		// the setupController hook is called on the initial entry into this route
		// Therefore, on the initial entry, we want to cancel the job so we don't
		// have the scenario where we are resetting the controller after the results
		// have already been loaded on the initial entry
		const resetJob = this.get('_scheduledResetJob');
		if (resetJob) {
			Ember.run.cancel(resetJob);
		}
		// and after we cancel the job, we want to synchronously setup controller here
		this._resetController();
	},
	activate: function() {
		const storage = this.get('storage');
		this.set('_prevUrl', storage.getItem('currentUrl'));
	},
	deactivate: function() {
		this.controller.set('searchQuery', null);
	},

	actions: {

		// Hooks
		// -----

		didTransition: function() {
			const query = this.controller.get('searchQuery');
			// focus the search input if the search query is blank,
			// indicating that we are performing an initial search
			if (isBlank(query)) {
				Ember.run.scheduleOnce('afterRender', this, function() {
					$('.search-input').focus();
				});
			}
			return true;
		},
		// for changing filter on the mobile slideout menu
		changeFilter: function(filter) {
			this.transitionTo('main.contacts', {
				queryParams: {
					filter: filter
				}
			});
		},

		// Search functions
		// ----------------

		closeSearch: function() {
			const prevUrl = this.get('_prevUrl'),
				prevUrlIsSearch = this.get('_prevUrlIsSearch');
			// only transition to stored previous url if it is present
			// and if it is not already the search page itself
			if (!prevUrlIsSearch && isPresent(prevUrl)) {
				this.transitionTo(prevUrl);
			} else {
				this.transitionTo('main.contacts');
			}
		},
		triggerSearch: function(val) {
			if (!isBlank(val)) {
				// transition to main.search to close any open search
				// results when we are performing a new search
				this.transitionTo('main.search', {
					queryParams: {
						searchQuery: val
					}
				});
			}
		},

		// Performing search
		// -----------------

		refresh: function() {
			this.controller.get('searchResults').clear();
			return this._loadMore();
		},
		loadMore: function() {
			return this._loadMore();
		}
	},

	_resetController: function() {
		// if controller still has not been set, schedule for next runloop
		// until the controller is set and this method can be called
		if (isNone(this.controller)) {
			Ember.run.next(this, this._resetController);
		} else {
			this.controller.set('_searchQuery', this.controller.get('searchQuery'));
			this.controller.set('searchResults', []);
			// don't know total until loaded
			this.controller.set('numResults', '--');
		}
	},
	_loadMore: function() {
		return new Ember.RSVP.Promise((resolve, reject) => {
			const query = Object.create(null),
				controller = this.controller,
				team = this.get('stateManager.ownerAsTeam'),
				searchResults = controller.get('searchResults'),
				searchQuery = controller.get('searchQuery');
			// short circuit without returning error if no search query
			// or if we are currently transitioning to a new search term
			if (controller.get('_transitioning') || isBlank(searchQuery)) {
				return resolve();
			}
			query.search = searchQuery;
			// build query
			if (searchResults.length) {
				query.offset = searchResults.length;
			}
			if (team) {
				query.teamId = team.get('id');
			}
			// execute query
			this.store.query('contact', query).then((results) => {
				searchResults.pushObjects(results.toArray());
				controller.set('numResults', results.get('meta.total'));
				resolve();
			}, this.get('dataHandler').buildErrorHandler(reject));
		});
	},
});