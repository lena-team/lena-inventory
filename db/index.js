const { Client } = require('pg');
const Promise = require('bluebird');
const {
  constructGetOneQuery,
  constructGetAllQuery,
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

  getOneProduct(id) {
    return super.query(constructGetOneQuery('product'), [id]);
  }

  getAllProducts() {
    return super.query(constructGetAllQuery('product'));
  }

  addProduct(product) {
    const fields = Object.keys(product);
    const values = fields.map(field => product[field]);
    return super.query(constructInsertQuery('product', fields), values);
  }

  updateProduct(product) {
    if (product.id === undefined) {
      throw new Error('Must provide id to update an item');
    }

    const fields = Object.keys(product).filter(key => key !== 'id');
    const values = fields.map(field => product[field]);
    return super.query(constructUpdateQuery('product', fields), [product.id, ...values]);
  }

  addCategory(category) {
    const fields = Object.keys(category);
    const values = fields.map(field => category[field]);
    return super.query(constructInsertQuery('category', fields), values);
  }

  addProductImg(productImg) {
    const fields = Object.keys(productImg);
    const values = fields.map(field => productImg[field]);
    return super.query(constructInsertQuery('product_img', fields), values);
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
