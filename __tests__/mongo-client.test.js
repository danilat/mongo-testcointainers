let mongoContainer;
var mongoClient;

describe('mongo client with test containers', () => {
  jest.setTimeout(240_000);
  beforeAll(async () => {

    mongoContainer = new GenericContainer('mongo:4.4.20')
      .withExposedPorts(DB_EXPOSED_PORT)
      .withEnvironment({ MONGO_INITDB_DATABASE: DB_NAME })
      .withWaitStrategy(Wait.forLogMessage(/.*waiting for connections.*/i))
      .withStartupTimeout(5_000);
    mongoContainer = await mongoContainer.start().catch(err => console.error(err));
    
    //const mongoUri = `mongodb://localhost:27017/${DB_NAME}`
    const mongoUri = getUriForMongoContainer(mongoContainer);
    console.log(mongoUri)

    await connectToSessionMongoDb(mongoUri);

  });

  afterAll(async () => {
    await disconnectToSessionMongoDb();
    await mongoContainer.stop();
  });

  it('it works!', async () => {
    const userId = 'irrelevant id';
    await mongoClient.db().collection('users').insertOne({ id: userId });

    const document = await mongoClient.db().collection('users').findOne();

    expect(document.id).toBe(userId);
  });
});

const { MongoClient } = require('mongodb');
const { GenericContainer, Wait, MongoDBContainer } = require('testcontainers');


const DB_NAME = 'test_db';
const DB_EXPOSED_PORT = 27017;

const getUriForMongoContainer = (mongoContainer) => {
  return `mongodb://${mongoContainer.getHost()}:${mongoContainer.getMappedPort(
    DB_EXPOSED_PORT,
  )}/${DB_NAME}`;
};

const connectToSessionMongoDb = async (mongoUri) => {
  mongoClient = new MongoClient(mongoUri);
  try {
    await mongoClient.connect();
  } catch (error) {
    console.error(error)
  }
};


const disconnectToSessionMongoDb = async () => {
  await mongoClient.close();
};