import Ember from 'ember';
import { lowercase as doLowercase } from '../utils/text';

export function lowercase([word] /*, hash*/) {
  return doLowercase(word);
}

export default Ember.Helper.helper(lowercase);
