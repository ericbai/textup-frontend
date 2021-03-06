import Ember from 'ember';
import PropTypesMixin, { PropTypes } from 'ember-prop-types';
import { formatSecondsAsTimeElapsed } from 'textup-frontend/utils/time';
import { getWidthProportionFromLeft } from 'textup-frontend/utils/bounds';

const { computed, tryInvoke } = Ember;

export default Ember.Component.extend(PropTypesMixin, {
  propTypes: {
    message: PropTypes.oneOfType([PropTypes.null, PropTypes.string]),
    currentNumSeconds: PropTypes.oneOfType([PropTypes.null, PropTypes.number]),
    maxNumSeconds: PropTypes.oneOfType([PropTypes.null, PropTypes.number]),
    onSelect: PropTypes.func
  },

  classNames: 'audio-control__display',

  click(event) {
    this._handleSelect(event.clientX, event.clientY, event);
  },
  touchEnd(event) {
    const touchObj = (event.touches || [])[0];
    if (touchObj) {
      this._handleSelect(touchObj.clientX, touchObj.clientY, event);
    }
  },

  // Internal properties
  // -------------------

  _timestamp: computed('currentNumSeconds', 'maxNumSeconds', function() {
    const currentNumSeconds = this.get('currentNumSeconds'),
      maxNumSeconds = this.get('maxNumSeconds');
    if (!currentNumSeconds && !maxNumSeconds) {
      return null;
    }
    const current = formatSecondsAsTimeElapsed(Math.min(currentNumSeconds, maxNumSeconds)),
      max = formatSecondsAsTimeElapsed(maxNumSeconds),
      timestamp = [];
    if (current) {
      timestamp.pushObject(current);
    }
    if (max) {
      timestamp.pushObject(max);
    }
    return timestamp.join(' / ');
  }),
  _progressWidth: computed('currentNumSeconds', 'maxNumSeconds', function() {
    const currentNumSeconds = this.get('currentNumSeconds'),
      maxNumSeconds = this.get('maxNumSeconds');
    if (!currentNumSeconds && !maxNumSeconds) {
      return null;
    }
    let widthVal = 0;
    if (currentNumSeconds >= maxNumSeconds) {
      widthVal = 100;
    } else {
      widthVal = Math.max(currentNumSeconds, 0) / maxNumSeconds * 100;
    }
    return Ember.String.htmlSafe(`width: ${widthVal}%;`);
  }),

  // Internal handlers
  // -----------------

  _handleSelect(eventX, eventY, event) {
    const { left, top, width, height } = this.get('element').getBoundingClientRect(),
      widthProportion = getWidthProportionFromLeft(eventX, eventY, left, top, width, height);
    if (widthProportion > 0) {
      tryInvoke(this, 'onSelect', [widthProportion, event]);
    }
  }
});
