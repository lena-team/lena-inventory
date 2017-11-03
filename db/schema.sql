-- DROP DATABASE IF EXISTS inventory;
-- CREATE DATABASE inventory;

CREATE TABLE IF NOT EXISTS category (
  id char(36) PRIMARY KEY,
  name varchar(40) NOT NULL UNIQUE,
  parent_cat_id char(36) references category(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product (
  id char(36) PRIMARY KEY,
  created_at timestamp DEFAULT current_timestamp,
  updated_at timestamp DEFAULT current_timestamp,
  name varchar(80) NOT NULL,
  description text NOT NULL,
  standard_price money NOT NULL,
  discounted_price money,
  cat_id char(36) references category(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_img (
  id char(36) PRIMARY KEY,
  product_id char(36) NOT NULL references product(id) ON DELETE CASCADE,
  img_url varchar(200) NOT NULL,
  primary_img boolean NOT NULL
);

CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update
BEFORE UPDATE
ON product
FOR EACH ROW EXECUTE PROCEDURE 
update_updated_at_timestamp();
