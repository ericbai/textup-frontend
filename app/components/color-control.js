import Ember from 'ember';
import defaultIfAbsent from '../utils/default-if-absent';
import tc from 'npm:tinycolor2';

export default Ember.Component.extend({
  constants: Ember.inject.service(),

  disabled: defaultIfAbsent(false),
  placeholder: defaultIfAbsent('Pick a color on the right'),
  color: defaultIfAbsent('#1BA5E0'),
  contrast: defaultIfAbsent(50),
  scrollSelector: defaultIfAbsent('#container'),
  floatMode: defaultIfAbsent('offsetParent'),

  classNames: 'color-input',

  // Computed properties
  // -------------------

  hexColor: Ember.computed('color', {
    get: function() {
      return Ember.String.htmlSafe(tc(this.get('color')).toHexString());
    },
    set: function(key, value) {
      this.set('color', value);
      return value;
    }
  }),
  complement: Ember.computed('hexColor', function() {
    const tColor = tc(this.get('color')),
      ct = this.get('contrast'),
      complement = tColor.isLight() ? tColor.darken(ct) : tColor.lighten(ct);
    return Ember.String.htmlSafe(complement.toString());
  })
});
