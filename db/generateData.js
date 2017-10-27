const Promise = require('bluebird');
const DBInterface = require('./');

const TOP_LEVEL_CATEGORIES_COUNT = 50;
const SECOND_LEVEL_CATEGORIES_COUNT = 300;
const THIRD_LEVEL_CATEGORIES_COUNT = 1800;
// gets heap out of memory error when set to 1000000
const PRODUCTS_COUNT = 700000;
const MAX_PRICE = 10000;
const MIN_PRICE = 0;
const DISCOUNT_PROBABILITY = 0.7;
const MAX_IMAGE_COUNT = 8;
const MAX_ITEMS_IN_BATCH_QUERY = 10000;

const db = new DBInterface();
db.connect();

const categories = {
  0: [],
  1: [],
  2: [],
};
const products = [];
const productImgs = [];

const generateCategories = () => {
  // insert 50 top level categories
  for (let i = 0; i < TOP_LEVEL_CATEGORIES_COUNT; i += 1) {
    // create category and add to db
    const category = { name: `category ${i + 1}` };
    categories[0].push(category);
    // promises0.push(db.addCategory(category));
  }

  // return Promise.all(promises0)
  return db.addCategory(categories[0])
    .then((insertions) => {
      // store ids of all top level categories
      insertions.rows.forEach((insertion, index) => {
        const category = categories[0][index];
        category.id = insertion.id;
        category.childrenCount = 0;
      });
    })
    .then(() => {
      // insert 300 second level categories
      for (let i = 0; i < SECOND_LEVEL_CATEGORIES_COUNT; i += 1) {
        // get random top level category
        const parentCatIndex = Math.floor(Math.random() * categories[0].length);
        const parentCat = categories[0][parentCatIndex];

        // create category and add to db
        parentCat.childrenCount += 1;
        const category = {
          name: `${parentCat.name}.${parentCat.childrenCount}`,
          parent_cat_id: parentCat.id,
        };

        // add category to categories array for later use
        categories[1].push(category);
      }
      return db.addCategory(categories[1]);
    })
    .then((insertions) => {
      // store ids of all second level categories
      insertions.rows.forEach((insertion, index) => {
        const category = categories[1][index];
        category.id = insertion.id;
        category.childrenCount = 0;
      });
    })
    .then(() => {
      // insert 1800 third level categories
      for (let i = 0; i < THIRD_LEVEL_CATEGORIES_COUNT; i += 1) {
        // get random second level category
        const parentCatIndex = Math.floor(Math.random() * categories[1].length);
        const parentCat = categories[1][parentCatIndex];

        // create category and add to db
        parentCat.childrenCount += 1;
        const category = {
          name: `${parentCat.name}.${parentCat.childrenCount}`,
          parent_cat_id: parentCat.id,
        };

        // add category to categories array for later use
        categories[2].push(category);
      }
      return db.addCategory(categories[2]);
    })
    .then((insertions) => {
      // store ids of all third level categories
      insertions.rows.forEach((insertion, index) => {
        const category = categories[2][index];
        category.id = insertion.id;
        category.childrenCount = 0;
      });
    });
};

const generateProducts = () => {
  const promises = [];
  const allCategories = categories[0].concat(categories[1]).concat(categories[2]);

  let currentProducts;

  // insert 1M products
  for (let i = 0; i < PRODUCTS_COUNT; i += 1) {
    if (i % MAX_ITEMS_IN_BATCH_QUERY === 0) {
      currentProducts = [];
      products.push(currentProducts);
    }

    // select random category
    const catIndex = Math.floor(Math.random() * allCategories.length);
    const catId = allCategories[catIndex].id;
    const standardPrice = Math.floor(Math.random() * MAX_PRICE) + MIN_PRICE;

    // create product
    const product = {
      name: `product name ${i + 1}`,
      description: `product description ${i + 1}`,
      cat_id: catId,
      standard_price: `$${standardPrice}.99`,
    };

    // generate discounted price
    if (Math.random() < DISCOUNT_PROBABILITY) {
      const discountedPrice = Math.floor(standardPrice * Math.random());
      product.discounted_price = `$${discountedPrice}.99`;
    }

    // add product to products array
    currentProducts.push(product);
  }

  products.forEach(batch => promises.push(db.addProduct(batch)));

  // resolve all addProduct promises
  return Promise.all(promises)
    // store product ids for later use
    .then((batchInsertions) => {
      for (let j = 0; j < batchInsertions.length; j += 1) {
        const insertions = batchInsertions[j];
        for (let k = 0; k < insertions.rows.length; k += 1) {
          products[j][k].id = insertions.rows[k].id;
        }
      }
    });
};

const generateProductImgs = () => {
  const promises = [];

  let productImgsCount = 0;
  let currentProductImgs;

  for (let i = 0; i < products.length; i += 1) {
    for (let j = 0; j < products[i].length; j += 1) {
      // for each product
      const product = products[i][j];

      // get a random number of images
      const imgCount = (Math.random() * MAX_IMAGE_COUNT) + 1;
      for (let k = 0; k < imgCount; k += 1) {
        // create productImg
        const productImg = {
          product_id: product.id,
          img_url: `http://www.lena.com/${product.id}/${k + 1}.jpg`,
          primary_img: k === 0,
        };

        // put productImgs in batches
        if (productImgsCount % MAX_ITEMS_IN_BATCH_QUERY === 0) {
          currentProductImgs = [];
          productImgs.push(currentProductImgs);
        }

        productImgsCount += 1;

        currentProductImgs.push(productImg);
      }
    }
  }

  productImgs.forEach(batch => promises.push(db.addProductImg(batch)));

  return Promise.all(promises);
};

db.clearAllTables()
  .then(() => generateCategories())
  .then(() => generateProducts())
  .then(() => generateProductImgs())
  .then(() => {
    db.end();
  });
