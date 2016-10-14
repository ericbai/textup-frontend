import Ember from 'ember';
import defaultIfAbsent from '../../utils/default-if-absent';
import Validated from '../../mixins/validated-component';

export default Ember.Component.extend(Validated, {

	numbers: defaultIfAbsent([]),
	newNumber: defaultIfAbsent(''),
	readonly: defaultIfAbsent(false),
	inPlace: defaultIfAbsent(false),

	classNames: 'sortable-group-numbers',

	// Computed properties
	// -------------------

	hasNumbers: Ember.computed.notEmpty('numbers'),
	$validateFields: 'input',
	$errorNeighbor: Ember.computed(function() {
		return this.$('.existing-numbers');
	}),

	// Events
	// ------

	didInsertElement: function() {
		this._super(...arguments);
		Ember.run.scheduleOnce('afterRender', this, this._deepCopyNumbers);
	},
	didUpdateAttrs: function() {
		this._super(...arguments);
		if (this.get('_prevNumbers') !== this.get('numbers')) {
			Ember.run.scheduleOnce('afterRender', this, this._deepCopyNumbers);
		}
	},
	// need to do this to trigger changedAttributes for numbers
	_deepCopyNumbers: function() {
		if (this.get('inPlace') || this.isDestroying || this.isDestroyed) {
			return;
		}
		// true passed to copy for DEEP COPY so that before and after
		// in changed attributes does not return the same mutated version
		const newArray = Ember.copy(this.get('numbers'), true);
		this.set('numbers', newArray);
		this.set('_prevNumbers', newArray);
	},

	// Actions
	// -------

	actions: {
		storeNewNumber: function(val) {
			this.set('newNumber', val);
		},
		addNewNumber: function(val, isValid) {
			if (isValid) {
				this.get('numbers').pushObject({
					number: val
				});
				this.doValidate();
				this.set('newNumber', '');
			}
		},
		removeNumber: function(index) {
			this.get('numbers').removeAt(index);
			this.doValidate();
		},
		removeIfEmpty: function(index, val) {
			if (Ember.isBlank(val)) {
				this.send('removeNumber', index);
			}
		},
		updateNumber: function(numObj, index, newVal) {
			Ember.set(numObj, 'number', newVal);
		},
		reorderNumbers: function(itemModels) {
			this.set('numbers', itemModels);
		},
	}
});