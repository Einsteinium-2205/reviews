const db = require('../db/db');

/*
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
*/

const JSONGetAllReviews = (req, res) => {
  let sortBy;
  if (req.query.sort === 'relevant') {
    sortBy = 0;
  } else if (req.query.sort === 'newest') {
    sortBy = 1;
  } else {
    sortBy = 2;
  }
  const page = req.query.page || 0;
  const count = req.query.count || 5;
  const startAt = page * count;
  db.manyOrNone(`
  SELECT json_build_object(
    'product', $1,
    'page', $2,
    'count', $3,
    'results',
    (SELECT coalesce(json_agg(json_build_object(
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
    WHERE product_id = $1 AND reported = false
    )
  )
  `, [req.query.product_id, page, count, sortBy, startAt])
  .then((data) => {
    res.status(200).send(data[0].json_build_object);
  })
  .catch((err) => {
    console.log('error getting all reviews: ', err);
  });
}

/*
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
*/

const JSONGetReviewMetadata = (req, res) => {
  db.oneOrNone(`
  SELECT json_build_object(
    'product_id', $1,
    'ratings', json_strip_nulls(json_build_object(
      '1',  (SELECT COUNT(reviews.rating) FROM
		    (SELECT * FROM reviews WHERE product_id=$1 AND reported=false)
			 AS reviews WHERE rating=1),
      '2',  (SELECT COUNT(reviews.rating) FROM
		    (SELECT * FROM reviews WHERE product_id=$1 AND reported=false)
			 AS reviews WHERE rating=2),
      '3',  (SELECT COUNT(reviews.rating) FROM
		    (SELECT * FROM reviews WHERE product_id=$1 AND reported=false)
			 AS reviews WHERE rating=3),
      '4',  (SELECT COUNT(reviews.rating) FROM
		    (SELECT * FROM reviews WHERE product_id=$1 AND reported=false)
			 AS reviews WHERE rating=4),
      '5',  (SELECT COUNT(reviews.rating) FROM
		    (SELECT * FROM reviews WHERE product_id=$1 AND reported=false)
			 AS reviews WHERE rating=5)
    )),
    'recommended', json_strip_nulls(json_build_object(
      'true',  (SELECT COUNT(reviews.recommend) FROM
		       (SELECT * FROM reviews WHERE product_id=2 AND reported=false)
			    AS reviews WHERE recommend=true),
      'false',  (SELECT COUNT(reviews.recommend) FROM
		        (SELECT * FROM reviews WHERE product_id=2 AND reported=false)
			     AS reviews WHERE recommend=false)
    )),
    'characteristics', json_strip_nulls(json_build_object(
      'Fit', (SELECT json_build_object(
        'id', (SELECT char_id FROM chars WHERE product_id=$1 AND name='Fit'),
        'value', (SELECT ROUND(AVG(value), 6) FROM chars_reviews WHERE char_id=
        (SELECT char_id FROM chars WHERE product_id=$1 AND name='Fit') AND reported=false)
      )),
      'Length', (SELECT json_build_object(
        'id', (SELECT char_id FROM chars WHERE product_id=$1 AND name='Length'),
        'value', (SELECT ROUND(AVG(value), 6) FROM chars_reviews WHERE char_id=
        (SELECT char_id FROM chars WHERE product_id=$1 AND name='Length') AND reported=false)
      )),
      'Comfort', (SELECT json_build_object(
        'id', (SELECT char_id FROM chars WHERE product_id=$1 AND name='Comfort'),
        'value', (SELECT ROUND(AVG(value), 6) FROM chars_reviews WHERE char_id=
        (SELECT char_id FROM chars WHERE product_id=$1 AND name='Comfort') AND reported=false)
      )),
      'Quality', (SELECT json_build_object(
        'id', (SELECT char_id FROM chars WHERE product_id=$1 AND name='Quality'),
        'value', (SELECT ROUND(AVG(value), 6) FROM chars_reviews WHERE char_id=
        (SELECT char_id FROM chars WHERE product_id=$1 AND name='Quality') AND reported=false)
      ))
    ))
  )
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

const postReview = (req, res) => {
  const keys = Object.keys(req.body.characteristics);
  keys.forEach((key, index) => {
    keys[index] = Number(key) || null;
  });
  const values = Object.values(req.body.characteristics);
  db.manyOrNone(`
  WITH ins1 AS (
    INSERT INTO reviews
    VALUES(
      (SELECT MAX(id)+1 FROM reviews),
      $1,
      $2,
      (select extract(epoch from now() at time zone 'utc' at time zone 'utc')),
      $3,
      $4,
      $5,
      false,
      $6,
      $7,
      null,
      0)
    RETURNING id AS review_id, rating, recommend
  ),
  ins2 AS (
  INSERT INTO ratings VALUES(
    $1,0,0,0,0,0,0,0
  )
  ON CONFLICT(product_id) DO NOTHING
  ),
  ins3 AS (
    INSERT INTO chars_reviews
    SELECT *
    FROM (VALUES
      ((SELECT MAX(id)+1 FROM chars_reviews), $13, (SELECT review_id FROM ins1), $14, false),
      ((SELECT MAX(id)+2 FROM chars_reviews), $15, (SELECT review_id FROM ins1), $16, false),
      ((SELECT MAX(id)+3 FROM chars_reviews), $17, (SELECT review_id FROM ins1), $18, false),
      ((SELECT MAX(id)+4 FROM chars_reviews), $19, (SELECT review_id FROM ins1), $20, false)
    ) chars_reviews (id, char_id, review_id, value, reported)
    WHERE char_id IS NOT NULL
  )
  INSERT INTO photos
  SELECT *
  FROM (VALUES
    ((SELECT MAX(photo_id)+1 FROM photos), (SELECT review_id FROM ins1), $8),
    ((SELECT MAX(photo_id)+2 FROM photos), (SELECT review_id FROM ins1), $9),
    ((SELECT MAX(photo_id)+3 FROM photos), (SELECT review_id FROM ins1), $10),
    ((SELECT MAX(photo_id)+4 FROM photos), (SELECT review_id FROM ins1), $11),
    ((SELECT MAX(photo_id)+5 FROM photos), (SELECT review_id FROM ins1), $12)
     ) photos (photo_id, review_id, photo_url)
  WHERE photo_url IS NOT NULL
  RETURNING *;
  `, [
    req.query.product_id, req.body.rating, req.body.summary, req.body.body,
    req.body.recommend, req.body.name, req.body.email, req.body.photos[0],
    req.body.photos[1], req.body.photos[2], req.body.photos[3], req.body.photos[4],
    keys[0], values[0], keys[1], values[1], keys[2], values[2], keys[3], values[3]
  ])
  .then(() => {
    console.log(req.body);
    res.sendStatus(204);
  })
  .catch((err) => {
    console.log('error posting review: ', err);
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
  db.any(`
  WITH cha AS (
    UPDATE chars_reviews
    SET reported = true
    WHERE review_id IN (SELECT id FROM reviews WHERE id=$1)
  )
  UPDATE reviews
  SET reported = true
  WHERE id = $1
  `, req.params.review_id)
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
  postReview,
}