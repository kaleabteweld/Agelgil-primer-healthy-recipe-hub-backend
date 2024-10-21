## Badges

![mongodb 7.0.2](https://img.shields.io/badge/MongoDB-v7.0.2-green)
![nodeJs 20.9.0](https://img.shields.io/badge/Node.js-20.9.0-green)

# Agelgil

Agelgil primer healthy recipe hub is a user-friendly platform that enables people with a range of dietary demands to find, share, and access an extensive library of homemade offers with personalised recipe recommendations based on individual dietary needs and health conditions.n

## Environment Variables

To run this project, you will need to add the following environment variables to your **.env file on /api/.env.[development | production]**

### .env.development

need to add .env.development to run Locally

### .env.production

need to add .env.production for production

`DATABASE_URL`: This environment variable stores the connection string to your MongoDB database. For instance, it could point to a MongoDB Atlas cluster (e.g., `mongodb+srv://<username>:<password>@cluster0.mongodb.net/myDatabase`) or a local MongoDB instance for development purposes.

`MONGOMS_SYSTEM_BINARY`: This variable specifies the path to the MongoDB system binary (e.g., `mongod.exe`). It's primarily used in testing scenarios that require MongoDB, particularly when using versions like **MongoDB v6.0.9**.

`APP_PORT`: The port number on which your application will run. For example, in a local environment, this could be set to `3000` for a Node.js app or any other port number depending on the server configuration.

`REDIS_URL`: The connection string for your Redis server. Redis is typically used for caching and real-time functionality. For example, `redis://localhost:6379` for a local instance or `redis://<username>:<password>@redis.cloudprovider.com:6379` for a cloud-based Redis service.

#### JWT Secrets

`USER_SECRET`, `MODERATOR_SECRET`, `CONTROLLER_SECRET`: These are the JWT (JSON Web Token) secret keys used to sign and verify tokens for different roles within your application. Each role (user, moderator, and controller) has its own secret for security.

`USER_REfRESH_SECRET`, `MODERATOR_REfRESH_SECRET`, `CONTROLLER_REfRESH_SECRET`: These secrets are specifically used for generating refresh tokens, which allow users to obtain new access tokens without re-logging in.

#### API Keys and Encryption

`CALORIENINJAS_API_KEY`: This key allows access to the CalorieNinjas API

`CIPHERIV_SECRET_KEY`: A key used for encrypting and decrypting sensitive shareable links

`SHAREABLE_LINK_BASE_URL`: This variable defines the base URL used for generating shareable links in your application (e.g., `http://myapp.com/page?id=1`)

#### DataStax (Astra) Configuration

`DATASAX_ASTRA_TOKEN`: The token used to authenticate with the DataStax Astra database.
`DATASAX_ASTRA_DB_NAME`: The name of the database you're using on DataStax Astra.
`DATASAX_ASTRA_API_Endpoint`: The API endpoint for communicating with DataStax Astra (e.g., `https://<database-id>-<region>.apps.astra.datastax.com`).

#### Neo4j Database Configuration

`NEO4J_URL`: The connection URL to your Neo4j database instance. This typically follows the `bolt://` protocol (e.g., `bolt://localhost:7687` for a local instance).
`NEO4J_USER`: The username used for Neo4j authentication.
`NEO4J_PASSWORD`: The password used for Neo4j authentication.
`NEO4J_DATABASE`: The name of the specific database used within Neo4j.

## Run Locally

Clone the project

```bash
  git clone https://github.com/kaleabteweld/Agelgil-primer-healthy-recipe-hub-backend
```

Go to the project directory

```bash
  cd Agelgil-primer-healthy-recipe-hub-backend
```

Install dependencies

```bash
  npm install
```

Start the Development server (will set NODE_ENV to development)

```bash
  npm run dev
```

## Running Tests

To run tests, run the following command

```bash
  npm run test
```
