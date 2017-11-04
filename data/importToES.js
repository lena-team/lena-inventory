const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Client } = require('elasticsearch');

const MAX_PRODUCTS_PER_BATCH = 10000;

const client = new Client({
  host: 'http://elastic:elasticpassword@localhost:9200',
});

const getAction = product => ({
  index: {
    _index: 'inventory',
    _type: 'product',
    _id: product.id,
  },
});

const importToES = () => {
  const input = fs.createReadStream(path.resolve(__dirname, './products_10k.txt'));
  const lineReader = readline.createInterface({ input });

  const productArrays = [];
  let products = [];
  let count = 0;
  let arrayIndex;

  lineReader.on('line', (line) => {
    if (count % MAX_PRODUCTS_PER_BATCH === 0) {
      arrayIndex = Math.floor(count / MAX_PRODUCTS_PER_BATCH) - 1;

      if (arrayIndex >= 0) {
        // pause until bulk query is completed
        lineReader.pause();

        client.bulk({ body: products })
          .then(() => {
            console.log(`Successfully imported products array ${arrayIndex}`);
            // remove reference to prevent memory leakage
            productArrays[arrayIndex] = null;
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
    }

    const product = JSON.parse(line);
    products.push(getAction(product));
    delete product.id;
    products.push(product);

    count += 1;
  });

  lineReader.on('close', () => {
    // import final batch before end
    client.bulk({ body: products })
      .then(() => {
        console.log(`Successfully imported products array ${arrayIndex}`);
      })
      .catch((err) => {
        console.log('Error', err);
      })
      .then(() => {
        process.exit();
      });
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
  type: 'product2',
  body: { mappings },
})
  .then(() => importToES());
