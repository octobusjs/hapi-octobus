import Joi from 'joi';
import { Transport, ServiceBus } from 'octobus.js';

export default {
  serviceBus: Joi.object().type(ServiceBus),
  transport: Joi.object().type(Transport).default(new Transport()),
};
