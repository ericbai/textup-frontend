import Ember from 'ember';
import defaultIfAbsent from '../utils/default-if-absent';

export default Ember.Component.extend({

	tabindex: defaultIfAbsent(0),
	selectIndex: null,
	disabled: defaultIfAbsent(false),
	wrapAround: defaultIfAbsent(true),
	indicatorClass: defaultIfAbsent('toggle-indicator'),

	classNames: 'multi-toggle',
	classNameBindings: ['canLeft:has-left', 'canRight:has-right'],
	canLeft: true,
	canRight: true,

	attributeBindings: ['style', 'tabIndex:tabindex'],
	_items: defaultIfAbsent([]),
	$indicators: null,

	// Computed properties
	// -------------------

	tabIndex: Ember.computed('tabindex', 'disabled', function() {
		return this.get('disabled') ? '' : this.get('tabindex');
	}),
	style: Ember.computed('_selectedIndex', function() {
		let style = '';
		const index = this.get('_selectedIndex');
		if (Ember.isPresent(index)) {
			const selected = this.get('_items').objectAt(index);
			style = `color: ${selected.complement};`;
		}
		return Ember.String.htmlSafe(style);
	}),
	$itemContainer: Ember.computed(function() {
		return this.$().children('.multi-toggle-items');
	}),
	publicAPI: Ember.computed(function() {
		return {
			currentIndex: null, // set during initialization
			actions: {
				moveLeft: this.moveLeft.bind(this),
				moveRight: this.moveRight.bind(this)
			}
		};
	}),

	// Events
	// ------

	didInsertElement: function() {
		this._super(...arguments);
		Ember.run.next(this, function() {
			this.build$Indicators(this.get('_items'));
			this._setup();
		});
	},
	didUpdateAttrs: function() {
		this._super(...arguments);
		Ember.run.next(this, this._setup.bind(this));
	},
	_setup: function() {
		const items = this.get('_items');
		if (items.length > 0) {
			let selectIndex = this.get('selectIndex');
			if (!selectIndex) { // defer to the items if null on parent
				const selected = items.filterBy('isSelected', true);
				let selectedItem = selected.get('firstObject');
				if (selected.length > 1) { // ensure only one selected
					selected.slice(1).forEach(function(item) {
						item.actions.deselect();
					});
				} else if (selected.length === 0) { // select first if none selected
					const firstItem = items.get('firstObject');
					selectedItem = firstItem;
					firstItem.actions.select(true);
				}
				selectIndex = items.indexOf(selectedItem);
			}
			this.slideToAndSetIndex(selectIndex, true);
		}
	},

	// Handlers
	// --------

	click: function(event) {
		const $t = Ember.$(event.target);
		if ($t.hasClass('left-toggle') || $t.closest('.left-toggle').length) {
			this.moveLeft();
		} else if ($t.hasClass('right-toggle') || $t.closest('.right-toggle').length) {
			this.moveRight();
		}
	},
	keyUp: function(event) {
		if (event.which === 37) { // left arrow key
			this.moveLeft();
		} else if (event.which === 39) { // right arrow key
			this.moveRight();
		}
	},

	// Actions
	// -------

	actions: {
		registerItem: function(item) {
			Ember.run.scheduleOnce('afterRender', this, function() {
				this.get('_items').pushObject(item);
			});
		}
	},

	// Indicator bar
	// -------------

	build$Indicators: function(items) {
		const numItems = items.length,
			$indicators = items.map(this._buildIndicator.bind(this, numItems));
		this.$('.multi-toggle-indicators').append($indicators);
		this.set('$indicators', $indicators);
		return $indicators;
	},
	_buildIndicator: function(numItems, item) {
		const indClass = this.get('indicatorClass'),
			color = Ember.get(item, 'complement');
		return Ember.$(`<div class='${indClass}'
			style='background-color:${color};
				width:${100 / numItems}%;'></div>`);
	},

	// Helpers
	// -------

	moveLeft: function() {
		if (this.get('canLeft')) {
			this.slideToAndSetIndex(this.get('_selectedIndex') - 1);
		}
	},
	moveRight: function() {
		if (this.get('canRight')) {
			this.slideToAndSetIndex(this.get('_selectedIndex') + 1);
		}
	},
	slideToAndSetIndex: function(index, skipNotify = false) {
		if (this.get('disabled')) {
			return;
		}
		const items = this.get('_items'),
			$indicators = this.get('$indicators'),
			normalized = this._normalizeIndex(index),
			prevIndex = this.get('_selectedIndex'),
			prev = Ember.isPresent(prevIndex) ? items.objectAt(prevIndex) : null,
			next = items.objectAt(normalized);
		// update selection
		if (prev) {
			$indicators.objectAt(prevIndex).removeClass('selected');
			prev.actions.deselect();
		}
		$indicators.objectAt(normalized).addClass('selected');
		next.actions.select(skipNotify);
		// update stored index
		this.setProperties({
			_selectedIndex: normalized,
			'publicAPI.currentIndex': normalized
		});
		// shift item container to display selected object
		this.get('$itemContainer').css('left', `-${normalized * 100}%`);
		// update toggles
		this._setToggles(normalized);
	},
	_setToggles: function(normalized) {
		this.setProperties({
			canRight: true,
			canLeft: true
		});
		if (this.get('wrapAround')) {
			return;
		}
		const lastIndex = this.get('_items.length') - 1;
		if (normalized === lastIndex) {
			this.set('canRight', false);
		} else if (normalized === 0) {
			this.set('canLeft', false);
		}
	},
	_normalizeIndex: function(index) {
		const numItems = this.get('_items.length');
		if (index < 0) {
			return numItems + index;
		} else if (index >= numItems) {
			return index - numItems;
		} else {
			return index;
		}
	},
});