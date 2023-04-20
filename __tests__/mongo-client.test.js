const { MongoClient } = require('mongodb');
const { GenericContainer, Wait, MongoDBContainer } = require('testcontainers');
const mongoose = require('mongoose');


let mongoContainer;
let mongoClient;

describe('mongo client with test containers', () => {
  jest.setTimeout(30_000);
  beforeAll(async () => {

    mongoContainer = new GenericContainer('mongo:4.4.20')
      .withExposedPorts(DB_EXPOSED_PORT)
      .withEnvironment({ MONGO_INITDB_DATABASE: DB_NAME })
      .withWaitStrategy(Wait.forLogMessage(/.*waiting for connections.*/i));
    mongoContainer = await mongoContainer.start().catch(err => console.error(err));
    
    const mongoUri = getUriForMongoContainer(mongoContainer);
    console.log(mongoUri)

    mongoClient = await connectToSessionMongoDb(mongoUri);
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoose.disconnect();
    await mongoContainer.stop();
  });

  it('it works!', async () => {
    const userId = 'irrelevant id';
    await mongoClient.db().collection('users').insertOne({ id: userId });
    const Cat = mongoose.model('Cat', { name: String });
    const kitty = new Cat({ name: 'Zildjian' });
    await kitty.save();

    const user = await mongoClient.db().collection('users').findOne();
    expect(user.id).toBe(userId);

    const cat = await Cat.findOne({ name: kitty.name })
    expect(cat.name).toBe(kitty.name);
  });
});

const DB_NAME = 'test_db';
const DB_EXPOSED_PORT = 27017;

const getUriForMongoContainer = (mongoContainer) => {
  return `mongodb://${mongoContainer.getHost()}:${mongoContainer.getMappedPort(
    DB_EXPOSED_PORT,
  )}/${DB_NAME}`;
};

const connectToSessionMongoDb = async (mongoUri) => {
  const mongoClient = new MongoClient(mongoUri);
  try {
    await mongoClient.connect();
    return mongoClient;
  } catch (error) {
    console.error(error)
    throw error;
  }
};