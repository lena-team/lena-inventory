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
      const result = dbHelpers.constructInsertQuery(table, Object.keys(product));
      const expected = 'INSERT INTO product (name, description, standard_price, discounted_price, cat_id) VALUES ($1, $2, $3, $4, $5) RETURNING id';
      expect(result).to.equal(expected);
    });

    it('Should create an update query for an item with all fields', () => {
      const table = 'product_img';
      const productImg = {
        id: 2,
        img_url: 'http://www.google.com/logo.jpg',
        primary_img: true,
      };
      const result = dbHelpers.constructUpdateQuery(table, Object.keys(productImg).filter(key => key !== 'id'));
      const expected = 'UPDATE product_img SET img_url=$2, primary_img=$3 WHERE id = $1';
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
      const result = dbHelpers.constructUpdateQuery(table, Object.keys(product).filter(key => key !== 'id'));
      const expected = 'UPDATE product SET name=$2, description=$3, standard_price=$4 WHERE id = $1';
      expect(result).to.equal(expected);
    });

    it('Should create a batch insert query for multiple products', () => {
      const productFields = ['name', 'description', 'standard_price', 'discounted_price', 'cat_id'];
      const table = 'product';
      const products = [
        {
          name: 'p1',
          description: 'd1',
          standard_price: '$1.00',
        }, {
          name: 'p2',
          description: 'd2',
          standard_price: '$2.00',
          discounted_price: '$1.00',
        }, {
          name: 'p3',
          cat_id: '1',
          description: 'd3',
          standard_price: '$3.00',
        },
      ];
      const result = dbHelpers.constructBatchInsertQuery(table, productFields, products.length);
      const expected = 'INSERT INTO product (name, description, standard_price, discounted_price, cat_id) VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ($11, $12, $13, $14, $15) RETURNING id';
      expect(result).to.equal(expected);
    });
  });

  describe('Wrapper DB Query Functions', () => {
    let db;

    beforeEach((done) => {
      db = new DBInterface({
        user: process.env.LENA_INVENTORY_DB_USER || 'postgres',
        host: process.env.LENA_INVENTORY_DB_HOST || 'localhost',
        database: process.env.LENA_INVENTORY_DB_DATABASE || 'inventory_test',
        port: process.env.LENA_INVENTORY_DB_PORT || 5432,
      });
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
      const category = {
        id: '1',
        name: 'cat 1',
      };
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
      const parentCategory = {
        id: '1',
        name: 'cat 1',
      };
      const category = {
        id: '1.1',
        name: 'cat 1.1',
        parent_cat_id: '1',
      };
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
      const category = {
        id: '1',
        name: 'cat 1',
      };
      const product = {
        id: '1',
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
      const category = {
        id: '1',
        name: 'cat 1',
      };
      const product = {
        id: '1',
        name: 'name',
        description: 'desc',
        standard_price: '$100.00',
      };
      const productImg = {
        id: '1',
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
      const category = {
        id: '1',
        name: 'cat 1',
      };
      const product = {
        id: '1',
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
      let catId;
      const category = {
        id: '1',
        name: 'cat 1',
      };
      const product1 = {
        id: '1',
        name: 'name',
        description: 'desc',
        standard_price: '$100.00',
      };
      const product2 = {
        id: '2',
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
        id: '1',
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

    it('Should insert multiple products in one batch', (done) => {
      const products = [
        {
          id: '1',
          name: 'p1',
          description: 'd1',
          standard_price: '$1.00',
        }, {
          id: '2',
          name: 'p2',
          description: 'd2',
          standard_price: '$2.00',
          discounted_price: '$1.00',
        }, {
          id: '3',
          name: 'p3',
          description: 'd3',
          standard_price: '$3.00',
        },
      ];

      db.addProduct(products)
        .then(() => db.getAllProducts())
        .then((results) => {
          const result1 = results.rows[0];

          expect(result1.name).to.equal('p1');
          expect(result1.description).to.equal('d1');
          expect(result1.standard_price).to.equal('$1.00');
          expect(result1.discounted_price).to.equal(null);
          expect(result1.cat_id).to.equal(null);

          const result2 = results.rows[1];

          expect(result2.name).to.equal('p2');
          expect(result2.description).to.equal('d2');
          expect(result2.standard_price).to.equal('$2.00');
          expect(result2.discounted_price).to.equal('$1.00');
          expect(result2.cat_id).to.equal(null);

          const result3 = results.rows[2];

          expect(result3.name).to.equal('p3');
          expect(result3.description).to.equal('d3');
          expect(result3.standard_price).to.equal('$3.00');
          expect(result3.discounted_price).to.equal(null);
          expect(result3.cat_id).to.equal(null);

          done();
        });
    });

    it('Should insert multiple categories in one batch', (done) => {
      const categories = [
        {
          id: '1',
          name: 'c1',
        }, {
          id: '2',
          name: 'c2',
        },
      ];

      db.addCategory(categories)
        .then(() => db.query('SELECT * FROM category'))
        .then((results) => {
          const result1 = results.rows[0];

          expect(result1.name).to.equal('c1');

          const result2 = results.rows[1];

          expect(result2.name).to.equal('c2');

          done();
        });
    });

    it('Should insert multiple product images in one batch', (done) => {
      const product = {
        id: '1',
        name: 'p1',
        description: 'd1',
        standard_price: '$1.00',
      };

      const productImgs = [
        {
          id: '1',
          img_url: 'url1',
          primary_img: true,
        }, {
          id: '2',
          img_url: 'url2',
          primary_img: false,
        }, {
          id: '3',
          img_url: 'url3',
          primary_img: false,
        },
      ];

      db.addProduct(product)
        .then((insertions) => {
          for (let i = 0; i < productImgs.length; i += 1) {
            productImgs[i].product_id = insertions.rows[0].id;
          }
        })
        .then(() => db.addProductImg(productImgs))
        .then(() => db.query('SELECT * FROM product_img'))
        .then((results) => {
          const result1 = results.rows[0];

          expect(result1.img_url).to.equal('url1');
          expect(result1.primary_img).to.equal(true);

          const result2 = results.rows[1];

          expect(result2.img_url).to.equal('url2');
          expect(result2.primary_img).to.equal(false);

          const result3 = results.rows[2];

          expect(result3.img_url).to.equal('url3');
          expect(result3.primary_img).to.equal(false);

          done();
        });
    });
  });
});
