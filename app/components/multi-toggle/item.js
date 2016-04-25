import Ember from 'ember';
import defaultIfAbsent from '../../utils/default-if-absent';
import callIfPresent from '../../utils/call-if-present';
import tc from 'npm:tinycolor2';

export default Ember.Component.extend({

	color: defaultIfAbsent('#fff'),
	contrast: defaultIfAbsent(40),
	isSelected: defaultIfAbsent(false),
	doRegister: null,
	onSelect: null,

	attributeBindings: ['style'],
	classNames: 'multi-toggle-item',

	// Computed properties
	// -------------------

	complement: Ember.computed('color', function() {
		const tColor = tc(this.get('color')),
			ct = this.get('contrast'),
			complement = tColor.isLight() ? tColor.darken(ct) : tColor.lighten(ct);
		return complement.toString();
	}),
	style: Ember.computed('color', 'complement', function() {
		const color = this.get('color'),
			complement = this.get('complement');
		return Ember.String.htmlSafe(`background-color: ${color}; color:${complement}`);
	}),
	publicAPI: Ember.computed(function() {
		return {
			isSelected: this.get('isSelected'),
			color: this.get('color'),
			complement: this.get('complement'),
			actions: {
				select: this.select.bind(this),
				deselect: this.deselect.bind(this),
			}
		};
	}),

	// Events
	// ------

	didInitAttrs: function() {
		this._super(...arguments);
		callIfPresent(this.get('doRegister'), this.get('publicAPI'));
	},

	// Actions
	// -------

	select: function(skipNotify = false) {
		this.setProperties({
			isSelected: true,
			'publicAPI.isSelected': true
		});
		if (!skipNotify) {
			callIfPresent(this.get('onSelect'));
		}
	},
	deselect: function() {
		this.setProperties({
			isSelected: false,
			'publicAPI.isSelected': false
		});
	}
});
