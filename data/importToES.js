const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Promise = require('bluebird');
const { Client } = require('elasticsearch');
const DBInterface = require('../db');

const MAX_PRODUCTS_PER_BATCH = 100;

const db = new DBInterface();
const client = new Client({
  host: 'http://elastic:elasticpassword@localhost:9200',
});

db.connect();

const getAction = product => ({
  index: {
    _index: 'inventory',
    _type: 'product',
    _id: product.id,
  },
});

const importToES = () => {
  const promises = [];

  const input = fs.createReadStream(path.resolve(__dirname, './products.txt'));
  const lineReader = readline.createInterface({ input });

  const productArrays = [];
  let products = [];
  let count = 0;

  lineReader.on('line', (line) => {
    // if (count % MAX_PRODUCTS_PER_BATCH === 0) {
    //   const arrayIndex = Math.floor(count / MAX_PRODUCTS_PER_BATCH) - 1;

    //   if (arrayIndex >= 0) {
    //     promises.push(client.bulk({ body: products })
    //       .then(() => {
    //         // remove reference after import to free up memory
    //         productArrays[arrayIndex] = undefined;
    //       }));
    //   }

    //   products = [];
    //   productArrays.push(products);
    // }

    const product = JSON.parse(line);
    products.push(getAction(product));
    delete product.id;
    products.push(product);

    count += 1;
  });

  lineReader.on('close', () => {
    client.bulk({ body: products });
  });
};

const mappings = {
  product: {
    properties: {
      createAt: { type: 'date' },
      updatedAt: { type: 'date' },
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
  .then(() => importToES());
