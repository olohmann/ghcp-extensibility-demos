document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const todoInput = document.getElementById('todo-input');
  const addTodoButton = document.getElementById('add-todo');
  const todoList = document.getElementById('todo-list');
  
  // Fetch and display all todos on page load
  fetchTodos();
  
  // Event listeners
  addTodoButton.addEventListener('click', addTodo);
  todoInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      addTodo();
    }
  });
  
  // Functions
  async function fetchTodos() {
    try {
      const response = await fetch('/api/todos');
      const todos = await response.json();
      
      // Clear the list
      todoList.innerHTML = '';
      
      // Display todos
      todos.forEach(todo => {
        addTodoToDOM(todo);
      });
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  }
  
  async function addTodo() {
    const text = todoInput.value.trim();
    
    if (text === '') return;
    
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      const newTodo = await response.json();
      addTodoToDOM(newTodo);
      
      // Clear the input field
      todoInput.value = '';
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  }
  
  async function toggleTodoCompletion(id, completed) {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update todo');
      }
    } catch (error) {
      console.error('Error toggling todo completion:', error);
    }
  }
  
  async function deleteTodo(id) {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (todoElement) {
          todoElement.remove();
        }
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  }
  
  function addTodoToDOM(todo) {
    const li = document.createElement('li');
    li.classList.add('todo-item');
    li.dataset.id = todo.id;
    
    if (todo.completed) {
      li.classList.add('completed');
    }
    
    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
      <span class="todo-text">${todo.text}</span>
      <button class="todo-delete">✖</button>
    `;
    
    // Add event listeners to the todo item
    const checkbox = li.querySelector('.todo-checkbox');
    const deleteButton = li.querySelector('.todo-delete');
    
    checkbox.addEventListener('change', () => {
      const completed = checkbox.checked;
      toggleTodoCompletion(todo.id, completed);
      li.classList.toggle('completed', completed);
    });
    
    deleteButton.addEventListener('click', () => {
      deleteTodo(todo.id);
    });
    
    todoList.appendChild(li);
  }
});