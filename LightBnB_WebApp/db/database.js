const db = require('.');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const query = `
      SELECT *
      FROM users
      WHERE email = $1;
      `;
  return db.query(query, [email])
    .then(function(result) {
      if (result.rows) {
        return result.rows[0];
      }
      return null;
    })
    .catch(function(err) {
      console.log(err.message);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const query = `
      SELECT *
      FROM users
      WHERE id = $1;
    `;
  return db.query(query, [id])
    .then(function(result) {
      if (result.rows) {
        return result.rows[0];
      }
      return null;
    })
    .catch(function(err) {
      console.log(err.message);
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const query = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING *;
      `;
  return db.query(query, [user.name, user.email, user.password])
    .then(function(result) {
      return result.rows[0];
    })
    .catch(function(err) {
      console.log(err.message);
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guestId, limit = 10) {
  const query = `
      SELECT reservations.*, properties.*, AVG(property_reviews.rating) as average_rating
      FROM properties
      JOIN reservations ON properties.id = reservations.property_id
      JOIN property_reviews ON properties.id = property_reviews.property_id
      WHERE reservations.guest_id = $1 AND end_date < now()::date
      GROUP BY reservations.id, properties.id
      ORDER BY reservations.start_date
      LIMIT $2;
      `;
  return db.query(query, [guestId, limit])
    .then(function(result) {
      return result.rows;
    })
    .catch(function(err) {
      console.log(err.message);
    });
};

/// Properties

// Detects position of queryParam, adds either WHERE or AND
const clauseToggle = function(query) {
  if (query.length === 1) {
    return 'WHERE';
  }
  return 'AND';
};

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const queryParams = [];

  let query = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    query += `${clauseToggle(queryParams)} city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    query += `${clauseToggle(queryParams)} owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    query += `${clauseToggle(queryParams)} cost_per_night >= $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100);
    query += `${clauseToggle(queryParams)} cost_per_night <= $${queryParams.length} `;
  }

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    query += `${clauseToggle(queryParams)} rating >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  query += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
  `;

  return db.query(query, queryParams)
    .then(function(result) {
      return result.rows;
    })
    .catch(function(err) {
      console.log(err.message);
    });
};
  
/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const query = `
      INSERT INTO properties (
      owner_id,
      title,
      description,
      thumbnail_photo_url,
      cover_photo_url,
      cost_per_night,
      street, 
      city,
      province,
      post_code,
      country,
      parking_spaces,
      number_of_bathrooms,
      number_of_bedrooms)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;`;
  return db.query(query,
    [
      property.owner_id,
      property.title,
      property.description,
      property.thumbnail_photo_url,
      property.cover_photo_url,
      property.cost_per_night,
      property.street,
      property.city,
      property.province,
      property.post_code,
      property.country,
      property.parking_spaces,
      property.number_of_bathrooms,
      property.number_of_bedrooms
    ])
    .then(function(result) {
      return result.rows[0];
    })
    .catch(function(err) {
      console.log(err.message);
    });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};