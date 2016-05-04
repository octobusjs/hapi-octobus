import { Server } from 'hapi';
import { expect } from 'chai';
// import sinon from 'sinon';
import * as HapiOctobus from '../src';

describe('register()', () => {
  it('exposes an eventDispatcher instance', () => {
    const server = new Server();
    server.connection();
    server.register({
      register: HapiOctobus.register,
    }, (err) => {
      expect(err).to.not.exist();
      expect(server.eventDispatcher).to.exist();
    });
  });
});
