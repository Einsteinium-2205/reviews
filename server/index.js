require('dotenv').config();
const express = require('express');
const { getAllReviews } = require('./helpers');
const app = express();
app.use(express.json());

// routes
app.get('/reviews', (req, res) => {
  getAllReviews(req, res);
})

app.get('/reviews/meta', (req, res) => {
  getAllReviews(req, res)
  .then((data) => {
    res.status(200).send(data);
  })
  .catch((err) => {
    res.status(500).send(err);
  });
})
app.post('/reviews', (req, res) => {

})
app.put('/reviews/:review_id/helpful', (req, res) => {

})
app.put('/reviews/:review_id/report', (req, res) => {

})

const port = process.env.PORT || 3000;
app.listen(port);
console.log(`Listening on http://localhost:${port}`);