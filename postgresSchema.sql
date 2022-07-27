DROP DATABASE IF EXISTS ratingsandreviews;
CREATE DATABASE ratingsandreviews;
\connect ratingsandreviews;
CREATE TABLE IF NOT EXISTS reviews (
  review_id INT NOT NULL,
  product_id INT NOT NULL,
  rating INT NOT NULL,
  summary VARCHAR(60),
  recommend BOOLEAN NOT NULL,
  body VARCHAR(1000) NOT NULL,
  inputdate VARCHAR(30) NOT NULL,
  reviewer_name VARCHAR(60) NOT NULL,
  email VARCHAR(60) NOT NULL,
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
  fit_id INT NOT NULL,
  rating NUMERIC NOT NULL,
  PRIMARY KEY (fit_id)
);

CREATE TABLE IF NOT EXISTS product_length (
  length_id INT NOT NULL,
  rating NUMERIC NOT NULL,
  PRIMARY KEY (length_id)
);

CREATE TABLE IF NOT EXISTS product_comfort (
  comfort_id INT NOT NULL,
  rating NUMERIC NOT NULL,
  PRIMARY KEY (comfort_id)
);

CREATE TABLE IF NOT EXISTS product_quality (
  quality_id INT NOT NULL,
  rating NUMERIC NOT NULL,
  PRIMARY KEY (quality_id)
);

CREATE TABLE IF NOT EXISTS ratings (
  ratings_id INT NOT NULL,
  product_id INT NOT NULL,
  oneStar INT NOT NULL,
  twoStar INT NOT NULL,
  threeStar INT NOT NULL,
  fourStar INT NOT NULL,
  fiveStar INT NOT NULL,
  recommended INT NOT NULL,
  notRecommended INT NOT NULL,
  product_fit INT NOT NULL,
  product_length INT NOT NULL,
  product_comfort INT NOT NULL,
  product_quality INT NOT NULL,
  PRIMARY KEY (ratings_id)
);

ALTER TABLE photos
  ADD FOREIGN KEY (review_id)
    REFERENCES reviews (review_id)
    DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ratings
  ADD FOREIGN KEY (product_fit)
    REFERENCES product_fit (fit_id),
  ADD FOREIGN KEY (product_length)
      REFERENCES product_length (length_id),
  ADD FOREIGN KEY (product_comfort)
      REFERENCES product_comfort (comfort_id),
  ADD FOREIGN KEY (product_quality)
      REFERENCES product_quality (quality_id)
      DEFERRABLE INITIALLY DEFERRED;

/*  psql postgres -U sdc < postgresSchema.sql */
