import Joi from 'joi';
import { ServiceBus, Message } from 'octobus.js';
import pkg from '../package.json';
import pluginOptionsSchema from './schemas/pluginOptions';

const internals = {
  handlers: {},
  replies: {},
};

export function register(server, options, next) { // eslint-disable-line
  const pluginOptions = Joi.attempt(options, pluginOptionsSchema);
  const serviceBus = pluginOptions.serviceBus || new ServiceBus(pluginOptions.transport);

  server.expose('serviceBus', serviceBus);

  server.decorate('server', 'serviceBus', serviceBus);

  server.decorate('request', 'serviceBus', serviceBus);

  server.handler('send', internals.handlers.send);

  server.method('send', (topic, data = {}) => serviceBus.send(topic, data));

  next();
}

register.attributes = {
  pkg,
  dependencies: [],
};

internals.replies.send = function send(topic, data = {}) {
  const { request, response } = this;
  const { serviceBus } = request;

  return serviceBus.send(new Message({ topic, data }))
    .then(response)
    .catch(response);
};

internals.handlers.send = (route, options) => (request, reply) => {
  let topic;
  let data;
  const { serviceBus } = request;

  if (typeof options === 'string') {
    topic = options;
    data = {
      ...request.params,
      ...request.query,
      ...request.payload,
    };
  } else {
    topic = options.topic;
    data = options.getData(request);
  }

  return reply(serviceBus.send(new Message({ topic, data })));
};
