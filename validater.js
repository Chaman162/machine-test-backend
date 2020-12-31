Joi = require('joi')

const validateSchema = (data, schema, options) => {
    return new Promise((resolve, reject) => {
      Joi.validate(data, schema, options, (err, value) => {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      });
    });
  };

module.exports = validateSchema


