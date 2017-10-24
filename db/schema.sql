-- DROP DATABASE IF EXISTS inventory;
-- CREATE DATABASE inventory;

CREATE TABLE IF NOT EXISTS product (
  product_id integer PRIMARY KEY,
  name varchar(80) NOT NULL,
  description text NOT NULL,
  standard_price money NOT NULL,
  discounted_price money,
  cat_id integer NOT NULL references category(cat_id)
);

CREATE TABLE IF NOT EXISTS category (
  cat_id integer PRIMARY KEY,
  name varchar(40) NOT NULL,
  parent_cat_id integer references category(cat_id)
);

CREATE TABLE IF NOT EXISTS product_img (
  img_id integer PRIMARY KEY,
  product_id integer NOT NULL references product(product_id),
  img_url varchar(200) NOT NULL,
  primary_img boolean NOT NULL
);
