import Ember from 'ember';
import PropertyUtils from 'textup-frontend/utils/property';
import PropTypesMixin, { PropTypes } from 'ember-prop-types';

const { computed, tryInvoke, run } = Ember;

export default Ember.Component.extend(PropTypesMixin, {
  propTypes: {
    doUpdateVal: PropTypes.func.isRequired,
    doValidate: PropTypes.func,
    val: PropTypes.oneOfType([PropTypes.string, PropTypes.null]),
    totalPadDigits: PropTypes.number,
    focusOnInit: PropTypes.bool,
  },
  getDefaultProps() {
    return { totalPadDigits: 4, focusOnInit: false };
  },

  classNames: ['single-body', 'lock-pad'],
  classNameBindings: '_isError:lock-pad--error',

  didInsertElement() {
    this._super(...arguments);
    if (this.get('focusOnInit')) {
      run.scheduleOnce('afterRender', this, this._focusOnControl);
    }
  },
  didUpdateAttrs() {
    this._super(...arguments);
    run.debounce(this, this._tryCheckValidate, 500);
  },

  // Internal properties
  // -------------------

  _hasDoValidate: computed.notEmpty('doValidate'),
  _numberControlClass: computed('elementId', function() {
    return `lock-pad__control--${this.elementId}`;
  }),
  _valLength: computed('val.length', function() {
    return this.get('val.length') || 0;
  }),
  _valIndices: computed('totalPadDigits', function() {
    return Array(this.get('totalPadDigits')).fill();
  }),

  // Internal handlers
  // -----------------

  _focusOnControl() {
    this.$('.' + this.get('_numberControlClass')).focus();
  },
  _tryCheckValidate() {
    if (
      this.get('_hasDoValidate') &&
      this.get('val.length') >= this.get('totalPadDigits') &&
      !this.get('isDestroyed') &&
      !this.get('isDestroying')
    ) {
      this.set('_isLoading', true);
      PropertyUtils.ensurePromise(tryInvoke(this, 'doValidate', [this.get('val')]))
        .catch(() => run.join(() => this.set('_isError', true)))
        .finally(() => run.join(() => this.set('_isLoading', false)));
    }
  },
  _doUpdateVal(newVal) {
    this.set('_isError', false);
    tryInvoke(this, 'doUpdateVal', [newVal]);
  },
});
