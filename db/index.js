const { Client } = require('pg');
const Promise = require('bluebird');
const {
  constructGetOneQuery,
  constructGetAllQuery,
  constructInsertQuery,
  constructBatchInsertQuery,
  constructUpdateQuery,
  constructDeleteAllQuery,
} = require('./helpers.js');

// Ideally, fields should be generated dynamically from given items, however, that
// will significantly slow the process when generating a large amount of items.
const PRODUCT_FIELDS = ['id', 'created_at', 'updated_at', 'name', 'description', 'standard_price', 'discounted_price', 'cat_id'];
const CATEGORY_FIELDS = ['id', 'name', 'parent_cat_id'];
const PRODUCT_IMG_FIELDS = ['product_id', 'img_url', 'primary_img'];

const defaultSettings = {
  user: process.env.LENA_INVENTORY_DB_USER || 'postgres',
  host: process.env.LENA_INVENTORY_DB_HOST || 'localhost',
  database: process.env.LENA_INVENTORY_DB_DATABASE || 'inventory',
  port: process.env.LENA_INVENTORY_DB_PORT || 5432,
};

class DBInterface extends Client {
  constructor(settings = defaultSettings) {
    super(settings);
  }

  getOneProduct(id) {
    return super.query(constructGetOneQuery('product'), [id]);
  }

  getAllProducts() {
    return super.query(constructGetAllQuery('product'));
  }

  addProduct(productOrProductsArray) {
    if (Array.isArray(productOrProductsArray)) {
      const values = [];
      productOrProductsArray.forEach((product) => {
        PRODUCT_FIELDS.forEach((field) => {
          values.push(product[field]);
        });
      });
      return super.query(constructBatchInsertQuery('product', PRODUCT_FIELDS, productOrProductsArray.length), values);
    }
    const fields = Object.keys(productOrProductsArray);
    const values = fields.map(field => productOrProductsArray[field]);
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

  getAllCategories() {
    return super.query(constructGetAllQuery('category'));
  }

  addCategory(categoryOrCategoriesArray) {
    if (Array.isArray(categoryOrCategoriesArray)) {
      const values = [];
      categoryOrCategoriesArray.forEach((category) => {
        CATEGORY_FIELDS.forEach((field) => {
          values.push(category[field]);
        });
      });
      return super.query(constructBatchInsertQuery('category', CATEGORY_FIELDS, categoryOrCategoriesArray.length), values);
    }
    const fields = Object.keys(categoryOrCategoriesArray);
    const values = fields.map(field => categoryOrCategoriesArray[field]);
    return super.query(constructInsertQuery('category', fields), values);
  }

  addProductImg(productImgOrProductImgsArray) {
    if (Array.isArray(productImgOrProductImgsArray)) {
      const values = [];
      productImgOrProductImgsArray.forEach((productImg) => {
        PRODUCT_IMG_FIELDS.forEach((field) => {
          values.push(productImg[field]);
        });
      });
      return super.query(constructBatchInsertQuery('product_img', PRODUCT_IMG_FIELDS, productImgOrProductImgsArray.length), values);
    }
    const fields = Object.keys(productImgOrProductImgsArray);
    const values = fields.map(field => productImgOrProductImgsArray[field]);
    return super.query(constructInsertQuery('product_img', fields), values);
  }

  // for testing purposes
  clearAllTables() {
    // all existing tables in db
    const tables = ['product', 'category', 'product_img'];
    // array of delete queries
    const queries = tables.map(table => constructDeleteAllQuery(table));

    return Promise.all(queries.map(query => super.query(query)));
  }
}

module.exports = DBInterface;
