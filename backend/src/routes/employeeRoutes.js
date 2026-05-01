const express = require('express');
const router = express.Router();

const {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');

const upload = require('../middleware/uploadMiddleware');

router.get('/',         getEmployees);
router.post('/',        upload.single('photo'), createEmployee);
router.put('/:id',      upload.single('photo'), updateEmployee);
router.delete('/:id',   deleteEmployee);

module.exports = router;