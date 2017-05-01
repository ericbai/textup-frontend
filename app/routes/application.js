import Ember from 'ember';
import Slideout from '../mixins/slideout-route';
import Loading from '../mixins/loading-slider';
import callIfPresent from '../utils/call-if-present';
import config from '../config/environment';

const {
	$,
	isArray,
	get,
	isPresent,
	run: {
		later,
		cancel
	}
} = Ember;

export default Ember.Route.extend(Slideout, Loading, {

	attemptedTransition: null,
	storage: Ember.inject.service(),

	// Events
	// ------

	init: function() {
		this._super(...arguments);
		this.notifications.setDefaultClearNotification(5000);
		this.notifications.setDefaultAutoClear(true);
		this.get('authManager')
			.on(config.events.auth.success, this, this._bindLockEvents)
			.on(config.events.auth.clear, this, this._clearLockEvents);
	},
	willDestroy: function() {
		this._super(...arguments);
		this.get('authManager')
			.off(config.events.auth.success, this)
			.off(config.events.auth.clear, this);
	},

	// Hooks
	// -----

	beforeModel: function() {
		// validate stored token for staff, if any
		// return promise so that resolver blocks until promise completes
		// catch any error to avoid default error handler if promise
		// rejects when the staff is not logged in
		return this.get('authManager').setupFromStorage().catch(() => {});
	},
	redirect: function(model, transition) {
		const storage = this.get('storage'),
			url = storage.getItem('currentUrl'),
			targetName = transition.targetName;
		// initialize the observer after retrieving the previous currentUrl
		this.get('stateManager').trackLocation();
		// skip initial locking when setting up controller if in ignore list
		const ignoreLock = config.state.ignoreLock,
			doInitialLock = ignoreLock.every((loc) => targetName.indexOf(loc) === -1);
		this.set('doInitialLock', doInitialLock);
		// redirect only if previous url present and the target
		// route is not one of the routes to be ignored
		const ignoreTracking = config.state.ignoreTracking,
			doTracking = ignoreTracking.every((loc) => targetName.indexOf(loc) === -1);
		if (doTracking && url) {
			this.transitionTo(url);
		}
	},
	setupController: function(controller) {
		this._super(...arguments);
		controller.set('lockCode', '');
		if (this.get('authManager.isLoggedIn') &&
			this.get('doInitialLock')) {
			this.doLock();
		}
	},

	actions: {
		validate: function(un, pwd, then = undefined) {
			return this.get('authManager').validate(un, pwd).then(() => {
				callIfPresent(then);
			}, (failure) => {
				if (this.get('dataHandler').displayErrors(failure) === 0) {
					this.notifications.error('Could not validate credentials');
				}
			});
		},
		logout: function() {
			this.get('authManager').logout();
		},

		// Lock
		// ----

		updateLockCode: function(code) {
			this.controller.set('lockCode', code);
		},
		verifyLockCode: function(code) {
			return new Ember.RSVP.Promise((resolve, reject) => {
				const un = this.get('authManager.authUser.username');
				this.get('authManager').validateLockCode(un, code).then(() => {
					this.doUnlock();
					resolve();
				}, () => {
					this.notifications.error('Incorrect lock code.');
					reject();
				}).finally(() => this.controller.set('lockCode', ''));
			});
		},

		// Slideout
		// --------

		willTransition: function(transition) {
			const targetName = transition.targetName,
				url = this.get('storage').getItem('currentUrl'),
				ignoreLock = config.state.ignoreLock;
			if (this.controller.get('isLocked')) {
				const allowTransition = ignoreLock.any((loc) => {
					return targetName.indexOf(loc) > -1;
				});
				if (allowTransition) {
					this.doUnlock();
				} else {
					transition.abort();
					// Manual fix for the problem of URL getting out of sync
					// when pressing the back button even though we are aborting
					// the transition.
					// http://stackoverflow.com/questions/17738923/
					// 		url-gets-updated-when-using-transition-
					// 		abort-on-using-browser-back
					if (window.history) {
						window.history.forward();
					}
				}
			}
			// otherwise, if logged in and we are coming from one of the ignoreLock
			// locations, then we need to re-lock
			else if (this.get('authManager.isLoggedIn')) {
				const shouldRelock = ignoreLock.any((loc) => {
					return url.indexOf(loc) > -1;
				});
				if (shouldRelock) {
					this.doLock();
				}
			}
		},
		didTransition: function() {
			// initializer
			if (!this.get('_initialized')) {
				Ember.run.next(this, function() {
					const $initializer = Ember.$('#initializer');
					$initializer.fadeOut('fast', () => {
						$initializer.remove();
						this.set('_initialized', true);
					});
				});
			}
			// lock screen
			this.controller.set('lockCode', '');
			// slideout
			this._closeSlideout();
		},
		toggleSlideout: function(name, context) {
			this._toggleSlideout(name, context);
		},
		openSlideout: function(name, context) {
			this._openSlideout(name, context);
		},
		closeSlideout: function() {
			this._closeSlideout();
		},

		// Slideout utilities
		// ------------------

		clearList: function(models, propName, ...then) {
			this._doForOneOrMany(models, (model) => model.get(propName).clear());
			then.forEach(callIfPresent);
		},
		revert: function(models, ...then) {
			this._doForOneOrMany(models, (model) => model && model.rollbackAttributes());
			then.forEach(callIfPresent);
		},
		revertAttribute: function(models, attributeName, ...then) {
			this._doForOneOrMany(models, (model) => {
				if (model) {
					const changes = get(model.changedAttributes(), attributeName);
					if (isArray(changes)) {
						model.set(attributeName, changes[0]);
					}
				}
			});
			then.forEach(callIfPresent);
		},
		persist: function(models, ...then) {
			return this.get('dataHandler')
				.persist(models)
				.then(() => then.forEach(callIfPresent));
		},
		markForDelete: function(models, ...then) {
			this.get('dataHandler').markForDelete(models);
			then.forEach(callIfPresent);
		},

		// Chaining utilities
		// ------------------

		mutate: function(propClosure, newValue, ...then) {
			callIfPresent(propClosure, newValue);
			then.forEach(callIfPresent);
		},

		// Errors
		// ------

		mapError: function() {
			this.notifications.error(`Sorry! We are having trouble loading
				the map. Please try again.`);
		},
		error: function(reason, transition) {
			this.get('authManager').set("attemptedTransition", transition);
			this.get('dataHandler').handleError(reason);
		}
	},

	// Lock helpers
	// ------------

	doLock: function() {
		if (!config.lock.lockOnHidden) {
			return;
		}
		this.controller.set('isLocked', true);
		Ember.run.scheduleOnce('afterRender', this, function() {
			$('#container .number-control').focus();
		});
	},
	doUnlock: function() {
		this.controller.set('isLocked', false);
	},
	_scheduleLock: function() {
		const org = this.get('authManager.authUser.org.content'),
			changedAttrs = org.changedAttributes();
		let timeout = org.get('timeout');
		if (isArray(get(changedAttrs, 'timeout'))) {
			timeout = get(changedAttrs, 'timeout')[0];
		}
		timeout = isPresent(timeout) ? timeout : 15000;
		this.set('_lockTimer', later(this, this.doLock, timeout));
	},
	_unscheduleLock: function() {
		cancel(this.get('_lockTimer'));
	},
	_bindLockEvents: function() {
		this.get('visibility')
			.on(config.events.visibility.hidden, this, this._scheduleLock)
			.on(config.events.visibility.visible, this, this._unscheduleLock);
	},
	_clearLockEvents: function() {
		this.get('visibility')
			.off(config.events.visibility.hidden, this)
			.off(config.events.visibility.visible, this);
	},

	// Helpers
	// -------

	_doForOneOrMany: function(data, doAction) {
		if (Ember.isArray(data)) {
			return data.forEach(doAction);
		} else {
			return doAction(data);
		}
	},
});