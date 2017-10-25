const { Client } = require('pg');

const client = new Client({
  user: process.env.LENA_INVENTORY_DB_USER || 'leo',
  host: process.env.LENA_INVENTORY_DB_HOST || 'localhost',
  database: process.env.LENA_INVENTORY_DB_DATABASE || 'inventory',
  port: process.env.LENA_INVENTORY_DB_PORT || 5432,
});

client.connect();

const constructGetQuery = (table, id) => {
  if (id) {
    return `SELECT * FROM ${table} WHERE id = ${id}`;
  }
  return `SELECT * FROM ${table}`;
};

const constructInsertQuery = (table, data) => {
  const keys = Object.keys(data);
  const vals = keys.map(key => `'${data[key]}'`);
  const queryKeys = keys.join(', ');
  const queryVals = vals.join(', ');
  return `INSERT INTO ${table} (${queryKeys}) VALUES (${queryVals});`;
};

const constructUpdateQuery = (table, data) => {
  const pairs = Object.keys
    .filter(key => key !== 'id')
    .map(key => `${key}='${data[key]}'`);
  const queryPairs = pairs.join(', ');
  return `UPDATE ${table} SET ${queryPairs} WHERE id = ${data.id}`;
};

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
