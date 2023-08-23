const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(bodyParser.json());

// Create a database connection
const db = new sqlite3.Database(':memory:');

let productsData = []; // Define the array for products
let servicesData = []; // Define the array for services

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      userId INTEGER NOT NULL,
      itemId INTEGER NOT NULL,
      itemType TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (itemId) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (itemId) REFERENCES services(id) ON DELETE CASCADE
    )
  `);

  // Insert sample products
  const products = [
    { name: 'Product A', price: 1200 },
    { name: 'Product B', price: 5500 },
    { name: 'Product C', price: 350 },
    { name: 'Product D', price: 6200 },
    { name: 'Product E', price: 1800 },
  ];
  products.forEach(product => {
    db.run('INSERT INTO products (name, price) VALUES (?, ?)', [product.name, product.price]);
  });

  // Insert sample services
  const services = [
    { name: 'Service X', price: 7000 },
    { name: 'Service Y', price: 900 },
    { name: 'Service Z', price: 4500 },
    { name: 'Service W', price: 1500 },
    { name: 'Service V', price: 200 },
  ];
  services.forEach(service => {
    db.run('INSERT INTO services (name, price) VALUES (?, ?)', [service.name, service.price]);
  });

  // Fetch products and services data after insertions
  db.all('SELECT * FROM products', (err, rows) => {
    if (!err) {
      productsData = rows;
    }
  });

  db.all('SELECT * FROM services', (err, rows) => {
    if (!err) {
      servicesData = rows;
    }
  });
});

let cart = [];

// Create an account (user registration)
app.post('/account', (req, res) => {
  // Implement user registration logic here
  res.status(201).json({ message: 'Account created successfully' });
});

// Fetch all products and services
app.get('/items', (req, res) => {
  const allItems = [...productsData, ...servicesData];
  res.json(allItems);
});

// Add a product or service to the cart
app.post('/cart/add', (req, res) => {
  const { itemId, type } = req.body;
  const items = type === 'product' ? productsData : servicesData;
  const item = items.find(item => item.id === itemId);
  if (item) {
    cart.push(item);
    res.json({ message: 'Item added to cart successfully' });
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Remove a product or service from the cart
app.delete('/cart/remove/:itemId', (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const index = cart.findIndex(item => item.id === itemId);
  if (index !== -1) {
    cart.splice(index, 1);
    res.json({ message: 'Item removed from cart successfully' });
  } else {
    res.status(404).json({ error: 'Item not found in cart' });
  }
});

// Clear the cart
app.post('/cart/clear', (req, res) => {
  cart = [];
  res.json({ message: 'Cart cleared successfully' });
});

// Calculate tax
function calculateTax(price, type) {
  if (type === 'product') {
    if (price > 1000 && price <= 5000) {
      return price * 0.12; // Tax PA
    } else if (price > 5000) {
      return price * 0.18; // Tax PB
    } else {
      return 200; // Tax PC
    }
  } else if (type === 'service') {
    if (price > 1000 && price <= 8000) {
      return price * 0.10; // Tax SA
    } else if (price > 8000) {
      return price * 0.15; // Tax SB
    } else {
      return 100; // Tax SC
    }
  }
}

// View total bill
app.get('/cart/total', (req, res) => {
  const totalBill = cart.map(item => ({
    ...item,
    tax: calculateTax(item.price, item.type),
  }));

  const totalValue = totalBill.reduce((acc, item) => acc + item.price + item.tax, 0);

  res.json({ totalBill, totalValue });
});

// Confirm the order
app.post('/order/confirm', (req, res) => {
  // Implement order confirmation logic here
  res.json({ message: 'Order confirmed successfully' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
