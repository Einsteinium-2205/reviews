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
