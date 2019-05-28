import Component from '@ember/component';
import PropTypesMixin, { PropTypes } from 'ember-prop-types';
import Tag from 'textup-frontend/models/tag';
import { computed } from '@ember/object';

export default Component.extend(PropTypesMixin, {
  propTypes: Object.freeze({
    tag: PropTypes.instanceOf(Tag).isRequired,
    backRouteName: PropTypes.string.isRequired,
    linkParams: PropTypes.array,
    onEdit: PropTypes.func,
    onExport: PropTypes.func,
  }),
  getDefaultProps() {
    return { linkParams: [] };
  },

  // Internal properties
  // -------------------

  _linkParams: computed('backRouteName', 'linkParams', function() {
    return [this.get('backRouteName'), ...this.get('linkParams')];
  }),
});
