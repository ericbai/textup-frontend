import DS from 'ember-data';
import Ember from 'ember';
import RecordItem from './record-item';
import { validator, buildValidations } from 'ember-cp-validations';

const { computed, typeOf, get } = Ember,
  Validations = buildValidations({
    numRecipients: validator('inclusion', {
      in: [1],
      message: 'should have exactly one recipient'
    }),
    'contactRecipients.length': validator('has-any', {
      also: ['sharedContactRecipients.length', 'tagRecipients.length'],
      dependentKeys: ['numRecipients'],
      description: 'a contact, a shared contact, or a tag'
    }),
    noteContents: validator('has-any', {
      also: ['media.hasElements', 'location.content'],
      dependentKeys: ['media.hasElements'],
      description: 'contents, images, or a location'
    })
  });

export default RecordItem.extend(Validations, {
  // Overrides
  // ---------

  rollbackAttributes() {
    this._super(...arguments);
    this.set('_addAfterDate', null);
  },
  hasManualChanges: computed('media.isDirty', 'location.isDirty', function() {
    return this.get('media.isDirty') || this.get('location.isDirty');
  }),

  // Properties
  // ----------

  whenChanged: DS.attr('date'),
  hasBeenDeleted: DS.attr('boolean'),
  isReadOnly: DS.attr('boolean'),

  location: DS.belongsTo('location'), // hasOne

  hasRevisions: computed.notEmpty('_revisions'),
  revisions: computed.sort('_revisions', '_revisionsSorting'),

  addAfterDate: computed.readOnly('_addAfterDate'),

  // Private properties
  // ------------------

  _revisions: DS.hasMany('record-note-revision'),
  _revisionsSorting: ['whenChanged:desc'],
  _addAfterDate: null,

  // Methods
  // -------

  addAfter(rItem) {
    if (typeOf(rItem) !== 'object' && typeOf(rItem) !== 'instance') {
      return false;
    }
    this.set('_addAfterDate', get(rItem, 'whenCreated'));
    return true;
  }
});