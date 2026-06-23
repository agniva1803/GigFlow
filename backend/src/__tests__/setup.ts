import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

// A real (in-memory) MongoDB instance is used instead of mocking Mongoose,
// because mocking an ODM's query builder chain (`.find().sort().populate()`)
// tends to produce tests that pass against the mock but not the real
// behaviour. mongodb-memory-server gives genuine query semantics — indexes,
// validation, population — at roughly the speed of a mock.
//
// Version is pinned to 7.0.x because mongodb-memory-server's default binary
// lookup can 404 on newer Linux distros where older patch releases were
// pulled from MongoDB's download server; 7.0.x is broadly available.
beforeAll(async () => {
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.NODE_ENV = 'test';

  mongoServer = await MongoMemoryServer.create({
    binary: { version: '7.0.14' },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
