import Ember from 'ember';
import PropTypesMixin, { PropTypes } from 'ember-prop-types';

const { computed, tryInvoke, RSVP, run } = Ember;

export default Ember.Component.extend(PropTypesMixin, {
  propTypes: {
    doRegister: PropTypes.func.isRequired,
    onDestroy: PropTypes.func.isRequired,
    title: PropTypes.string,
  },
  getDefaultProps() {
    return { title: '' };
  },

  classNames: 'tab-container-item pending',

  init() {
    this._super(...arguments);
    tryInvoke(this, 'doRegister', [this.get('_publicAPI')]);
  },
  didReceiveAttrs() {
    this._super(...arguments);
    run.scheduleOnce('afterRender', () => this.set('_publicAPI.title', this.get('title')));
  },
  willDestroyElement() {
    this._super(...arguments);
    tryInvoke(this, 'onDestroy', [this.get('_publicAPI')]);
  },

  // Internal properties
  // -------------------

  _publicAPI: computed(function() {
    return {
      title: this.get('title'),
      actions: {
        initialize: this._initialize.bind(this),
        hide: this._hide.bind(this),
        show: this._show.bind(this),
      },
    };
  }),

  _initialize(shouldShow) {
    const $el = this.$();
    if (shouldShow) {
      this._show().then(() => $el.removeClass('pending'));
    } else {
      this._hide().then(() => $el.removeClass('pending'));
    }
  },
  _show() {
    return new RSVP.Promise(resolve => this.$().fadeIn('fast', resolve));
  },
  _hide() {
    return new RSVP.Promise(resolve => this.$().fadeOut('fast', resolve));
  },
});
