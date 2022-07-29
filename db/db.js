const pgp = require('pg-promise')();
const db = pgp('postgres://sdc@localhost/ratingsandreviews');

module.exports = db;