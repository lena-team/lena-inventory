const express = require('express');
const bodyParser = require('body-parser');
const Promise = require('bluebird');

const DBInterface = require('../db');
const categoriesJSON = require('../data/categories.json');
const {
  getCategoryIds,
  getDBProduct,
  getDBProductImg,
} = require('../db/helpers.js');

const app = express();
const PORT = 3000;

const db = new DBInterface();

db.connect()
  .then(() => {
    app.listen(PORT);
    console.log(`Server listening on port ${PORT}`);
  })
  .catch((err) => {
    console.log('Error', err);
  });

/* LOGGING */

app.use((req, res, next) => {
  console.log(`${req.method} request on ${req.url}`);
  next();
});
// app.use(bodyParser.json());

/* REQUEST HANDLERS */

const getAllProductsHandler = (req, res) => {
  db.query('SELECT count(*) FROM product')
    .then((results) => {
      res.send(`Total number of products: ${results.rows[0].count}`);
    });
};

const getProductHandler = (req, res) => {
  const { productId } = req.params;
  db.getOneProduct(productId)
    .then((results) => {
      res.send(results.rows[0]);
    });
};

const postProductHandler = (req, res) => {
  if (!req.body) {
    res.sendStatus(400);
  } else {
    const categoryIds = getCategoryIds(categoriesJSON);
    const ESProduct = req.body;

    const DBProductImgs = [];
    ESProduct.productImgs.forEach((ESProductImg) => {
      const DBProductImg = getDBProductImg(ESProductImg, ESProduct);
      DBProductImgs.push(DBProductImg);
    });

    const DBProduct = getDBProduct(ESProduct, categoryIds);
    Promise.all([db.addProduct(DBProduct), db.addProductImg(DBProductImgs)])
      .then(() => {
        res.send('Product added');
      })
      .catch((err) => {
        res.send(`Failed to add product: ${err}`);
      });
  }
};

const putProductHandler = (req, res) => {
  if (!req.body) {
    res.sendStatus(400);
  } else {
    const categoryIds = getCategoryIds(categoriesJSON);
    const ESProduct = req.body;

    const DBProduct = getDBProduct(ESProduct, categoryIds);
    DBProduct.id = req.params.productId;

    db.updateProduct(DBProduct)
      .then(() => {
        res.send('Product added');
      })
      .catch(() => {
        res.send('Failed to add product');
      });
  }
};

const deleteProductHandler = (req, res) => {
  res.send('delete product');
};

/* PATHS */

app.get('/products', getAllProductsHandler);
app.get('/products/:productId', getProductHandler);
app.post('/products', bodyParser.json(), postProductHandler);
app.put('/products/:productId', bodyParser.json(), putProductHandler);
app.delete('/products/:productId', deleteProductHandler);
