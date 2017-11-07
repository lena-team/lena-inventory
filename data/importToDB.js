const fs = require('fs');
const readline = require('readline');
const path = require('path');
const Promise = require('bluebird');

const DBInterface = require('../db');
const categories = require('./categories.json');
const {
  getCategoryIds,
  getDBProduct,
  getDBProductImg,
} = require('../db/helpers.js');

// starts throwing errors when reaches 7000
const MAX_PRODUCTS_PER_BATCH = 6000;

const db = new DBInterface();

const importToDB = () => {
  const categoryIds = getCategoryIds(categories);

  db.connect();

  // await db.addCategory(categories.categories); // need to modify function to be async function

  const input = fs.createReadStream(path.resolve(__dirname, './products_10m.txt'));
  const lineReader = readline.createInterface({ input });

  const productArrays = [];
  let products = [];

  const productImgArrays = [];
  let productImgs = [];

  let count = 0;
  let arrayIndex;

  lineReader.on('line', (line) => {
    if (count % MAX_PRODUCTS_PER_BATCH === 0) {
      arrayIndex = Math.floor(count / MAX_PRODUCTS_PER_BATCH) - 1;

      if (arrayIndex >= 0) {
        // pause until bulk query is completed
        lineReader.pause();

        Promise.all([db.addProduct(products), db.addProductImg(productImgs)])
          .then(() => {
            console.log(`Successfully imported products array ${arrayIndex}`);
            // remove reference to prevent memory leakage
            productArrays[arrayIndex] = null;
            productImgArrays[arrayIndex] = null;
            // resume after bulk query is completed
            lineReader.resume();
          })
          .catch((err) => {
            console.log('Error', err);
          });
      }

      // create new batch for every 10000 products
      products = [];
      productArrays.push(products);

      productImgs = [];
      productImgArrays.push(productImgs);
    }

    const ESProduct = JSON.parse(line);
    const DBProduct = getDBProduct(ESProduct, categoryIds);
    products.push(DBProduct);

    ESProduct.productImgs.forEach((ESProductImg) => {
      const DBProductImg = getDBProductImg(ESProductImg, ESProduct);
      productImgs.push(DBProductImg);
    });

    count += 1;
  });

  lineReader.on('close', () => {
    // import final batch before end
    Promise.all([db.addProduct(products), db.addProductImg(productImgs)])
      .then(() => {
        console.log(`Successfully imported products array ${arrayIndex}`);
        console.log('All insertions completed');
      })
      .catch((err) => {
        console.log('Error', err);
      })
      .then(() => {
        db.end();
      });
  });
};

importToDB();
