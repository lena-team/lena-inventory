const Promise = require('bluebird');
const DBInterface = require('./');

const TOP_LEVEL_CATEGORIES_COUNT = 50;
const SECOND_LEVEL_CATEGORIES_COUNT = 300;
const THIRD_LEVEL_CATEGORIES_COUNT = 1800;
const PRODUCTS_COUNT = 10000;
const MAX_PRICE = 10000;
const MIN_PRICE = 0;
const DISCOUNT_PROBABILITY = 0.7;
const MAX_IMAGE_COUNT = 8;

const db = new DBInterface();
db.connect();

const categories = {
  0: [],
  1: [],
  2: [],
};

const generateCategories = () => {
  const promises0 = [];
  const promises1 = [];
  const promises2 = [];

  // insert 50 top level categories
  for (let i = 0; i < TOP_LEVEL_CATEGORIES_COUNT; i += 1) {
    // create category and add to db
    const category = { name: `category ${i + 1}` };
    categories[0].push(category);
    promises0.push(db.addCategory(category));
  }

  return Promise.all(promises0)
    .then((insertions) => {
      // store ids of all top level categories
      insertions.forEach((insertion, index) => {
        const category = categories[0][index];
        category.id = insertion.rows[0].id;
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
        promises1.push(db.addCategory(category));
      }
      return Promise.all(promises1);
    })
    .then((insertions) => {
      // store ids of all second level categories
      insertions.forEach((insertion, index) => {
        const category = categories[1][index];
        category.id = insertion.rows[0].id;
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
        promises2.push(db.addCategory(category));
      }
      return Promise.all(promises2);
    })
    .then((insertions) => {
      // store ids of all third level categories
      insertions.forEach((insertion, index) => {
        const category = categories[2][index];
        category.id = insertion.rows[0].id;
        category.childrenCount = 0;
      });
    });
};

const generateProducts = () => {
  const promises = [];
  const allCategories = categories[0].concat(categories[1]).concat(categories[2]);

  // insert 1M products
  for (let i = 0; i < PRODUCTS_COUNT; i += 1) {
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

    // add addProduct promise to promises array
    promises.push(db.addProduct(product)
      .then((insertion) => {
        const productImgPromises = [];
        const productId = insertion.rows[0].id;

        // insert a random number of images (1-9) for that product
        for (let j = 0; j < Math.floor(Math.random() * MAX_IMAGE_COUNT) + 1; j += 1) {
          // make img
          const productImg = {
            product_id: productId,
            img_url: `http://www.lena.com/images/${productId}/${i + 1}.jpg`,
            primary_img: i === 0,
          };

          // add addProductImage promise to promises array
          productImgPromises.push(db.addProductImg(productImg));
        }

        // resolve all addProductImage promises
        return Promise.all(productImgPromises);
      }));
  }

  // resolve all addProduct promises
  return Promise.all(promises);
};

db.clearAllTables()
  .then(() => generateCategories())
  .then(() => generateProducts())
  .then(() => {
    db.end();
  });
