const express = require('express');

const app = express();
const PORT = 3000;

app.listen(PORT);

/* LOGGING */

console.log(`Server listening on port ${PORT}`);
app.use((req, res, next) => {
  console.log(`${req.method} request on ${req.url}`);
  next();
});

/* REQUEST HANDLERS */

const getAllProductsHandler = (req, res) => {
  res.send('get all products');
};

const getProductHandler = (req, res) => {
  res.send('get one product');
};

const postProductHandler = (req, res) => {
  res.send('post product');
};

const putProductHandler = (req, res) => {
  res.send('update product');
};

const deleteProductHandler = (req, res) => {
  res.send('delete product');
};

/* PATHS */

app.get('/products', getAllProductsHandler);
app.get('/products/:productId', getProductHandler);
app.post('/products', postProductHandler);
app.put('/products/:productId', putProductHandler);
app.delete('/products/:productId', deleteProductHandler);
