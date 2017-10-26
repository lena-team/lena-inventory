module.exports.constructGetOneQuery = table => `SELECT * FROM ${table} WHERE id = $1`;

module.exports.constructGetAllQuery = table => `SELECT * FROM ${table}`;

module.exports.constructInsertQuery = (table, fields) => {
  const queryVals = fields.map((field, index) => `$${index + 1}`).join(', ');
  return `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${queryVals}) RETURNING id`;
};

module.exports.constructUpdateQuery = (table, fields) => {
  const pairs = fields.map((field, index) => `${field}=$${index + 2}`);
  return `UPDATE ${table} SET ${pairs.join(', ')} WHERE id = $1`;
};

module.exports.constructDeleteQuery = (table, id) => {
  // if id is provided, delete the row with the specified id
  if (id) {
    return `DELETE FROM ${table} WHERE id = ${id}`;
  }
  // otherwise, delete everything from table
  return `DELETE FROM ${table}`;
};
