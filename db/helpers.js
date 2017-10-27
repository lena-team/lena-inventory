module.exports.constructGetOneQuery = table => `SELECT * FROM ${table} WHERE id = $1`;

module.exports.constructGetAllQuery = table => `SELECT * FROM ${table}`;

module.exports.constructInsertQuery = (table, fields) => {
  const queryVals = fields.map((field, index) => `$${index + 1}`).join(', ');
  return `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${queryVals}) RETURNING id`;
};

const getQueryParamTemplate = (fieldsCount, itemsCount) => {
  const result = [];

  let paramsCountSoFar = 0;
  let item = [];

  while (paramsCountSoFar < fieldsCount * itemsCount) {
    item.push(`$${paramsCountSoFar + 1}`);

    paramsCountSoFar += 1;

    if (paramsCountSoFar % fieldsCount === 0) {
      result.push(`(${item.join(', ')})`);
      item = [];
    }
  }

  return result.join(', ');
};

module.exports.constructBatchInsertQuery = (table, fields, itemsCount) => {
  const fieldsCount = Object.keys(fields).length;
  const params = getQueryParamTemplate(fieldsCount, itemsCount);
  return `INSERT INTO ${table} (${fields.join(', ')}) VALUES ${params} RETURNING id`;
};

module.exports.constructUpdateQuery = (table, fields) => {
  const pairs = fields.map((field, index) => `${field}=$${index + 2}`);
  return `UPDATE ${table} SET ${pairs.join(', ')} WHERE id = $1`;
};

module.exports.constructDeleteOneQuery = table => `DELETE FROM ${table} WHERE id = $1`;

module.exports.constructDeleteAllQuery = table => `DELETE FROM ${table}`;
