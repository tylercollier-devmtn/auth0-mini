INSERT INTO users_auth0_mini (auth0_id, email, profile_name, picture) values (${auth0_id}, ${email}, ${profile_name}, ${picture})
RETURNING *;
