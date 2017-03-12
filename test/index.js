import { Server } from 'hapi'; // eslint-disable-line
import { expect } from 'chai'; // eslint-disable-line
import { ServiceBus, Message, MessageBus } from 'octobus.js';
// import sinon from 'sinon';
import * as HapiOctobus from '../src';

describe('register()', () => {
  let serviceBus;
  let server;

  beforeEach((done) => {
    serviceBus = new ServiceBus();
    server = new Server();
    server.connection();
    server.register({
      register: HapiOctobus.register,
    }, (err) => {
      if (!err) {
        const { messageBus } = server.plugins['hapi-octobus'];
        serviceBus.connect(messageBus);
        serviceBus.subscribe('test', () => 'it works');
      }
      done(err);
    });
  });

  it('exposes a messageBus', () => {
    const { messageBus } = server.plugins['hapi-octobus'];
    expect(messageBus).to.exist();
    expect(server.messageBus).to.exist();
    expect(server.messageBus).to.equal(messageBus);

    return serviceBus.send('test').then((result) => {
      expect(result).to.equal('it works');
    });
  });

  it('accepts a MessageBus instance as options', (done) => {
    const messageBus = new MessageBus();

    server = new Server();
    server.connection();
    server.register({
      register: HapiOctobus.register,
      options: {
        messageBus,
      },
    }, (err) => {
      expect(err).to.be.empty();

      messageBus.onMessage((msg) => {
        if (msg.topic === 'test') {
          messageBus.reply({
            id: msg.id,
            result: 'it works',
          });
        }
      });

      messageBus.send(new Message({ topic: 'test' })).then((result) => {
        expect(result).to.equal('it works');
        done();
      });
    });
  });

  it('exposes messageBus.end as a server method', () => {
    expect(server.methods.send).to.be.a('function');
    return server.methods.send(new Message({ topic: 'test' })).then((result) => {
      expect(result).to.equal('it works');
    });
  });

  it('attaches the messageBus instance to each request', (done) => {
    server.route({
      method: 'GET',
      path: '/',
      handler(request) {
        expect(request.messageBus).to.exist();
        expect(server.messageBus).to.equal(server.plugins['hapi-octobus'].messageBus);
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
    serviceBus.subscribe('say.hello', ({ message }) => `Hello, ${message.data.name}!`);

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
    serviceBus.subscribe('say.hello', ({ message }) => `Hello, ${message.data.name}!`);

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
