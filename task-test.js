let tasks = [];

class Task {
  // Tasks are similar to pygame's EVENTs.

  // 'timer' is a Timer that operates in milliseconds.
  // 'onExpiry' is a function to be executed once the Timer reaches 0.
  // 'targetObject' is the object for the function to be executed on.
  // 'args' are the arguments passed into the onExpiry function.

  // the Timer does not start by default.
  constructor(label = "label", timer = 1000, targetObject = globalThis, onExpiry = () => {return -1;}, ...args) {
    this.timer = new Timer(timer);
    this.onExpiry = onExpiry;
    this.args = args;
    this.targetObject = targetObject;
    this.label = label;

    if (tasks.some((task) => task.label === this.label)) {
      throw new Error("Task label already exists.");
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(100);
  let testTask = new Task("testTask", 5000, globalThis, testFunction, "the");
  testTask.timer.start();
  tasks.push(testTask);
}

function testFunction() {
  let temp = tasks.find((task) => task.label === "testTask");
  temp.timer.start();
  alert("the");
}

function draw() {
  runTasks();
}

function runTasks() {
  // Checks each task, sees if its timer is expired. if so, executes the specified function.
  for (let task of tasks) {
    if (task.timer.expired()) {
      let targetObject = task.targetObject;
      let onExpiry = task.onExpiry;
      let args = task.args;

      // Calls the onExpiry function on targetObject with the appropriate arguments.
      onExpiry.call(targetObject, ...args);
    }
  }
}