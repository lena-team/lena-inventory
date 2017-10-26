/* eslint-env mocha */
const { expect } = require('chai');
const DBInterface = require('../db');
const dbHelpers = require('../db/helpers.js');

describe('Database', () => {
  describe('Query Constructor Helper Functions', () => {
    it('Should create a get query for a specific item when id is provided', () => {
      const table = 'product';
      const result = dbHelpers.constructGetOneQuery(table);
      const expected = 'SELECT * FROM product WHERE id = $1';
      expect(result).to.equal(expected);
    });

    it('Should create a get query for all items', () => {
      const table = 'product';
      const result = dbHelpers.constructGetAllQuery(table);
      const expected = 'SELECT * FROM product';
      expect(result).to.equal(expected);
    });

    it('Should create a insert query for an items', () => {
      const table = 'product';
      const product = {
        name: 'nerf gun',
        description: 'best gun in the world',
        standard_price: '$10.99',
        discounted_price: '$7.99',
        cat_id: 1,
      };
      const result = dbHelpers.constructInsertQuery(table, product);
      const expected = 'INSERT INTO product (name, description, standard_price, discounted_price, cat_id) VALUES (\'nerf gun\', \'best gun in the world\', \'$10.99\', \'$7.99\', \'1\') RETURNING id';
      expect(result).to.equal(expected);
    });

    it('Should create an update query for an item with all fields', () => {
      const table = 'product_img';
      const productImg = {
        id: 2,
        img_url: 'http://www.google.com/logo.jpg',
        primary_img: true,
      };
      const result = dbHelpers.constructUpdateQuery(table, productImg);
      const expected = 'UPDATE product_img SET img_url=\'http://www.google.com/logo.jpg\', primary_img=\'true\' WHERE id = 2';
      expect(result).to.equal(expected);
    });

    it('Should create an update query for an item with only a subset of fields', () => {
      const table = 'product';
      const product = {
        id: 2,
        name: 'name',
        description: 'desc',
        standard_price: '$100.00',
      };
      const result = dbHelpers.constructUpdateQuery(table, product);
      const expected = 'UPDATE product SET name=\'name\', description=\'desc\', standard_price=\'$100.00\' WHERE id = 2';
      expect(result).to.equal(expected);
    });
  });

  describe('Wrapper DB Query Functions', () => {
    let db;

    beforeEach((done) => {
      db = new DBInterface();
      db.connect();
      db.clearAllTables()
        .then(() => {
          done();
        });
    });

    afterEach(() => {
      db.end();
    });

    it('Should insert a new category without a parent category', (done) => {
      const category = { name: 'cat 1' };
      db.addCategory(category)
        .then(() => db.query('SELECT * FROM category'))
        .then((results) => {
          const result = results.rows[0];

          expect(result.name).to.equal('cat 1');
          expect(result.parent_cat_id).to.equal(null);

          done();
        })
        .catch(done);
    });

    it('Should insert a new category with a parent category', (done) => {
      const parentCategory = { name: 'cat 1' };
      const category = { name: 'cat 1.1' };
      let parentCatId;
      db.addCategory(parentCategory)
        .then(result => result.rows[0].id)
        .then((id) => {
          parentCatId = id;
          category.parent_cat_id = id;
          return db.addCategory(category);
        })
        .then(() => db.query('SELECT * FROM category'))
        .then((results) => {
          const result = results.rows[results.rows.length - 1];

          expect(result.name).to.equal('cat 1.1');
          expect(result.parent_cat_id).to.equal(parentCatId);

          done();
        });
    });

    it('Should insert a new product', (done) => {
      const category = { name: 'cat 1' };
      const product = {
        name: 'name',
        description: 'desc',
        standard_price: '$100.00',
      };
      db.addCategory(category)
        .then((insertion) => {
          product.cat_id = insertion.rows[0].id;
          return db.addProduct(product);
        })
        .then(() => db.query('SELECT * FROM product'))
        .then((results) => {
          const result = results.rows[0];

          expect(result.name).to.equal('name');
          expect(result.description).to.equal('desc');
          expect(result.standard_price).to.equal('$100.00');
          expect(result.discounted_price).to.equal(null);

          done();
        });
    });

    it('Should insert a new product image', (done) => {
      const category = { name: 'cat 1' };
      const product = {
        name: 'name',
        description: 'desc',
        standard_price: '$100.00',
      };
      const productImg = {
        img_url: 'http://www.google.com/logo.jpg',
        primary_img: true,
      };
      db.addCategory(category)
        .then((insertion) => {
          product.cat_id = insertion.rows[0].id;
          return db.addProduct(product);
        })
        .then((insertion) => {
          productImg.product_id = insertion.rows[0].id;
          return db.addProductImg(productImg);
        })
        .then(() => db.query('SELECT * FROM product_img'))
        .then((results) => {
          const result = results.rows[0];

          expect(result.img_url).to.equal('http://www.google.com/logo.jpg');
          expect(result.primary_img).to.equal(true);

          done();
        });
    });

    it('Should get a product with a specified id', (done) => {
      const category = { name: 'cat 1' };
      const product = {
        name: 'name',
        description: 'desc',
        standard_price: '$100.00',
      };
      db.addCategory(category)
        .then((insertion) => {
          product.cat_id = insertion.rows[0].id;
          return db.addProduct(product);
        })
        .then((insertion) => {
          const { id } = insertion.rows[0];
          return db.getOneProduct(id);
        })
        .then((results) => {
          const result = results.rows[0];

          expect(result.name).to.equal('name');
          expect(result.description).to.equal('desc');
          expect(result.standard_price).to.equal('$100.00');
          expect(result.discounted_price).to.equal(null);

          done();
        });
    });

    it('Should get all products when no id is provided', (done) => {
      const category = { name: 'cat 1' };
      let catId;
      const product1 = {
        name: 'name',
        description: 'desc',
        standard_price: '$100.00',
      };
      const product2 = {
        name: 'name2',
        description: 'desc2',
        standard_price: '$150.00',
        discounted_price: '$120.00',
      };
      db.addCategory(category)
        .then((insertion) => {
          catId = insertion.rows[0].id;
          product1.cat_id = insertion.rows[0].id;
          return db.addProduct(product1);
        })
        .then(() => db.addProduct(product2))
        .then(() => db.getAllProducts())
        .then((results) => {
          const result1 = results.rows[0];

          expect(result1.name).to.equal('name');
          expect(result1.description).to.equal('desc');
          expect(result1.standard_price).to.equal('$100.00');
          expect(result1.discounted_price).to.equal(null);
          expect(result1.cat_id).to.equal(catId);

          const result2 = results.rows[1];

          expect(result2.name).to.equal('name2');
          expect(result2.description).to.equal('desc2');
          expect(result2.standard_price).to.equal('$150.00');
          expect(result2.discounted_price).to.equal('$120.00');
          expect(result2.cat_id).to.equal(null);

          done();
        });
    });

    it('Should update a product', (done) => {
      let productId;
      const product = {
        name: 'name',
        description: 'desc',
        standard_price: '$100.00',
      };
      const update = {
        description: 'new desc',
        discounted_price: '$79.99',
      };
      db.addProduct(product)
        .then((insertion) => {
          productId = insertion.rows[0].id;
          update.id = insertion.rows[0].id;
          return db.updateProduct(update);
        })
        .then(() => db.getOneProduct(productId))
        .then((results) => {
          const result = results.rows[0];

          expect(result.name).to.equal('name');
          expect(result.description).to.equal('new desc');
          expect(result.standard_price).to.equal('$100.00');
          expect(result.discounted_price).to.equal('$79.99');

          done();
        });
    });
  });
});
