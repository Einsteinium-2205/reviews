const db = require('../db/db');

const getAllReviews = (req, res) => {
  const finalObj = {
    "product": req.query.product_id,
    "page" : req.query.page || 0,
    "count" : req.query.count || 5,
  };
  db.manyOrNone(`SELECT id AS review_id, rating, summary, recommend, response, body,
  review_date AS date, reviewer_name, helpfulness FROM reviews WHERE product_id = $1`,
  req.query.product_id)
    .then((data) => {
      const photoPromises = data.map((review) => {
        return db.manyOrNone('SELECT photo_id AS id, photo_url AS url FROM photos WHERE review_id = $1', review.review_id)
        .then((data) => {
          review.date = new Date(Number(review.date)).toISOString();
          review.photos = data;
        })
        .catch((err) => {
          console.log('error retreiving photos', err);
        })
      })
      const addPhotos = Promise.all(photoPromises);
      addPhotos.then(() => {
        finalObj.results = data.splice(0, req.query.count);
        res.status(200).send(finalObj);
      })
      .catch((err) => {
        console.log('error adding photos to final obj', err);
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
}

module.exports = {
  getAllReviews,
}