import config from 'textup-frontend/config/environment';
import Ember from 'ember';
import StorageUtils from 'textup-frontend/utils/storage';
import TaskData from 'textup-frontend/data/task-data';

const { assign, computed, set, isPresent } = Ember;

export const TASK_ID_KEY = 'id';
export const TASK_STATUS_KEY = 'status';
export const TASK_STEP_NUMBER_KEY = 'stepNumber';

export default Ember.Service.extend({
  notifications: Ember.inject.service(),
  authService: Ember.inject.service(),

  init() {
    this._super(...arguments);
    const tasks = [];
    TaskData.forEach((task, index) => {
      tasks.pushObject(
        assign({}, task, {
          [TASK_STATUS_KEY]: this.getTaskStatus(task[TASK_ID_KEY]),
          [TASK_STEP_NUMBER_KEY]: index + 1,
        })
      );
    });
    this.set('tasks', tasks);
    // initialize `_shouldShowTaskManager` and ensure it gets re-initialized on future logins
    this._setShouldShowFromStorage();
    this.get('authService').on(
      config.events.auth.success,
      this._setShouldShowFromStorage.bind(this)
    );
  },

  // Properties
  // ----------

  taskManager: null,
  tasks: null,
  firstIncompleteTask: computed(`tasks.@each.${TASK_STATUS_KEY}`, function() {
    return this.get('tasks').find(task => task && task[TASK_STATUS_KEY] === false);
  }),
  shouldShowTaskManager: computed('_shouldShowTaskManager', function() {
    const shouldShow = this.get('_shouldShowTaskManager');
    return shouldShow === null || shouldShow;
  }),

  // Methods
  // -------

  getTaskStatus(taskId) {
    return (
      window.localStorage.getItem(StorageUtils.taskKey(this.get('_username'), taskId)) ===
      StorageUtils.TRUE
    );
  },
  startCompleteTask(taskId) {
    if (taskId === this.get('firstIncompleteTask.id')) {
      const taskManager = this.get('taskManager');
      if (taskManager) {
        taskManager.actions.startCompleteTask(taskId);
      }
    }
  },
  finishCompleteTask(taskId) {
    this._setTaskStatus(taskId, true);
  },
  closeTaskManager() {
    this.get('notifications').info(
      'Access the “Getting Started” tour at anytime through <button class="btn-link">the Support menu</button>.',
      { htmlContent: true, onClick: this._openSupportSlideout.bind(this) }
    );
    this.set('_shouldShowTaskManager', false);
    window.localStorage.setItem(
      StorageUtils.showManagerKey(this.get('_username')),
      StorageUtils.FALSE
    );
  },
  resetTasks() {
    this.get('tasks').forEach(task => this._setTaskStatus(task[TASK_ID_KEY], false));
    window.localStorage.setItem(
      StorageUtils.showManagerKey(this.get('_username')),
      StorageUtils.TRUE
    );
    this.set('_shouldShowTaskManager', true);
  },

  // Internal
  // --------

  _username: computed.alias('authService.authUser.username'),
  _shouldShowTaskManager: null,

  _setShouldShowFromStorage() {
    const shouldShow = window.localStorage.getItem(
      StorageUtils.showManagerKey(this.get('_username'))
    );
    this.set('_shouldShowTaskManager', shouldShow !== StorageUtils.FALSE);
  },
  _setTaskStatus(taskId, status) {
    const task = this.get('tasks').find(task => task && task[TASK_ID_KEY] === taskId);
    if (task) {
      window.localStorage.setItem(
        StorageUtils.taskKey(this.get('_username'), taskId),
        status ? StorageUtils.TRUE : StorageUtils.FALSE
      );
      set(task, TASK_STATUS_KEY, status);
    }
  },
  _openSupportSlideout() {
    Ember.getOwner(this)
      .lookup('route:main')
      .send('startFeedbackSlideout');
    this.get('notifications').clearAll();
  },
});
