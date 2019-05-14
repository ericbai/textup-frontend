import Ember from 'ember';
import HasAppRoot from 'textup-frontend/mixins/component/has-app-root';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';

const HasAppRootComponent = Ember.Component.extend(HasAppRoot);

moduleForComponent('', 'Integration | Mixin | component/has app root', {
  integration: true,
});

test('getting app root when not testing', function(assert) {
  const owner = Ember.getOwner(this),
    app = owner.lookup('application:main'),
    appRootId = 'testing-app-root',
    originalRootElement = app.get('rootElement'),
    oldTestingVal = Ember.testing,
    getOwnerStub = sinon.stub(Ember, 'getOwner').returns(owner);
  app.set('rootElement', `#${appRootId}`);

  this.setProperties({ appRootId });
  this.render(hbs`<div id={{appRootId}}></div>`);

  Ember.testing = false;
  const obj = HasAppRootComponent.create();

  assert.equal(obj.get('_root').attr('id'), appRootId);
  assert.equal(obj.get('_root').length, 1);

  getOwnerStub.restore();
  Ember.testing = oldTestingVal;
  app.set('rootElement', originalRootElement);
});

test('getting app root when testing', function(assert) {
  const oldTestingVal = Ember.testing;

  Ember.testing = true;
  const obj = HasAppRootComponent.create();

  assert.equal(obj.get('_root').attr('id'), 'ember-testing');
  assert.equal(obj.get('_root').length, 1);

  Ember.testing = oldTestingVal;
});
