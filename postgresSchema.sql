\connect ratingsandreviews;
CREATE TABLE IF NOT EXISTS reviews (
  review_id INT NOT NULL,
  product_id INT NOT NULL,
  rating INT NOT NULL,
  review_date VARCHAR(30) NOT NULL,
  summary VARCHAR(250),
  body VARCHAR(1000) NOT NULL,
  recommend BOOLEAN NOT NULL,
  reported BOOLEAN NOT NULL,
  reviewer_name VARCHAR(60) NOT NULL,
  email VARCHAR(60) NOT NULL,
  response VARCHAR(250),
  helpfulness INT NOT NULL,
  PRIMARY KEY (review_id)
);

CREATE TABLE IF NOT EXISTS photos (
  photo_id INT NOT NULL,
  review_id INT NOT NULL,
  photo_url VARCHAR(200),
  PRIMARY KEY (photo_id)
);

CREATE TABLE IF NOT EXISTS product_fit (
  product_id INT NOT NULL,
  char_id INT NOT NULL
  fit_rating INT NOT NULL,
  total_reviews NUMERIC NOT NULL,
  PRIMARY KEY (product_id)
);

CREATE TABLE IF NOT EXISTS product_length (
  product_id INT NOT NULL,
  length_rating INT NOT NULL,
  total_reviews NUMERIC NOT NULL,
  PRIMARY KEY (product_id)
);

CREATE TABLE IF NOT EXISTS product_comfort (
  product_id INT NOT NULL,
  comfort_rating INT NOT NULL,
  total_reviews NUMERIC NOT NULL,
  PRIMARY KEY (product_id)
);

CREATE TABLE IF NOT EXISTS product_quality (
  product_id INT NOT NULL,
  quality_rating INT NOT NULL,
  total_reviews NUMERIC NOT NULL,
  PRIMARY KEY (product_id)
);

CREATE TABLE IF NOT EXISTS ratings (
  product_id INT NOT NULL,
  oneStar INT NOT NULL,
  twoStar INT NOT NULL,
  threeStar INT NOT NULL,
  fourStar INT NOT NULL,
  fiveStar INT NOT NULL,
  recommended INT NOT NULL,
  notRecommended INT NOT NULL,
  PRIMARY KEY (product_id)
);

/*  psql postgres -U sdc < postgresSchema.sql */


/* First, I split the characteristics.csv into 4 tables of each char type. I saved all
4 queries as .csv files. */

/* Created new tables to populate with csv data for each characteristic. */
CREATE TABLE quality_chars (
	char_id INT NOT NULL,
	product_id INT NOT NULL
);
/* Then, generate a table that sums the chars of all reviews. */

CREATE TABLE length_calc AS (
	SELECT characteristic_id,
	  SUM(value),
	  COUNT(characteristic_id)
	FROM characteristic_reviews
	WHERE EXISTS (
		SELECT char_id
		FROM length_chars
		WHERE characteristic_id=char_id
	)
	GROUP BY characteristic_id
	ORDER BY characteristic_id ASC
)

/* Create a second middleman table, adding the average of two columns. */
CREATE TABLE length_avg AS (
	select *, ROUND(sum / count::numeric, 6) AS average from length_calc
);


/* COMBINE CALCULATED VALUES WITH LIST OF CHARS/PRODUCTID. */
CREATE TABLE lengthlength AS (
SELECT length_chars.id, length_chars.product_id,
length_avg.sum, length_avg.count, length_avg.average
FROM length_chars
LEFT JOIN length_avg
  ON length_chars.id = length_avg.characteristic_id
  GROUP BY length_chars.id, length_chars.product_id,
length_avg.sum, length_avg.count, length_avg.average
  ORDER BY product_id ASC
);

/* Set primary key as char_id. */
ALTER TABLE lengthlength
ADD PRIMARY KEY (char_id);



CREATE TABLE allratings AS (
	SELECT onestar.product_id, onestar.onestar, twostar.twostar,
	threestar.threestar, fourstar.fourstar, fivestar.fivestar,
	recommended.recommended, notrecommended.notrecommended
	FROM onestar
	LEFT JOIN twostar
	ON onestar.product_id = twostar.product_id
	LEFT JOIN threestar
	ON onestar.product_id = threestar.product_id
	LEFT JOIN fourstar
	ON onestar.product_id = fourstar.product_id
	LEFT JOIN fivestar
	ON onestar.product_id = fivestar.product_id
	LEFT JOIN recommended
	ON onestar.product_id = recommended.product_id
	LEFT JOIN notrecommended
	ON onestar.product_id = recommended.product_id
	GROUP BY onestar.product_id, onestar.onestar, twostar.twostar,
	threestar.threestar, fourstar.fourstar, fivestar.fivestar,
	recommended.recommended, notrecommended.notrecommended
	ORDER BY product_id ASC
);


SELECT photo_id AS id, photo_url AS url, review_id
FROM photos
WHERE photos.review_id in (
	SELECT id AS review_id
	FROM reviews
	WHERE product_id = 37311 AND reported = false
)


SELECT r.id AS review_id, r.rating, r.summary, r.recommend, r.response, r.body,
r.review_date AS date, r.reviewer_name, r.helpfulness
(SELECT json_agg(json_build_object(
	'id', p.photo_id,
	'url', p.photo_url
  ))
 FROM photos p
 WHERE p.review_id = r.id)
FROM reviews AS r
WHERE r.product_id = 37311 AND r.reported = false


'product', 2,
'page', 0,
'count', 5,
'results', (SELECT json_agg(json_build_object(
	'review_id', r.id,
	'rating', r.rating,
	'summary', r.summary,
	'recommend', r.response,
	'body', r.body,
	'date', r.review_date,
	'reviewer_name', r.reviewer_name,
	'helpfulness', r.helpfulness
))
FROM reviews r
WHERE product_id = 2 AND reported = false AS results
)

SELECT json_build_object(
	'product_id', 2,
	'ratings', json_build_object(
		'1', r.onestar,
		'2', r.twostar,
		'3', r.threestar,
		'4', r.fourstar,
		'5', r.fivestar
	),
	'recommended', json_build_object(
		'true', r.recommended,
		'false', r.notrecommended
	),
	'characteristics', json_build_object(
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
		    FROM product_fit pc
		    WHERE pc.product_id = r.product_id),
		'Quality', (SELECT json_build_object(
			'id', pq.char_id,
			'value', pq.average)
		    FROM product_fit pq
		    WHERE pq.product_id = r.product_id)
	)
)
FROM ratings r
WHERE r.product_id = 1;


WITH ins1 AS (
  INSERT INTO reviews
  VALUES(
      (SELECT MAX(id)+1 FROM reviews),
	  123456789,
	  4,
	  (select extract(epoch from now())),
	  'new summary',
	  'new body',
	  true,
	  false,
	  'new name',
	  'new email',
	  null,
	  0)
	RETURNING id AS review_id
)
INSERT INTO photos
VALUES((SELECT MAX(photo_id)+1 FROM photos), (SELECT review_id FROM ins1), 'http://google.com')
RETURNING *;




WITH ins1 AS (
  INSERT INTO reviews
  VALUES(
      (SELECT MAX(id)+1 FROM reviews),
	  123456789,
	  3,
	  (select extract(epoch from now())),
	  'new summary',
	  'new body',
	  true,
	  false,
	  'new name',
	  'new email',
	  null,
	  0)
	RETURNING id AS review_id, rating, recommend
),
ins2 AS (
INSERT INTO ratings VALUES(
	123456789,0,0,0,0,0,0,0
)
ON CONFLICT(product_id) DO NOTHING
),
up1 AS (
UPDATE product_comfort
SET average = (SELECT ROUND(AVG(rating), 6) from reviews where product_id=123456789)
WHERE product_comfort.product_id = 123456789
),
up2 AS (
UPDATE product_fit
SET average = (SELECT ROUND(AVG(rating), 6) from reviews where product_id=123456789)
WHERE product_fit.product_id = 123456789
),
up3 AS (
UPDATE product_length
SET average = (SELECT ROUND(AVG(rating), 6) from reviews where product_id=123456789)
WHERE product_length.product_id = 123456789
),
up4 AS (
UPDATE product_quality
SET average = (SELECT ROUND(AVG(rating), 6) from reviews where product_id=123456789)
WHERE product_quality.product_id = 123456789
),
up5 AS (
UPDATE ratings
SET onestar = onestar + 1
WHERE (SELECT rating FROM ins1)=1 AND ratings.product_id=123456789
),
up6 AS (
UPDATE ratings
SET twostar = twostar + 1
WHERE (SELECT rating FROM ins1)=2 AND ratings.product_id=123456789
),
up7 AS (
UPDATE ratings
SET threestar = threestar + 1
WHERE (SELECT rating FROM ins1)=3 AND ratings.product_id=123456789
),
up8 AS (
UPDATE ratings
SET fourstar = fourstar + 1
WHERE (SELECT rating FROM ins1)=4 AND ratings.product_id=123456789
),
up9 AS (
UPDATE ratings
SET fivestar = fivestar + 1
WHERE (SELECT rating FROM ins1)=5 AND ratings.product_id=123456789
),
up10 AS (
UPDATE ratings
SET recommended = recommended + 1
WHERE (SELECT recommend FROM ins1)=true AND ratings.product_id=123456789
),
up11 AS (
UPDATE ratings
SET notrecommended = notrecommended + 1
WHERE (SELECT recommend FROM ins1)=false AND ratings.product_id=123456789
)
INSERT INTO photos
SELECT *
FROM (VALUES
	((SELECT MAX(photo_id)+1 FROM photos), (SELECT review_id FROM ins1), NULL),
	((SELECT MAX(photo_id)+2 FROM photos), (SELECT review_id FROM ins1), 'http://yay.com'),
	((SELECT MAX(photo_id)+3 FROM photos), (SELECT review_id FROM ins1), 'http://yo.com'),
	((SELECT MAX(photo_id)+4 FROM photos), (SELECT review_id FROM ins1), 'http://sup.com'),
	((SELECT MAX(photo_id)+5 FROM photos), (SELECT review_id FROM ins1), 'http://heyo.com')
   ) photos (photo_id, review_id, photo_url)
WHERE photo_url IS NOT NULL
RETURNING *;