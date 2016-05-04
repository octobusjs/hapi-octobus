import { Server } from 'hapi';
import { expect } from 'chai';
// import sinon from 'sinon';
import * as HapiOctobus from '../src';

describe('register()', () => {
  let server;

  beforeEach((done) => {
    server = new Server();
    server.connection();
    server.register({
      register: HapiOctobus.register,
    }, done);
  });

  it('exposes an eventDispatcher instance', () => {
    const { eventDispatcher } = server.plugins['hapi-octobus'];
    expect(eventDispatcher).to.exist();
    expect(server.eventDispatcher).to.exist();
    expect(server.eventDispatcher).to.equal(eventDispatcher);

    eventDispatcher.subscribe('test', () => 'it works!');
    return eventDispatcher.dispatch('test').then((result) => {
      expect(result).to.equal('it works!');
    });
  });
});
