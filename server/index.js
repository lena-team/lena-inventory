const express = require('express');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const { Client } = require('elasticsearch');
const AWS = require('aws-sdk');

const DBInterface = require('../db');
const categoriesJSON = require('../data/categories.json');
const {
  getCategoryIds,
  getDBProduct,
  getDBProductImgs,
} = require('../db/helpers.js');

const app = express();
AWS.config = new AWS.Config({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
const PORT = 3000;
const SQS_URL = 'https://sqs.us-west-1.amazonaws.com/116968041707/lena-inventory';

const db = new DBInterface();
const es = new Client({
  host: 'http://elastic:elasticpassword@localhost:9200',
});

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

/* HELPER FUNCTION */

const ESIndex = (ESClient, product) => (
  ESClient.index({
    index: 'inventory',
    type: 'product',
    id: product.id,
    body: product,
  })
);

const ESUpdate = (ESClient, product) => (
  ESClient.update({
    index: 'inventory',
    type: 'product',
    id: product.id,
    body: { doc: product },
  })
);

const SQSInsert = (SQSClient, product) => {
  const params = {
    QueueUrl: SQS_URL,
    MessageAttributes: {
      product: {
        DataType: 'String',
        StringValue: JSON.stringify(product),
      },
    },
    MessageBody: 'NEW_PRODUCT',
  };

  return new Promise((resolve, reject) => {
    SQSClient.sendMessage(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const SQSUpdate = (SQSClient, product) => {
  const params = {
    QueueUrl: SQS_URL,
    MessageAttributes: {
      product: {
        DataType: 'String',
        StringValue: JSON.stringify(product),
      },
    },
    MessageBody: 'UPDATE_PRODUCT',
  };

  return new Promise((resolve, reject) => {
    SQSClient.sendMessage(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

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

    // normalize data
    const DBProduct = getDBProduct(ESProduct, categoryIds);
    const DBProductImgs = getDBProductImgs(ESProduct);

    // insertion promises
    const promises = [
      db.addProduct(DBProduct),
      db.addProductImg(DBProductImgs),
      ESIndex(es, ESProduct),
      SQSInsert(sqs, ESProduct),
    ];

    // send response on successful insertions
    Promise.all(promises)
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
    ESProduct.id = req.params.productId;

    // normalize data
    const DBProduct = getDBProduct(ESProduct, categoryIds);
    DBProduct.id = req.params.productId;

    // update promises
    const promises = [
      db.updateProduct(DBProduct),
      ESUpdate(es, ESProduct),
      SQSUpdate(sqs, ESProduct),
    ];

    // send response on successful updates
    Promise.all(promises)
      .then(() => {
        res.send('Product added');
      })
      .catch(() => {
        res.send('Failed to add product');
      });
  }
};

// const deleteProductHandler = (req, res) => {
//   res.send('delete product');
// };

/* PATHS */

app.get('/products', getAllProductsHandler);
app.get('/products/:productId', getProductHandler);
app.post('/products', bodyParser.json(), postProductHandler);
app.put('/products/:productId', bodyParser.json(), putProductHandler);
// app.delete('/products/:productId', deleteProductHandler);
