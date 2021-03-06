import Constants from 'textup-frontend/constants';
import DS from 'ember-data';
import HasAuthor from 'textup-frontend/mixins/serializer/has-author';
import HasMedia from 'textup-frontend/mixins/serializer/has-media';

const polymorphicTypeToModelName = {
  TEXT: Constants.MODEL.RECORD_TEXT,
  CALL: Constants.MODEL.RECORD_CALL,
  NOTE: Constants.MODEL.RECORD_NOTE,
};

export function tryNormalizePolymorphicType(hash) {
  if (hash && Object.keys(polymorphicTypeToModelName).indexOf(hash.type) !== -1) {
    hash.type = polymorphicTypeToModelName[hash.type];
  }
}

export default DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin, HasAuthor, HasMedia, {
  attrs: {
    whenCreated: { serialize: false },
    outgoing: { serialize: false },
    hasAwayMessage: { serialize: false },
    hasBeenDeleted: { key: 'isDeleted', serialize: true },
    receipts: { serialize: false },
    contacts: { serialize: false },
    tags: { serialize: false },
  },

  modelNameFromPayloadKey(payloadKey) {
    if (payloadKey === 'records' || payloadKey === 'record') {
      return this._super('record-item');
    } else {
      // let pass through (1) results from subclasses, (2) non-model keys like the `link` object
      return this._super(...arguments);
    }
  },

  payloadKeyFromModelName() {
    return this._super('record');
  },

  _normalizePolymorphicRecord(obj, hash) {
    tryNormalizePolymorphicType(hash);
    return this._super(...arguments);
  },

  serialize(snapshot) {
    const json = this._super(...arguments),
      rItem = snapshot.record,
      modelName = rItem.get(Constants.PROP_NAME.MODEL_NAME);
    json.ids = rItem.get('recipients').map(obj => obj.get('id'));
    json.numbers = rItem.get('newNumberRecipients');
    json.type = Object.keys(polymorphicTypeToModelName).find(
      key => polymorphicTypeToModelName[key] === modelName
    );
    return json;
  },
});
