const { Client } = require('pg');
const { constructGetQuery, constructInsertQuery, constructUpdateQuery } = require('./helpers.js');

const client = new Client({
  user: process.env.LENA_INVENTORY_DB_USER || 'leo',
  host: process.env.LENA_INVENTORY_DB_HOST || 'localhost',
  database: process.env.LENA_INVENTORY_DB_DATABASE || 'inventory',
  port: process.env.LENA_INVENTORY_DB_PORT || 5432,
});

client.connect();

const getProduct = id => client.query(constructGetQuery('product', id));

const addProduct = product => client.query(constructInsertQuery('product', product));

const updateProduct = product => client.query(constructUpdateQuery('product', product));

const addCategory = category => client.query(constructInsertQuery('category', category));

const addProductImg = productImg => client.query(constructInsertQuery('product_img', productImg));

module.exports = {
  getProduct,
  addProduct,
  updateProduct,
  addCategory,
  addProductImg,
};
