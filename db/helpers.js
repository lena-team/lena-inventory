module.exports.constructGetQuery = (table, id) => {
  // if id is provided, return the row with the specified id
  if (id) {
    return `SELECT * FROM ${table} WHERE id = ${id}`;
  }
  // otherwise, return everything from table
  return `SELECT * FROM ${table}`;
};

module.exports.constructInsertQuery = (table, data) => {
  const keys = Object.keys(data);
  // wrap values in single quotes as part of SQL's syntax
  const vals = keys.map(key => `'${data[key]}'`);

  const queryKeys = keys.join(', ');
  const queryVals = vals.join(', ');

  return `INSERT INTO ${table} (${queryKeys}) VALUES (${queryVals}) RETURNING id`;
};

module.exports.constructUpdateQuery = (table, data) => {
  if (data.id === undefined) {
    throw new Error('Must provide id to update an item');
  }

  const pairs = Object.keys(data)
    // id is used to retrieve row, so no need to include in pairs for updating
    .filter(key => key !== 'id')
    // put key-value pairs in `key='value'` format
    .map(key => `${key}='${data[key]}'`);

  const queryPairs = pairs.join(', ');

  return `UPDATE ${table} SET ${queryPairs} WHERE id = ${data.id}`;
};

module.exports.constructDeleteQuery = (table, id) => {
  // if id is provided, delete the row with the specified id
  if (id) {
    return `DELETE FROM ${table} WHERE id = ${id}`;
  }
  // otherwise, delete everything from table
  return `DELETE FROM ${table}`;
};
