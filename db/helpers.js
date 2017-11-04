const _ = require('lodash');

const PRODUCT_FIELDS = ['id', 'created_at', 'updated_at', 'name', 'description', 'standard_price', 'discounted_price'];
// const PRODUCT_IMG_FIELDS = ['product_id', 'img_url', 'primary_img'];

module.exports.getCategoryIds = (categoriesJSON) => {
  const results = {};
  categoriesJSON.categories.forEach(({ id, name }) => {
    results[name] = id;
  });
  return results;
};

module.exports.getDBProduct = (product, categoryIds) => {
  const result = {};

  PRODUCT_FIELDS.forEach((field) => {
    const camelCaseField = _.camelCase(field);
    // use hasOwnProperty so that undefined fields will also be transferred
    if (Object.prototype.hasOwnProperty.call(product, camelCaseField)) {
      result[field] = product[camelCaseField];
    }
  });

  if (Object.prototype.hasOwnProperty.call(product, 'category')) {
    result.cat_id = categoryIds[product.category];
  }

  return result;
};

module.exports.getDBProductImg = (productImg, product) => ({
  product_id: product.id,
  img_url: productImg.imgUrl,
  primary_img: productImg.primaryImg,
});

module.exports.getDBProductImgs = product => (
  product.productImgs.map(productImg => module.exports.getDBProductImg(productImg, product))
);

module.exports.constructGetOneQuery = table => `SELECT * FROM ${table} WHERE id = $1`;

module.exports.constructGetAllQuery = table => `SELECT * FROM ${table}`;

module.exports.constructInsertQuery = (table, fields) => {
  const queryVals = fields.map((field, index) => `$${index + 1}`).join(', ');
  return `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${queryVals}) RETURNING id`;
};

const getQueryParamTemplate = (fieldsCount, itemsCount) => {
  const result = [];

  let paramsCountSoFar = 0;
  let item = [];

  while (paramsCountSoFar < fieldsCount * itemsCount) {
    item.push(`$${paramsCountSoFar + 1}`);

    paramsCountSoFar += 1;

    if (paramsCountSoFar % fieldsCount === 0) {
      result.push(`(${item.join(', ')})`);
      item = [];
    }
  }

  return result.join(', ');
};

module.exports.constructBatchInsertQuery = (table, fields, itemsCount) => {
  const fieldsCount = Object.keys(fields).length;
  const params = getQueryParamTemplate(fieldsCount, itemsCount);
  return `INSERT INTO ${table} (${fields.join(', ')}) VALUES ${params} RETURNING id`;
};

module.exports.constructUpdateQuery = (table, fields) => {
  const pairs = fields.map((field, index) => `${field}=$${index + 2}`);
  return `UPDATE ${table} SET ${pairs.join(', ')} WHERE id = $1`;
};

module.exports.constructDeleteOneQuery = table => `DELETE FROM ${table} WHERE id = $1`;

module.exports.constructDeleteAllQuery = table => `DELETE FROM ${table}`;
