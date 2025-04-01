const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// In-memory todo storage
let todos = [
  { id: 1, text: 'Learn Express.js', completed: false },
  { id: 2, text: 'Build a todo app', completed: false }
];

// API endpoints
// Get all todos
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// Get a single todo by ID
app.get('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find(todo => todo.id === id);
  
  if (todo) {
    res.json(todo);
  } else {
    res.status(404).json({ message: 'Todo not found' });
  }
});

// Create a new todo
app.post('/api/todos', (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }
  
  const newId = todos.length > 0 ? Math.max(...todos.map(todo => todo.id)) + 1 : 1;
  const newTodo = { id: newId, text, completed: false };
  
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// Update a todo
app.put('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { text, completed } = req.body;
  const todoIndex = todos.findIndex(todo => todo.id === id);
  
  if (todoIndex === -1) {
    return res.status(404).json({ message: 'Todo not found' });
  }
  
  todos[todoIndex] = { 
    ...todos[todoIndex], 
    text: text !== undefined ? text : todos[todoIndex].text, 
    completed: completed !== undefined ? completed : todos[todoIndex].completed 
  };
  
  res.json(todos[todoIndex]);
});

// Delete a todo
app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todoIndex = todos.findIndex(todo => todo.id === id);
  
  if (todoIndex === -1) {
    return res.status(404).json({ message: 'Todo not found' });
  }
  
  const deletedTodo = todos[todoIndex];
  todos = todos.filter(todo => todo.id !== id);
  
  res.json(deletedTodo);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});