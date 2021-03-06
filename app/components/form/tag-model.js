import Ember from 'ember';
import PropTypesMixin, { PropTypes } from 'ember-prop-types';
import Tag from 'textup-frontend/models/tag';

export default Ember.Component.extend(PropTypesMixin, {
  propTypes: {
    tag: PropTypes.instanceOf(Tag),
  },

  classNames: 'form',
});
