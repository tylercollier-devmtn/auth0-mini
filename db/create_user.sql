INSERT INTO users_auth0_mini (auth0_id, email, profile_name, picture) values ($1, $2, $3, $4)
RETURNING *;
