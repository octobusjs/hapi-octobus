import { createEventDispatcher } from 'octobus.js';
import pkg from '../package.json';

const internals = {
  handlers: {},
  replies: {},
};

export function register(server, options, next) {
  const eventDispatcher = createEventDispatcher(options);

  server.expose('eventDispatcher', eventDispatcher);

  server.decorate('server', 'eventDispatcher', eventDispatcher);
  server.decorate('request', 'eventDispatcher', eventDispatcher);
  server.handler('dispatch', internals.handlers.dispatch);

  next();
}

register.attributes = {
  pkg,
  dependencies: [],
};

internals.replies.dispatch = function dispatch(event, params = {}) {
  const { request, response } = this;
  const { eventDispatcher } = request;

  eventDispatcher.dispatch(event, params)
    .then((result) => response(result))
    .catch((err) => response(err));
};

internals.handlers.dispatch = (route, options) => (request, reply) => {
  const event = options;
  const { eventDispatcher } = request;
  const params = {
    ...request.params,
    ...request.query,
    ...request.payload,
  };

  return reply(eventDispatcher.dispatch(event, params));
};
