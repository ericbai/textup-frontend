import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('feedback-switcher', 'Integration | Component | feedback switcher', {
  integration: true,
});

test('rendering', function(assert) {
  const src = 'https://www.textup.org/embedded-search';
  const text = 'Search the TextUp Support Hub';
  this.setProperties({ src, text });
  this.render(hbs`{{feedback-switcher src=src text=text}}`);
  assert.ok(this.$('.feedback-switcher').length, 'did render');

  // requires src input
  assert.throws(() => this.render(hbs`{{feedback-switcher}}`));
});

test('displaying when cordova is active', function(assert) {
  window.cordova = true;
  const src = 'https://www.textup.org/embedded-search';
  const text = 'Search the TextUp Support Hub';
  this.setProperties({ src, text });
  this.render(hbs`{{feedback-switcher src=src text=text}}`);

  assert.ok(this.$('a').length, 'did render link');
});

test('displaying when cordova not is active', function(assert) {
  window.cordova = false;
  const src = 'https://www.textup.org/embedded-search';
  const text = 'Search the TextUp Support Hub';
  this.setProperties({ src, text });
  this.render(hbs`{{feedback-switcher src=src text=text}}`);

  assert.equal(
    this.$('span')
      .text()
      .trim(),
    text
  );
  assert.ok(this.$('iframe').length, 'did render iframe');
});
