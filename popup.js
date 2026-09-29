const taskInput = document.getElementById("task-input");
const dueDateInput = document.getElementById("due-date");
const prioritySelect = document.getElementById("priority");
const categorySelect = document.getElementById("category");
const addTaskButton = document.getElementById("add-task");
const taskList = document.getElementById("task-list");
const completedTaskList = document.getElementById("completed-task-list");
const progressBarFill = document.getElementById("progress-bar-fill");
const progressPercentage = document.getElementById("progress-percentage");
const themeToggle = document.getElementById("theme-toggle");
const viewRemainingTasksButton = document.getElementById("view-remaining-tasks");
const viewCompletedTasksButton = document.getElementById("view-completed-tasks");
const remainingTasksContainer = document.getElementById("remaining-tasks-container");
const completedTasksContainer = document.getElementById("completed-tasks-container");
const searchBar = document.getElementById("search-bar");

let currentTheme = "light"; // Default theme is light

// Load tasks from storage
chrome.storage.local.get(["tasks"], (result) => {
  const tasks = result.tasks || [];
  tasks.forEach(addTaskToUI);
  updateProgressBar();
  checkOverdueTasks();
});

// Toggle Theme (Light/Dark)
themeToggle.addEventListener("click", () => {
  if (currentTheme === "light") {
    document.body.style.background = "#1e1e1e";
    document.body.style.color = "#fff";
    document.querySelector("h3").style.color = "#ffeb3b";
    currentTheme = "dark";
    themeToggle.textContent = "Switch to Light Theme";
  } else {
    document.body.style.background = "linear-gradient(135deg, #f6f8ff, #e3ebff)";
    document.body.style.color = "#333";
    document.querySelector("h3").style.color = "#007bff";
    currentTheme = "light";
    themeToggle.textContent = "Switch to Dark Theme";
  }
});

// Add new task
addTaskButton.addEventListener("click", () => {
  const task = taskInput.value.trim();
  const dueDate = dueDateInput.value;
  const priority = prioritySelect.value;
  const category = categorySelect.value;

  if (!task || !dueDate) {
    alert("Task, Due Date, and Priority are required!");
    return;
  }

 const taskObj = {
  id: Date.now(),
  task,
  dueDate,
  priority,
  category,
  completed: false,
  subtasks: []
};
  // Save to storage
  chrome.storage.local.get(["tasks"], (result) => {
    const tasks = result.tasks || [];
    tasks.push(taskObj);
    chrome.storage.local.set({ tasks });
  });

  addTaskToUI(taskObj);
  taskInput.value = "";
  dueDateInput.value = "";
  prioritySelect.value = "Low";
  categorySelect.value = "Work";
  updateProgressBar();
});

// Add task to UI
function addTaskToUI(taskObj) {
  const { id, task, dueDate, priority, category, completed } = taskObj;

  const li = document.createElement("li");
  li.className = `task ${completed ? "completed" : ""} priority-${priority.toLowerCase()}`;
  li.innerHTML = `
    <div>
      <span><strong>Task:</strong> ${task}</span><br>
      <span><strong>Due:</strong> ${new Date(dueDate).toLocaleString()}</span><br>
      <span><strong>Category:</strong> ${category}</span><br>
      <span><strong>Priority:</strong> ${priority}</span>
    </div>
    <button class="remove-task-btn">X</button>
    <button class="mark-completed-btn">Mark as Completed</button>
  `;

  // Add event listener to remove button
  const removeButton = li.querySelector(".remove-task-btn");
  removeButton.addEventListener("click", () => removeTask(id));

  // Add event listener to mark as completed button
  const markCompletedButton = li.querySelector(".mark-completed-btn");
  markCompletedButton.addEventListener("click", () => markAsCompleted(id));

  if (completed) {
    completedTaskList.appendChild(li);
  } else {
    taskList.appendChild(li);
  }
}

// Mark task as completed
function markAsCompleted(id) {
  chrome.storage.local.get(["tasks"], (result) => {
    const tasks = result.tasks || [];
    const updatedTasks = tasks.map((task) => {
      if (task.id === id) {
        task.completed = true;
      }
      return task;
    });
    chrome.storage.local.set({ tasks: updatedTasks });
    document.location.reload(); // Reload to update the UI
  });
}

// Remove task
function removeTask(id) {
  chrome.storage.local.get(["tasks"], (result) => {
    const tasks = result.tasks || [];
    // Filter out the task using the unique ID
    const newTasks = tasks.filter((t) => t.id !== id);
    chrome.storage.local.set({ tasks: newTasks });
    document.location.reload(); // Reload to update the UI
  });
}

// Filter tasks based on search query
searchBar.addEventListener("input", (event) => {
  const searchQuery = event.target.value.toLowerCase();

  // Filter Remaining Tasks
  const remainingTasks = document.querySelectorAll("#task-list .task");
  remainingTasks.forEach((task) => {
    const taskText = task.innerText.toLowerCase();
    if (taskText.includes(searchQuery)) {
      task.style.display = "block"; // Show task if it matches search
    } else {
      task.style.display = "none"; // Hide task if it doesn't match search
    }
  });

  // Filter Completed Tasks
  const completedTasks = document.querySelectorAll("#completed-task-list .task");
  completedTasks.forEach((task) => {
    const taskText = task.innerText.toLowerCase();
    if (taskText.includes(searchQuery)) {
      task.style.display = "block"; // Show task if it matches search
    } else {
      task.style.display = "none"; // Hide task if it doesn't match search
    }
  });
});

// Update the progress bar based on the number of tasks completed
function updateProgressBar() {
  chrome.storage.local.get(["tasks"], (result) => {
    const tasks = result.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;

    if (totalTasks > 0) {
      const completionPercentage = Math.floor((completedTasks / totalTasks) * 100);
      progressBarFill.style.width = `${completionPercentage}%`;
      progressPercentage.textContent = `${completionPercentage}%`;
    }
  });
}

// Switch between remaining and completed tasks views
viewRemainingTasksButton.addEventListener("click", () => {
  remainingTasksContainer.style.display = "block";
  completedTasksContainer.style.display = "none";
  viewRemainingTasksButton.style.backgroundColor = "#007bff";
  viewCompletedTasksButton.style.backgroundColor = "#ccc";
});

viewCompletedTasksButton.addEventListener("click", () => {
  remainingTasksContainer.style.display = "none";
  completedTasksContainer.style.display = "block";
  viewRemainingTasksButton.style.backgroundColor = "#ccc";
  viewCompletedTasksButton.style.backgroundColor = "#007bff";
});

// Check overdue tasks periodically and notify
function checkOverdueTasks() {
  chrome.storage.local.get(["tasks"], (result) => {
    const tasks = result.tasks || [];
    const now = new Date();

    tasks.forEach((taskObj) => {
      if (new Date(taskObj.dueDate) < now && !taskObj.completed) {
        const timePassed = Math.floor(
          (now - new Date(taskObj.dueDate)) / (1000 * 60)
        );
        showNotification(taskObj.task, taskObj.priority, timePassed);
      }
    });
  });

  setTimeout(checkOverdueTasks, 60000); // Check every minute
}

// Show overdue task notification with custom message based on priority
function showNotification(task, priority, timePassed) {
  let message = '';

  // Custom notification messages based on priority
  if (priority === 'High') {
    message = timePassed > 60
      ? `Urgent! This high-priority task is overdue by ${Math.floor(timePassed / 60)} hours!`
      : `This high-priority task is overdue by ${timePassed} minutes!`;
  } else if (priority === 'Medium') {
    message = timePassed > 60
      ? `This medium-priority task is overdue by ${Math.floor(timePassed / 60)} hours.`
      : `This medium-priority task is overdue by ${timePassed} minutes.`;
  } else {
    message = timePassed > 60
      ? `This low-priority task is overdue by ${Math.floor(timePassed / 60)} hours.`
      : `This low-priority task is overdue by ${timePassed} minutes.`;
  }

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: `Overdue Task: ${priority} Priority`,
    message: `Task: "${task}"\n${message}`,
    priority: 2,
  });
}
