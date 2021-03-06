'use strict';

const { Client } = require('./models');
const {
  fieldData,
  recordId,
  transform,
  containerData,
  productInfo,
  databases
} = require('./services');

module.exports = {
  Client,
  Filemaker: Client,
  fieldData,
  recordId,
  transform,
  containerData,
  productInfo,
  databases
};
