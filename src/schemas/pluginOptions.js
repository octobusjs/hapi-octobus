import Joi from 'joi';
import { Transport } from 'octobus.js';

export default {
  messageBus: Joi.object(),
  transport: Joi.object().default(new Transport()),
};
