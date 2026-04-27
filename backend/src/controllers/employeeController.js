const Employee = require('../models/Employee');
const { getIO } = require('../config/socket');

exports.createEmployee = async (req, res) => {
  try {
    const employee = await Employee.create(req.body);

    getIO().emit('employeeCreated', employee);

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployees = async (req, res) => {
  const employees = await Employee.find();
  res.json(employees);
};