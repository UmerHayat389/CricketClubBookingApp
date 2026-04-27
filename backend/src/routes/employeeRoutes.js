const express = require('express');
const router = express.Router();

const {
  createEmployee,
  getEmployees,
} = require('../controllers/employeeController');

router.post('/', createEmployee);
router.get('/', getEmployees);

module.exports = router;