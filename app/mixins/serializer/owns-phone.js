import TypeUtils from 'textup-frontend/utils/type';
import Constants from 'textup-frontend/constants';
import DS from 'ember-data';
import Ember from 'ember';

const { get, merge } = Ember;

export default Ember.Mixin.create(DS.EmbeddedRecordsMixin, {
  attrs: {
    phone: { deserialize: 'records', serialize: 'records' },
  },

  serialize(snapshot) {
    const json = this._super(...arguments),
      rec1 = snapshot.record,
      data = rec1.get('hasPhoneActionData') ? rec1.get('phoneActionData') : Object.create(null),
      doActions = [];
    switch (rec1.get('phoneAction')) {
      case Constants.ACTION.PHONE.CHANGE_NUMBER:
        doActions.pushObject(changeToNewNumber(data));
        break;
      case Constants.ACTION.PHONE.DEACTIVATE:
        doActions.pushObject(deactivate());
        break;
      case Constants.ACTION.PHONE.TRANSFER:
        doActions.pushObject(transfer(data));
        break;
    }
    if (doActions.length) {
      json.phone = merge(json.phone || Object.create(null), { doPhoneActions: doActions });
    }
    return json;
  },
});

function changeToNewNumber(data) {
  if (get(data, Constants.PROP_NAME.NEW_NUMBER_ID)) {
    return { action: 'NUMBYID', numberId: get(data, Constants.PROP_NAME.NEW_NUMBER_ID) };
  } else if (get(data, Constants.PROP_NAME.AVAILABLE_NUMBER)) {
    return { action: 'NUMBYNUM', number: get(data, Constants.PROP_NAME.AVAILABLE_NUMBER) };
  } else {
    return Object.create(null);
  }
}

function deactivate() {
  return { action: 'DEACTIVATE' };
}

function transfer(targetModel) {
  const type = TypeUtils.isStaff(targetModel) ? 'INDIVIDUAL' : 'GROUP';
  return { action: 'TRANSFER', id: get(targetModel, 'id'), type };
}
