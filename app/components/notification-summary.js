import Component from '@ember/component';
import Notification from 'textup-frontend/models/notification';
import PropTypeMixin, { PropTypes } from 'ember-prop-types';
import { notEmpty } from '@ember/object/computed';

export default Component.extend(PropTypeMixin, {
  propTypes: Object.freeze({
    notification: PropTypes.instanceOf(Notification),
    onOpen: PropTypes.func,
  }),

  classNames: 'notification-summary',

  // Internal properties
  // -------------------

  _hasOnOpen: notEmpty('onOpen'),
});
