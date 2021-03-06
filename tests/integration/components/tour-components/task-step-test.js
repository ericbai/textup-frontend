import Ember from 'ember';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import wait from 'ember-test-helpers/wait';
import { moduleForComponent, test } from 'ember-qunit';

moduleForComponent(
  'tour-components/task-step',
  'Integration | Component | tour components/task step',
  {
    integration: true,
  }
);

test('it renders', function(assert) {
  this.setProperties({
    id: 'addContacts',
    text: 'Task Text',
    title: 'Task Title',
    completeTask: () => null,
    stepNumber: 1,
    elementsToPulse: [],
    elementsToPulseMobile: [],
  });

  this.render(hbs`
    {{tour-components/task-step
      id=id
      text=text
      title=title
      completeTask=completeTask
      stepNumber=stepNumber
      elementsToPulse=elementsToPulse
      elementsToPulseMobile=elementsToPulseMobile}}
  `);

  assert.ok(
    this.$()
      .text()
      .includes('Step 1: Task Title')
  );

  this.render(hbs`
    {{#tour-components/task-step
        id=id
        text=text
        title=title
        completeTask=completeTask
        stepNumber=stepNumber
        elementsToPulse=elementsToPulse
        elementsToPulseMobile=elementsToPulseMobile}}
        template block text
    {{/tour-components/task-step}}
  `);

  assert.ok(
    this.$()
      .text()
      .includes('template block text')
  );
});

test('calls doRegister', function(assert) {
  const completeTask = sinon.spy(),
    doRegister = sinon.spy(),
    done = assert.async();

  this.setProperties({
    id: 'addContacts',
    text: 'Task Text',
    title: 'Task Title',
    completeTask,
    doRegister,
    stepNumber: 1,
    elementsToPulse: ['#step1', '#step2'],
    elementsToPulseMobile: ['#step1', '#step2'],
  });

  this.render(hbs`
    <div id='step1'></div>
    <div id='step2'></div>
    {{tour-components/task-step
      id=id
      text=text
      title=title
      completeTask=completeTask
      doRegister=doRegister
      stepNumber=stepNumber
      elementsToPulse=elementsToPulse
      shouldShow=true
      elementsToPulseMobile=elementsToPulseMobile}}
  `);

  assert.ok(doRegister.calledOnce, 'doRegister is called');

  wait()
    .then(() => {
      assert.ok(
        Ember.$('#step1')
          .attr('class')
          .includes('task-element__should-animate-pulse')
      );
      assert.ok(
        Ember.$('#step2')
          .attr('class')
          .includes('task-element__should-animate-pulse')
      );
      Ember.$('.task-step__button--skip')
        .first()
        .click();
      assert.ok(completeTask.calledOnce, 'finishTask is called on skip');

      return wait();
    })
    .then(() => {
      assert.ok(
        !Ember.$('#step1')
          .attr('class')
          .includes('task-element__should-animate-pulse')
      );
      assert.ok(
        !Ember.$('#step2')
          .attr('class')
          .includes('task-element__should-animate-pulse')
      );
      done();
    });
});
