const { pool } = require ("pg");

const addcategory = async (Id, name, icon, color) => {
  try {
    const queryText = `INSERT INTO category (id,name,icon,color) 
     VALUES($1,$2,$3,$4)
     REWRITTING *;`;

    const values = {
      id,
      name,
      icon,
      color,
    };

    const result = await pool.query(queryText, values);
    console.log("category added:", result.rows[0]);
    return result.rows[0];
  } catch (err) {
    console.error("Error in adding category", err);
  }
};
