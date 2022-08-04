require('dotenv').config();
const pgp = require('pg-promise')();
const db = pgp(process.env.PG_CONNECTION_STRING);
module.exports = db;