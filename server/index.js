require('dotenv').config();
const express = require('express');
const { getAllReviews, getReviewMetadata, markReviewAsHelpful, reportReview, JSONGetAllReviews, JSONGetReviewMetadata } = require('./helpers');
const app = express();
app.use(express.json());

// routes
app.get('/reviews', (req, res) => {
  JSONGetAllReviews(req, res);
})

app.get('/reviews/meta', (req, res) => {
  JSONGetReviewMetadata(req, res);
})
app.post('/reviews', (req, res) => {

})
app.put('/reviews/:review_id/helpful', (req, res) => {
  markReviewAsHelpful(req, res);
})
app.put('/reviews/:review_id/report', (req, res) => {
  reportReview(req, res);
})

const port = process.env.PORT || 8080;
app.listen(port);
console.log(`Listening on http://localhost:${port}`);