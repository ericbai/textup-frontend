import Ember from 'ember';
import PropTypesMixin, { PropTypes } from 'ember-prop-types';

const { computed } = Ember;

export default Ember.Component.extend(PropTypesMixin, {
  propTypes: {
    count: PropTypes.number,
    hideBadgeIfNone: PropTypes.bool
  },
  getDefaultProps() {
    return { count: 0, hideBadgeIfNone: true };
  },

  tagName: 'span',
  classNames: 'count-badge',
  classNameBindings: '_hideBadge:count-badge--no-badge',

  // Internal properties
  // -------------------

  _hideBadge: computed('hideBadgeIfNone', 'count', function() {
    return !this.get('count') && this.get('hideBadgeIfNone');
  }),
  _count: computed('count', function() {
    const count = this.get('count');
    return count > 100 ? '99+' : count;
  })
});
