const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid/v4');
const Promise = require('bluebird');

const TOP_LEVEL_CATEGORIES_COUNT = 50;
const SUBCATEGORIES_COUNT = 10;

module.exports.generateCategories = () => {
  const categories = [];

  // generate top-level categories
  for (let i = 0; i < TOP_LEVEL_CATEGORIES_COUNT; i += 1) {
    const category1 = {
      id: uuidv4(),
      name: `category ${i + 1}`,
    };
    categories.push(category1);

    // generate second-level categories
    for (let j = 0; j < Math.random() * SUBCATEGORIES_COUNT; j += 1) {
      const category2 = {
        id: uuidv4(),
        name: `category ${i + 1}.${j + 1}`,
        parentCatId: category1.id,
      };
      categories.push(category2);

      // generate third-level categories
      for (let k = 0; k < Math.random() * SUBCATEGORIES_COUNT; k += 1) {
        const category3 = {
          id: uuidv4(),
          name: `category ${i + 1}.${j + 1}.${k + 1}`,
          parentCatId: category2.id,
        };
        categories.push(category3);
      }
    }
  }

  return categories;
};

module.exports.writeCategoriesToFile = (categories) => {
  const json = JSON.stringify({ categories }, null, 2);
  return new Promise((resolve, reject) => {
    fs.open(path.resolve(__dirname, './categories.json'), 'w', (err1, fd) => {
      if (err1) {
        reject(err1);
      }
      fs.writeFile(fd, json, (err2) => {
        if (err2) {
          reject(err2);
        }
        fs.close(fd, (err3) => {
          if (err3) {
            reject(err3);
          }
          resolve(categories);
        });
      });
    });
  });
};
