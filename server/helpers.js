const db = require('../db/db');

const getAllReviews = (req, res) => {
  const finalObj = {
    "product": req.query.product_id,
    "page" : req.query.page || 0,
    "count" : req.query.count || 5,
  };
  db.manyOrNone(`SELECT id AS review_id, rating, summary, recommend, response, body,
  review_date AS date, reviewer_name, helpfulness FROM reviews
  WHERE product_id = $1 AND reported = false`, req.query.product_id)
    .then((data) => {
      const photoPromises = data.map((review, index) => {
        return db.manyOrNone('SELECT photo_id AS id, photo_url AS url FROM photos WHERE review_id = $1', review.review_id)
        .then((data) => {
          review.date = new Date(Number(review.date)).toISOString();
          review.photos = data;
        })
        .catch((err) => {
          console.log('error retreiving photos', err);
        })
      });
      const addPhotos = Promise.all(photoPromises);
      addPhotos.then(() => {
        finalObj.results = data.splice(finalObj.page * (finalObj.count - 1), finalObj.count);
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

const JSONGetAllReviews = (req, res) => {
  db.manyOrNone(`
  SELECT json_build_object(
    'product', $1,
    'page', $2,
    'count', $3,
    'results', (SELECT coalesce(json_agg(json_build_object(
      'review_id', r.id,
      'rating', r.rating,
      'summary', r.summary,
      'recommend', r.recommend,
      'response', r.response,
      'body', r.body,
      'date', (SELECT to_char(TIMESTAMP WITH Time Zone 'epoch' + r.review_date * INTERVAL '1 millisecond', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
      'reviewer_name', r.reviewer_name,
      'helpfulness', r.helpfulness,
      'photos', (SELECT coalesce(json_agg(json_build_object(
        'id', p.photo_id,
        'url', p.photo_url
      )), '[]'::json)
      FROM photos p
      WHERE p.review_id = r.id)
    )), '[]'::json)
    FROM reviews r
    WHERE product_id = $1 AND reported = false)
    )
  `, [req.query.product_id, req.query.page || 0, req.query.count || 5])
  .then((data) => {
    res.status(200).send(data[0].json_build_object);
  })
  .catch((err) => {
    console.log('error getting all reviews: ', err);
  });
}

const getReviewMetadata = (req, res) => {
  const finalObj = {
    "product_id": req.query.product_id,
    "ratings": {},
    "recommended": {},
    "characteristics": {},
  };
  db.oneOrNone('SELECT * FROM ratings WHERE product_id = $1', req.query.product_id)
  .then((data) => {
    if (data === null) {
      res.status(200).send({});
    }
    finalObj.ratings["1"] = data.onestar;
    finalObj.ratings["2"] = data.twostar;
    finalObj.ratings["3"] = data.threestar;
    finalObj.ratings["4"] = data.fourstar;
    finalObj.ratings["5"] = data.fivestar;
    finalObj.recommended["false"] = data.notrecommended;
    finalObj.recommended["true"] = data.recommended;
    const productFit = db.oneOrNone('SELECT char_id, average FROM product_fit WHERE product_id = $1', req.query.product_id)
    .then((data) => {
      if (!data.average) {
        return;
      }
      finalObj.characteristics["Fit"] = {
        "id": data.char_id,
        "value": data.average,
      };
    })
    .catch((err) => {
      console.log('Error retreiving a value');
    });
    const productLength = db.oneOrNone('SELECT char_id, average FROM product_length WHERE product_id = $1', req.query.product_id)
    .then((data) => {
      if (!data.average) {
        return;
      }
      finalObj.characteristics["Length"] = {
        "id": data.char_id,
        "value": data.average,
      };
    })
    .catch((err) => {
      console.log('Error retreiving a value');
    });
    const productComfort = db.oneOrNone('SELECT char_id, average FROM product_comfort WHERE product_id = $1', req.query.product_id)
    .then((data) => {
      if (!data.average) {
        return;
      }
      finalObj.characteristics["Comfort"] = {
        "id": data.char_id,
        "value": data.average,
      };
    })
    .catch((err) => {
      console.log('Error retreiving a value');
    });
    const productQuality = db.oneOrNone('SELECT char_id, average FROM product_quality WHERE product_id = $1', req.query.product_id)
    .then((data) => {
      if (!data.average) {
        return;
      }
      finalObj.characteristics["Quality"] = {
        "id": data.char_id,
        "value": data.average,
      };
    })
    .catch((err) => {
      console.log('Error retreiving a value');
    });
    const allChars = Promise.all([productFit, productLength, productComfort, productQuality]);
    allChars.then(() => {
      res.status(200).send(finalObj);
    })
  })
  .catch((err) => {
    console.log('error retreiving ratings: ', err);
    res.status(500).send(err);
  });
}

const JSONGetReviewMetadata = (req, res) => {
  db.oneOrNone(`
  SELECT json_build_object(
    'product_id', $1,
    'ratings', json_strip_nulls(json_build_object(
      '1', r.onestar,
      '2', r.twostar,
      '3', r.threestar,
      '4', r.fourstar,
      '5', r.fivestar
    )),
    'recommended', json_strip_nulls(json_build_object(
      'true', r.recommended,
      'false', r.notrecommended
    )),
    'characteristics', json_strip_nulls(json_build_object(
      'Fit', (SELECT json_build_object(
        'id', pf.char_id,
        'value', pf.average)
          FROM product_fit pf
          WHERE pf.product_id = r.product_id),
      'Length', (SELECT json_build_object(
        'id', pl.char_id,
        'value', pl.average)
          FROM product_length pl
          WHERE pl.product_id = r.product_id),
      'Comfort', (SELECT json_build_object(
        'id', pc.char_id,
        'value', pc.average)
          FROM product_comfort pc
          WHERE pc.product_id = r.product_id),
      'Quality', (SELECT json_build_object(
        'id', pq.char_id,
        'value', pq.average)
          FROM product_quality pq
          WHERE pq.product_id = r.product_id)
    )
  ))
  FROM ratings r
  WHERE r.product_id = $1
  `, [req.query.product_id])
  .then((data) => {
    if (data === null) {
      res.status(200).send({
        "product_id": req.query.product_id,
        "ratings": {},
        "recommended": {},
        "Characteristics": {}
      });
    } else {
      res.status(200).send(data.json_build_object);
    }
  })
  .catch((err) => {
    console.log('error getting metadata: ', err);
    res.status(500).send(err);
  });
}

const markReviewAsHelpful = (req, res) => {
  db.any('UPDATE reviews SET helpfulness = helpfulness + 1 WHERE id = $1', req.params.review_id)
    .then((data) => {
      console.log(data);
      res.sendStatus(204);
    })
    .catch((err) => {
      console.log('error marking as helpful: ', err);
      res.status(500).send(err);
    });
}

const reportReview = (req, res) => {
  db.any('UPDATE reviews SET reported = true WHERE id = $1', req.params.review_id)
    .then((data) => {
      res.sendStatus(204);
    })
    .catch((err) => {
      console.log('error marking as helpful: ', err);
      res.status(500).send(err);
    });
}

module.exports = {
  getAllReviews,
  getReviewMetadata,
  markReviewAsHelpful,
  reportReview,
  JSONGetAllReviews,
  JSONGetReviewMetadata,
}