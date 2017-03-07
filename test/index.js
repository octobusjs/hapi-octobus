import { Server } from 'hapi'; // eslint-disable-line
import { expect } from 'chai'; // eslint-disable-line
import { Plugin, Message, ServiceBus } from 'octobus.js';
// import sinon from 'sinon';
import * as HapiOctobus from '../src';

describe('register()', () => {
  let plugin;
  let server;

  beforeEach((done) => {
    plugin = new Plugin();
    server = new Server();
    server.connection();
    server.register({
      register: HapiOctobus.register,
    }, (err) => {
      if (!err) {
        const { serviceBus } = server.plugins['hapi-octobus'];
        plugin.connect(serviceBus);
        plugin.subscribe('test', () => 'it works');
      }
      done(err);
    });
  });

  it('exposes a serviceBus', () => {
    const { serviceBus } = server.plugins['hapi-octobus'];
    expect(serviceBus).to.exist();
    expect(server.serviceBus).to.exist();
    expect(server.serviceBus).to.equal(serviceBus);

    return plugin.send('test').then((result) => {
      expect(result).to.equal('it works');
    });
  });

  it('accepts a ServiceBus instance as options', (done) => {
    const serviceBus = new ServiceBus();

    server = new Server();
    server.connection();
    server.register({
      register: HapiOctobus.register,
      options: {
        serviceBus,
      },
    }, (err) => {
      expect(err).to.be.empty();

      serviceBus.onMessage((msg) => {
        if (msg.topic === 'test') {
          serviceBus.reply({
            id: msg.id,
            result: 'it works',
          });
        }
      });

      serviceBus.send(new Message({ topic: 'test' })).then((result) => {
        expect(result).to.equal('it works');
        done();
      });
    });
  });

  it('exposes serviceBus.end as a server method', () => {
    expect(server.methods.send).to.be.a('function');
    return server.methods.send(new Message({ topic: 'test' })).then((result) => {
      expect(result).to.equal('it works');
    });
  });

  it('attaches the serviceBus instance to each request', (done) => {
    server.route({
      method: 'GET',
      path: '/',
      handler(request) {
        expect(request.serviceBus).to.exist();
        expect(server.serviceBus).to.equal(server.plugins['hapi-octobus'].serviceBus);
        done();
      },
    });

    server.inject('/', () => {});
  });

  it('has a send handler', (done) => {
    server.route({
      method: 'GET',
      path: '/',
      handler: {
        send: 'test',
      },
    });

    server.inject('/', (res) => {
      expect(res.statusCode).to.equal(200);
      expect(res.result).to.equal('it works');
      done();
    });
  });

  it('the send handler gets access to the query parameters', (done) => {
    plugin.subscribe('say.hello', ({ message }) => `Hello, ${message.data.name}!`);

    server.route({
      method: 'GET',
      path: '/',
      handler: {
        send: 'say.hello',
      },
    });

    server.inject('/?name=world', (res) => {
      expect(res.statusCode).to.equal(200);
      expect(res.result).to.equal('Hello, world!');
      done();
    });
  });

  it('the send handler can have a custom parameter parser', (done) => {
    plugin.subscribe('say.hello', ({ message }) => `Hello, ${message.data.name}!`);

    server.route({
      method: 'POST',
      path: '/',
      handler: {
        send: {
          topic: 'say.hello',
          getData({ query, payload }) {
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
