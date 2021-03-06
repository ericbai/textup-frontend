import AppAccessUtils from 'textup-frontend/utils/app-access';
import Constants from 'textup-frontend/constants';
import Ember from 'ember';
import sinon from 'sinon';
import { mockModel } from 'textup-frontend/tests/helpers/utilities';
import { module, test } from 'qunit';

module('Unit | Utility | app access');

test('trying to find phone owner from url identifier', function(assert) {
  const urlIdent = Math.random(),
    val1 = Ember.Object.create({ [Constants.PROP_NAME.URL_IDENT]: urlIdent }),
    authUserWithActivePhones = Ember.Object.create({ allActivePhoneOwners: [null, val1] }),
    authUserNoActivePhones = Ember.Object.create({
      [Constants.PROP_NAME.URL_IDENT]: urlIdent,
      allActivePhoneOwners: [],
    });

  assert.equal(AppAccessUtils.tryFindPhoneOwnerOrSelfFromUrl(), null);
  assert.equal(
    AppAccessUtils.tryFindPhoneOwnerOrSelfFromUrl(authUserWithActivePhones, urlIdent),
    val1
  );
  assert.equal(
    AppAccessUtils.tryFindPhoneOwnerOrSelfFromUrl(authUserNoActivePhones, urlIdent),
    authUserNoActivePhones
  );
});

test('determining if provided phone owner is active', function(assert) {
  const staff1 = mockModel(1, Constants.MODEL.STAFF, {
      phone: { content: { isActive: true } },
      isStaff: true,
    }),
    staff2 = mockModel(1, Constants.MODEL.STAFF, { phone: { content: { isActive: true } } }),
    team1 = mockModel(1, Constants.MODEL.TEAM, { phone: { content: { isActive: true } } });

  assert.equal(AppAccessUtils.isActivePhoneOwner(), false);
  assert.equal(AppAccessUtils.isActivePhoneOwner(staff1), true);
  assert.equal(AppAccessUtils.isActivePhoneOwner(staff2), false);
  assert.equal(AppAccessUtils.isActivePhoneOwner(team1), true);
});

test('determining if authUser is an admin', function(assert) {
  const inactiveAdmin = mockModel(1, Constants.MODEL.STAFF, { isAdmin: true }),
    activeAdmin = mockModel(2, Constants.MODEL.STAFF, {
      isAdmin: true,
      org: { content: { isApproved: true } },
    });

  assert.notOk(AppAccessUtils.canStaffAccessAdminDashboard());
  assert.notOk(AppAccessUtils.canStaffAccessAdminDashboard('not a staff'));
  assert.notOk(AppAccessUtils.canStaffAccessAdminDashboard(inactiveAdmin));
  assert.ok(AppAccessUtils.canStaffAccessAdminDashboard(activeAdmin));
});

test('determining the appropriate location in the app based on available phone owners', function(assert) {
  const transitionTo = sinon.spy(),
    phoneOwner1 = { name: Math.random(), phone: { content: { isActive: true } } };
  const mainRoute = Ember.Object.create({ transitionTo, routeName: 'main' }),
    adminIndexRoute = Ember.Object.create({ transitionTo, routeName: 'admin.index' }),
    noneIndexRoute = Ember.Object.create({ transitionTo, routeName: 'none.index' });
  const noneUser = mockModel(1, Constants.MODEL.STAFF, { allActivePhoneOwners: [] }),
    staffUser = mockModel(2, Constants.MODEL.STAFF, { allActivePhoneOwners: [phoneOwner1] }),
    adminOnlyUser = mockModel(3, Constants.MODEL.STAFF, {
      allActivePhoneOwners: [],
      isAdmin: true,
      org: { content: { isApproved: true } },
    });

  AppAccessUtils.determineAppropriateLocation();
  assert.equal(transitionTo.callCount, 0);

  AppAccessUtils.determineAppropriateLocation(noneIndexRoute, noneUser);
  assert.equal(transitionTo.callCount, 0, 'do not transition if already on `none` route');

  AppAccessUtils.determineAppropriateLocation(mainRoute, noneUser);
  assert.equal(transitionTo.callCount, 1);
  assert.ok(transitionTo.firstCall.calledWith('none'));

  AppAccessUtils.determineAppropriateLocation(adminIndexRoute, staffUser);
  assert.equal(transitionTo.callCount, 2);
  assert.ok(transitionTo.secondCall.calledWith('main', phoneOwner1));

  AppAccessUtils.determineAppropriateLocation(adminIndexRoute, adminOnlyUser);
  assert.equal(transitionTo.callCount, 2, 'do not transition if already on `admin` route');

  AppAccessUtils.determineAppropriateLocation(mainRoute, adminOnlyUser);
  assert.equal(transitionTo.callCount, 3);
  assert.ok(transitionTo.thirdCall.calledWith('admin'));
});
