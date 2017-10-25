const { Client } = require('pg');
const Promise = require('bluebird');
const {
  constructGetQuery,
  constructInsertQuery,
  constructUpdateQuery,
  constructDeleteQuery,
} = require('./helpers.js');

class DBInterface extends Client {
  constructor() {
    super({
      user: process.env.LENA_INVENTORY_DB_USER || 'postgres',
      host: process.env.LENA_INVENTORY_DB_HOST || 'localhost',
      database: process.env.LENA_INVENTORY_DB_DATABASE || 'inventory',
      port: process.env.LENA_INVENTORY_DB_PORT || 5432,
    });
  }

  getProduct(id) {
    return super.query(constructGetQuery('product', id));
  }

  addProduct(product) {
    return super.query(constructInsertQuery('product', product));
  }

  updateProduct(product) {
    return super.query(constructUpdateQuery('product', product));
  }

  addCategory(category) {
    return super.query(constructInsertQuery('category', category));
  }

  addProductImg(productImg) {
    return super.query(constructInsertQuery('product_img', productImg));
  }

  // for testing purposes
  clearAllTables() {
    // all existing tables in db
    const tables = ['product', 'category', 'product_img'];
    // array of delete queries
    const queries = tables.map(table => constructDeleteQuery(table));
    
    return Promise.all(queries.map(query => super.query(query)));
  }
}

module.exports = DBInterface;
