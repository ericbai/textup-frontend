import Ember from 'ember';
import moment from 'moment';

export function dateIsSameDay([date1, date2] /*, hash*/ ) {
    return moment(date1).isSame(date2, 'day');
}

export default Ember.Helper.helper(dateIsSameDay);