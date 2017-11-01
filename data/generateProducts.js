const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid/v4');

const PRODUCTS_COUNT = 10000000;
const MAX_PRICE = 10000;
const DISCOUNT_PROBABILITY = 0.7;
const MAX_IMAGE_COUNT = 8;

const getStandardPrice = () => Math.floor(Math.random() * MAX_PRICE);

const getDiscountedPrice = (product) => {
  if (Math.random() < DISCOUNT_PROBABILITY) {
    return Math.floor(Math.random() * product.standardPrice);
  }
  return undefined;
};

const getProductImgs = (product) => {
  const imgs = [];
  for (let i = 0; i < Math.random() * MAX_IMAGE_COUNT; i += 1) {
    const img = {
      productId: product.id,
      imgUrl: `http://www.lena.com/products/${product.id}/${i + 1}`,
      primaryImg: i === 0,
    };
    imgs.push(img);
  }
  return imgs;
};

const generateProduct = (index, categories) => {
  const catId = categories[Math.floor(Math.random() * categories.length)];

  const product = {
    id: uuidv4(),
    name: `product ${index + 1}`,
    description: `description ${index + 1}`,
    catId,
    standardPrice: getStandardPrice(),
  };
  product.discountedPrice = getDiscountedPrice(product);
  product.productImgs = getProductImgs(product);

  return product;
};

module.exports.generateProducts = (categories) => {
  // write to txt file line by line because stringifying
  // entire array of products will take too much memory
  const fd = fs.openSync(path.resolve(__dirname, './products.txt'), 'w');
  for (let i = 0; i < PRODUCTS_COUNT; i += 1) {
    const product = generateProduct(i, categories);
    const line = `${JSON.stringify(product)}\n`;
    fs.appendFileSync(fd, line);
  }
  fs.closeSync(fd);
};
