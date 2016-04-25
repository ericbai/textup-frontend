import Ember from 'ember';
import defaultIfAbsent from '../utils/default-if-absent';
import callIfPresent from '../utils/call-if-present';

export default Ember.Component.extend({

	data: defaultIfAbsent([]),
	total: defaultIfAbsent(0),
	direction: defaultIfAbsent('down'), // up | down
	loadingText: defaultIfAbsent('Loading'),
	// how to close to edge before loading triggered
	loadProximity: defaultIfAbsent(100), // in pixels
	// how long to wait to check the data array if doLoad does
	// not return a Promise
	loadTimeout: defaultIfAbsent(1000), // in milliseconds

	// passed nothing
	// return Promise indicating that loading is done
	// method modifies 'data' and 'total' properties
	doLoad: null,

	containerClass: defaultIfAbsent(''),
	controlClass: defaultIfAbsent(''),
	classNameBindings: ['_isUp:scroll-up:scroll-down', '_isLoading:loading', '_isDone:done'],
	classNames: 'infinite-scroll',

	_isLoading: false,
	_hasError: false,
	// manually keep track of data items to be rendered
	_items: null,
	// keep track of versions so that we can cancel any leftover load actions
	// if we need to refresh component due to updated attributes
	_version: 0,

	// Computed properties
	// -------------------

	publicAPI: Ember.computed('total', 'direction', '_isLoading', '_hasError',
		'_version',
		function() {
			return {
				total: this.get('total'),
				direction: this.get('direction'),
				isLoading: this.get('_isLoading'),
				_hasError: this.get('_hasError'),
				_version: this.get('_version'),
				actions: {
					loadMore: this.loadMoreIfNeeded.bind(this, true)
				}
			};
		}),
	_isUp: Ember.computed.equal('direction', 'up'),
	_isDone: Ember.computed('total', 'data.[]', 'doLoad', '_hasError', function() {
		return this.get('doLoad') && !this.get('_hasError') ?
			this.get('data.length') >= this.get('total') :
			true;
	}),

	// Events
	// ------

	didInsertElement: function() {
		Ember.run.scheduleOnce('afterRender', this, function() {
			this._setup();
			// bind event handlers
			const elId = this.elementId;
			this.$().on(`scroll.${elId}`, function() {
				this.storePercentFromTop();
				this.loadMoreIfNeeded();
			}.bind(this));
			Ember.$(window).on(`orientationchange.${elId} resize.${elId}`,
				this.restorePercentFromTop.bind(this));
		});
	},
	willDestroyElement: function() {
		this.$().off(`.${this.elementId}`);
		Ember.$(window).off(`.${this.elementId}`);
	},
	didUpdateAttrs: function() {
		// only rerun setup if the data array has been changed to another array
		if (this.get('_prevData') !== this.get('data')) {
			Ember.run.scheduleOnce('afterRender', this, this._setup);
		}
	},
	_setup: function() {
		if (this.isDestroying || this.isDestroyed) {
			return;
		}
		// must reset properties before calling displayItems
		this.setProperties({
			_isLoading: false,
			_hasError: false,
			_items: [],
			_prevData: this.get('data'),
		});
		this.incrementProperty('_version');
		Ember.run.once(this, this.displayItems, this.loadMoreIfNeeded.bind(this), true);
	},

	// Preserve location
	// -----------------

	storePercentFromTop: function() {
		if (this.isDestroying || this.isDestroyed) {
			return;
		}
		const component = this.$()[0],
			percentFromTop = component.scrollTop / component.scrollHeight;
		this.set('_percentFromTop', percentFromTop);
		return percentFromTop;
	},
	restorePercentFromTop: function() {
		const component = this.$()[0],
			percentFromTop = this.get('_percentFromTop');
		if (Ember.isPresent(percentFromTop)) {
			component.scrollTop = component.scrollHeight * percentFromTop;
		}
	},

	// Loading
	// -------

	loadMoreIfNeeded: function(forceLoad = false) {
		if (!forceLoad && (this.get('_isDone') || this.get('_isLoading') ||
				(this._canScroll() && !this._isNearEdge()))) {
			return;
		}
		const versionWhenCalled = this.get('_version');
		this._loadMore().then(function() {
			if (this.isDestroying || this.isDestroyed) {
				return;
			}
			this.setProperties({
				_isLoading: false,
				_hasError: false
			});
			// only call display if the version matches to prevent
			// displayItems from being called multiple times
			if (versionWhenCalled === this.get('_version')) {
				Ember.run.once(this, this.displayItems, this.loadMoreIfNeeded.bind(this));
			}
		}.bind(this), function() {
			// setting hasError makes isDone true
			this.setProperties({
				_isLoading: false,
				_hasError: true
			});
		}.bind(this));
	},
	_loadMore: function() {
		this.set('_isLoading', true);
		return new Ember.RSVP.Promise(function(resolve, reject) {
			const loadResult = this.get('doLoad')();
			if (loadResult.then) {
				loadResult.then(resolve, reject);
			} else {
				Ember.run.later(this, resolve, this.get('loadTimeout'));
			}
		}.bind(this));
	},
	_isNearEdge: function() {
		const component = this.$()[0],
			sTop = component.scrollTop,
			sHeight = component.scrollHeight,
			cHeight = component.clientHeight,
			proximity = this.get('loadProximity');
		return this.get('_isUp') ?
			(sTop < proximity) :
			(sTop + cHeight + proximity > sHeight);
	},
	_canScroll: function() {
		const component = this.$()[0];
		return component.scrollHeight > component.clientHeight;
	},

	// Managing items
	// --------------

	displayItems: function(callback, isSettingUp = false) {
		if (this.isDestroying || this.isDestroyed) {
			return;
		}
		const renderedItems = this.get('_items'),
			passedInData = this.get('data'),
			itemsLen = renderedItems.length,
			dataLen = passedInData.length;
		if (dataLen > itemsLen) {
			const numNew = dataLen - itemsLen;
			let newItems = passedInData.slice(-numNew);
			// if is up, then we need to reverse items
			if (this.get('_isUp')) {
				newItems.reverseObjects(); // in-place reversal
			}
			this._beforeAdd();
			Ember.run(function() {
				if (this.get('_isUp')) {
					renderedItems.unshiftObjects(newItems);
				} else {
					renderedItems.pushObjects(newItems);
				}
				Ember.run.next(this, function() {
					this._afterAdd(isSettingUp);
					Ember.run.scheduleOnce('afterRender', this, this.storePercentFromTop);
					callIfPresent(callback);
				});
			}.bind(this));
		} else {
			// can't set isDone directly because destroys computed property
			// instead, set has error because, after loading, no additional
			// items were added to the data array
			this.set('_hasError', true);
			callIfPresent(callback);
		}
	},
	_beforeAdd: function() {
		const component = this.$()[0];
		this.set('_prevHeightLeft', component.scrollHeight - component.scrollTop);
	},
	_afterAdd: function(isSettingUp = false) {
		if (this.isDestroying || this.isDestroyed) {
			return;
		}
		const component = this.$()[0];
		if (isSettingUp) {
			if (this.get('_isUp')) {
				component.scrollTop = component.scrollHeight - component.clientHeight;
			} else {
				component.scrollTop = 0;
			}
		} else if (this.get('_isUp')) {
			const prevHeightLeft = this.get('_prevHeightLeft');
			component.scrollTop = component.scrollHeight - prevHeightLeft;
		}
	}
});
