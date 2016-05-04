import { createEventDispatcher } from 'octobus.js';
import pkg from '../package.json';

export function register(server, options, next) {
  const eventDispatcher = createEventDispatcher(options);

  server.expose('eventDispatcher', eventDispatcher);

  server.decorate('server', 'eventDispatcher', eventDispatcher);

  next();
}

register.attributes = {
  pkg,
  dependencies: [],
};
