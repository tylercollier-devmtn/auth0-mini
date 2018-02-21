CREATE TABLE users_auth0_mini (
  id SERIAL PRIMARY KEY,
  auth0_id VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  profile_name TEXT NOT NULL,
  picture TEXT NOT NULL
);
