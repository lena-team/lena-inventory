const Promise = require('bluebird');
const { Client } = require('elasticsearch');

const DBInterface = require('../db');

/* CONSTANTS */
const PRODUCTS_COUNT = 10000;
const MAX_PRICE = 10000;
const MIN_PRICE = 0;
const DISCOUNT_PROBABILITY = 0.7;
const MAX_IMAGE_COUNT = 8;
const MAX_ITEMS_IN_BATCH_QUERY = 100;

const client = new Client({
  host: 'http://elastic:elasticpassword@localhost:9200',
});

const db = new DBInterface();
db.connect();

let categories;

const generateProduct = (id) => {
  const product = {
    timestamp: new Date(),
    name: `name ${id}`,
    description: `desc ${id}`,
    productImgs: [],
  };

  product.category = categories[Math.floor(Math.random() * categories.length)];

  // generate prices
  const standardPrice = Math.floor(Math.random() * MAX_PRICE) + MIN_PRICE;
  product.standardPrice = standardPrice + 0.99;
  if (Math.random() < DISCOUNT_PROBABILITY) {
    product.discountedPrice = Math.floor(standardPrice * Math.random()) + 0.99;
  }

  // generate images
  for (let i = 0; i < (Math.random() * MAX_IMAGE_COUNT) + 1; i += 1) {
    product.productImgs.push({
      img_url: `http://www.lena.com/products/${id}/${i}.jpg`,
      primary_img: i === 0,
    });
  }

  return product;
};

const mappings = {
  product: {
    properties: {
      timestamp: { type: 'date' },
      standardPrice: { type: 'float' },
      discountedPrice: { type: 'float' },
      name: { type: 'text' },
      category: { type: 'keyword' },
      description: { type: 'text' },
    },
  },
};

client.index({
  index: 'inventory',
  type: 'product',
  body: { mappings },
})
  .then(() => db.getAllCategories())
  .then((results) => {
    categories = results.rows.map(row => row.name);
  })
  .then(() => {
    const bodies = [];
    let currentBodies;

    for (let i = 0; i < PRODUCTS_COUNT; i += 1) {
      if (i % MAX_ITEMS_IN_BATCH_QUERY === 0) {
        currentBodies = [];
        bodies.push(currentBodies);
      }

      const product = generateProduct(i);

      currentBodies.push(
        {
          index: {
            _index: 'inventory',
            _type: 'product',
            _id: i,
          },
        },
        product
      );
    }

    return Promise.all(bodies.map(body => client.bulk({ body })));
  })
  .catch((err) => {
    console.log('error', err);
  })
  .then(() => {
    db.end();
  });

module.exports = client;
