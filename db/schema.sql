-- DROP DATABASE IF EXISTS inventory;
-- CREATE DATABASE inventory;

CREATE TABLE IF NOT EXISTS category (
  id serial PRIMARY KEY,
  name varchar(40) NOT NULL UNIQUE,
  parent_cat_id integer references category(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product (
  id serial PRIMARY KEY,
  name varchar(80) NOT NULL,
  description text NOT NULL,
  standard_price money NOT NULL,
  discounted_price money,
  cat_id integer references category(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_img (
  id serial PRIMARY KEY,
  product_id integer NOT NULL references product(id) ON DELETE CASCADE,
  img_url varchar(200) NOT NULL,
  primary_img boolean NOT NULL
);
