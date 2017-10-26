const Promise = require('bluebird');
const DBInterface = require('./');

const db = new DBInterface();
db.connect();

const categories = {
  0: [],
  1: [],
  2: [],
};

const generateCategories = () => {
  // 50 top level categories

  const topLevelCategoryGeneration = [];
  const secondLevelCategoryGeneration = [];
  const thirdLevelCategoryGeneration = [];

  // insert 50 top level categories
  for (let i = 0; i < 50; i += 1) {
    // create category and add to db
    const category = { name: `category ${i + 1}` };
    categories[0].push(category);
    topLevelCategoryGeneration.push(db.addCategory(category));
  }

  Promise.all(topLevelCategoryGeneration)
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
      for (let i = 0; i < 300; i += 1) {
        // get random top level category
        const parentCatIndex = Math.floor(Math.random() * categories[0].length);
        const parentCat = categories[0][parentCatIndex];

        // create category and add to db
        parentCat.childrenCount += 1;
        const category = {
          name: `${parentCat.name}.${parentCat.childrenCount}`,
          parent_cat_id: parentCat.id,
        };

        categories[1].push(category);
        secondLevelCategoryGeneration.push(db.addCategory(category));
      }
      return Promise.all(secondLevelCategoryGeneration);
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
      for (let i = 0; i < 1800; i += 1) {
        // get random second level category
        const parentCatIndex = Math.floor(Math.random() * categories[1].length);
        const parentCat = categories[1][parentCatIndex];

        // create category and add to db
        parentCat.childrenCount += 1;
        const category = {
          name: `${parentCat.name}.${parentCat.childrenCount}`,
          parent_cat_id: parentCat.id,
        };

        categories[2].push(category);
        thirdLevelCategoryGeneration.push(db.addCategory(category));
      }
      return Promise.all(thirdLevelCategoryGeneration);
    })
    .then((insertions) => {
      // store ids of all third level categories
      insertions.forEach((insertion, index) => {
        const category = categories[2][index];
        category.id = insertion.rows[0].id;
        category.childrenCount = 0;
      });
    })
    .then(() => {
      process.exit();
    });
};

generateCategories();
