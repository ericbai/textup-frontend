import { notEmpty } from '@ember/object/computed';
import { tryInvoke } from '@ember/utils';
import { getWithDefault, computed } from '@ember/object';
import { assign } from '@ember/polyfills';
import Constants from 'textup-frontend/constants';
import Dirtiable from 'textup-frontend/mixins/model/dirtiable';
import DS from 'ember-data';
import HasReadableIdentifier from 'textup-frontend/mixins/model/has-readable-identifier';
import HasUrlIdentifier from 'textup-frontend/mixins/model/has-url-identifier';
import ModelOwnsPhone, { OwnsPhoneValidations } from 'textup-frontend/mixins/model/owns-phone';
import { validator, buildValidations } from 'ember-cp-validations';

const Validations = buildValidations(
  assign(
    {
      name: { description: 'Name', validators: [validator('presence', true)] },
      hexColor: { description: 'Color', validators: [validator('presence', true)] },
      location: {
        description: 'Location',
        validators: [validator('presence', true), validator('belongs-to')],
      },
    },
    OwnsPhoneValidations
  )
);

export default DS.Model.extend(
  Dirtiable,
  HasReadableIdentifier,
  HasUrlIdentifier,
  ModelOwnsPhone,
  Validations,
  {
    // Overrides
    // ---------

    rollbackAttributes() {
      this.get('actions').clear();
      tryInvoke(getWithDefault(this, 'location.content', {}), 'rollbackAttributes');
      return this._super(...arguments);
    },
    didUpdate() {
      this._super(...arguments);
      this.rollbackAttributes();
    },
    hasManualChanges: computed(
      'ownsPhoneHasManualChanges',
      'hasActions',
      'location.isDirty',
      function() {
        return (
          this.get('ownsPhoneHasManualChanges') ||
          this.get('hasActions') ||
          !!this.get('location.isDirty')
        );
      }
    ),

    // Properties
    // ----------

    name: DS.attr('string'),
    hexColor: DS.attr('string', { defaultValue: Constants.COLOR.BRAND }),
    numMembers: DS.attr('number'),
    org: DS.belongsTo('organization'),
    location: DS.belongsTo('location'),

    actions: computed(() => []),
    hasActions: notEmpty('actions'),

    transferFilter: computed('name', 'location.content.address', function() {
      const name = this.get('name'),
        address = this.get('location.content.address');
      return `${name},${address}`;
    }),
  }
);
