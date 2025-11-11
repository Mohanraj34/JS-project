// TaskFlow — app.js (vanilla JavaScript)

const STORAGE_KEY = 'taskflow_tasks';

// DOM references
const taskForm = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const dateInput = document.getElementById('task-date');
const taskList = document.getElementById('task-list');
const emptyMsg = document.getElementById('empty-msg');
const filters = document.querySelectorAll('.filter');
const dateNode = document.getElementById('date');
const timeNode = document.getElementById('time');
const taskTemplate = document.getElementById('task-template');

let tasks = loadTasks();
let activeFilter = 'all';

function loadTasks() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Failed to parse tasks from storage', e);
        return [];
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function render() {
    taskList.innerHTML = '';
    const filtered = tasks.filter(task => filterTask(task, activeFilter));
    if (filtered.length === 0) {
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
    }

    filtered.forEach(task => {
        const tpl = taskTemplate.content.cloneNode(true);
        const li = tpl.querySelector('.task-item');
        li.dataset.id = task.id;
        if (task.completed) li.classList.add('completed');

        const titleEl = li.querySelector('.task-title');
        titleEl.textContent = task.title;

        const timeEl = li.querySelector('.task-date');
        timeEl.textContent = task.dueDate ? formatDate(task.dueDate) : 'No date';

        const checkbox = li.querySelector('.task-toggle');
        checkbox.checked = !!task.completed;

        taskList.appendChild(tpl);
    });
}

function filterTask(task, filter) {
    if (filter === 'all') return true;
    const today = new Date();
    const taskDate = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : null;
    if (filter === 'today') {
        if (!taskDate) return false;
        return taskDate.toDateString() === today.toDateString();
    }
    if (filter === 'upcoming') {
        if (!taskDate) return false;
        // upcoming means after today
        const t = new Date(taskDate.setHours(0, 0, 0, 0));
        const td = new Date(today.setHours(0, 0, 0, 0));
        return t > td;
    }
    return true;
}

function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Add task
taskForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) return;
    const dueDate = dateInput.value || null;
    const newTask = {
        id: generateId(),
        title,
        dueDate,
        completed: false
    };
    tasks.unshift(newTask);
    saveTasks();
    render();
    taskForm.reset();
    titleInput.focus();
});

// Event delegation for task actions and toggle
taskList.addEventListener('click', e => {
    const li = e.target.closest('.task-item');
    if (!li) return;
    const id = li.dataset.id;
    if (e.target.classList.contains('delete')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        render();
        return;
    }

    if (e.target.classList.contains('edit')) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        // Simple inline edit: use prompt (keeps vanilla JS requirement)
        const updated = prompt('Edit task title:', task.title);
        if (updated !== null) {
            task.title = updated.trim() || task.title;
            saveTasks();
            render();
        }
        return;
    }

    if (e.target.classList.contains('task-toggle') || e.target.closest('.task-main')) {
        const checkbox = li.querySelector('.task-toggle');
        // If click came from label or checkbox, toggle completed
        if (e.target.classList.contains('task-toggle')) {
            const task = tasks.find(t => t.id === id);
            task.completed = checkbox.checked;
            saveTasks();
            render();
        }
    }
});

// Filters
filters.forEach(btn => btn.addEventListener('click', e => {
    filters.forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    activeFilter = e.currentTarget.dataset.filter;
    render();
}));

// Clock / Date
function updateClock() {
    const now = new Date();
    dateNode.textContent = now.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
    timeNode.textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// Initial render
render();