import Ember from 'ember';
import DS from 'ember-data';

export default Ember.Mixin.create(DS.EmbeddedRecordsMixin, {
  attrs: {
    media: { deserialize: 'records', serialize: false }
  },

  serialize(snapshot) {
    const json = this._super(...arguments) || {};
    // record may not always have media so we need to ensure null-safety here
    json.doMediaActions = (snapshot.record.get('media.pendingChanges') || [])
      .map(change => change.serialize());
    return json;
  }
});
