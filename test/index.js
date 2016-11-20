import { Server } from 'hapi'; // eslint-disable-line
import { expect } from 'chai'; // eslint-disable-line
import Octobus from 'octobus.js';
// import sinon from 'sinon';
import * as HapiOctobus from '../src';

describe('register()', () => {
  let server;

  beforeEach((done) => {
    server = new Server();
    server.connection();
    server.register({
      register: HapiOctobus.register,
    }, (err) => {
      if (!err) {
        const { eventDispatcher } = server.plugins['hapi-octobus'];
        eventDispatcher.subscribe('test', () => 'it works');
      }
      done(err);
    });
  });

  it('exposes an eventDispatcher instance', () => {
    const { eventDispatcher } = server.plugins['hapi-octobus'];
    expect(eventDispatcher).to.exist();
    expect(server.eventDispatcher).to.exist();
    expect(server.eventDispatcher).to.equal(eventDispatcher);

    return eventDispatcher.dispatch('test').then((result) => {
      expect(result).to.equal('it works');
    });
  });

  it('can use an existing eventDispatcher instance', (done) => {
    const eventDispatcher = new Octobus();

    server = new Server();
    server.connection();
    server.register({
      register: HapiOctobus.register,
      options: {
        eventDispatcher,
      },
    }, (err) => {
      expect(err).to.be.empty();

      eventDispatcher.subscribe('test', () => 'it works');

      eventDispatcher.dispatch('test').then((result) => {
        expect(result).to.equal('it works');
        done();
      });
    });
  });

  it('exposes dispatch as a server method', () => {
    const { eventDispatcher } = server.plugins['hapi-octobus'];
    expect(server.methods.dispatch).to.be.a('function');
    return eventDispatcher.dispatch('test').then((result) => {
      expect(result).to.equal('it works');
    });
  });

  it('attaches the eventDispatcher to each request', (done) => {
    server.route({
      method: 'GET',
      path: '/',
      handler(request) {
        expect(request.eventDispatcher).to.exist();
        expect(server.eventDispatcher).to.equal(server.plugins['hapi-octobus'].eventDispatcher);
        done();
      },
    });

    server.inject('/', () => {});
  });

  it('has a dispatch handler', (done) => {
    server.route({
      method: 'GET',
      path: '/',
      handler: {
        dispatch: 'test',
      },
    });

    server.inject('/', (res) => {
      expect(res.statusCode).to.equal(200);
      expect(res.result).to.equal('it works');
      done();
    });
  });

  it('the dispatch handler gets access to the query parameters', (done) => {
    const { eventDispatcher } = server.plugins['hapi-octobus'];
    eventDispatcher.subscribe('say.hello', ({ params }) => `Hello, ${params.name}!`);

    server.route({
      method: 'GET',
      path: '/',
      handler: {
        dispatch: 'say.hello',
      },
    });

    server.inject('/?name=world', (res) => {
      expect(res.statusCode).to.equal(200);
      expect(res.result).to.equal('Hello, world!');
      done();
    });
  });

  it('the dispatch handler can have a custom parameter parser', (done) => {
    const { eventDispatcher } = server.plugins['hapi-octobus'];
    eventDispatcher.subscribe('say.hello', ({ params }) => `Hello, ${params.name}!`);

    server.route({
      method: 'POST',
      path: '/',
      handler: {
        dispatch: {
          event: 'say.hello',
          buildParams({ query, payload }) {
            return {
              name: `${query.firstName} ${payload.lastName.toUpperCase()}`,
            };
          },
        },
      },
    });

    server.inject({
      method: 'POST',
      url: '/?firstName=John',
      payload: {
        lastName: 'Doe',
      },
    }, (res) => {
      expect(res.statusCode).to.equal(200);
      expect(res.result).to.equal('Hello, John DOE!');
      done();
    });
  });
});
