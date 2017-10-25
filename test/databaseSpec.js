/* eslint-env mocha */
const { expect } = require('chai');
const db = require('../db/helpers.js');

describe('Database', () => {
  describe('Query Constructor Helper Functions', () => {
    it('Should create a get query for a specific item when id is provided', () => {
      const table = 'product';
      const id = 1;
      const result = db.constructGetQuery(table, id);
      const expected = 'SELECT * FROM product WHERE id = 1';
      expect(result).to.equal(expected);
    });

    it('Should create a get query for all items', () => {
      const table = 'product';
      const result = db.constructGetQuery(table);
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
      const result = db.constructInsertQuery(table, product);
      const expected = 'INSERT INTO product (name, description, standard_price, discounted_price, cat_id) VALUES (\'nerf gun\', \'best gun in the world\', \'$10.99\', \'$7.99\', \'1\')';
      expect(result).to.equal(expected);
    });

    it('Should create an update query for an item', () => {
      const table = 'product_img';
      const productImg = {
        id: 2,
        img_url: 'http://www.google.com/logo.jpg',
        primary_img: true,
      };
      const result = db.constructUpdateQuery(table, productImg);
      const expected = 'UPDATE product_img SET img_url=\'http://www.google.com/logo.jpg\', primary_img=\'true\' WHERE id = 2';
      expect(result).to.equal(expected);
    });
  });
});
