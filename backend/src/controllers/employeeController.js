const Employee = require('../models/Employee');
const { getIO } = require('../config/socket');

// Create employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, designation, phone, email, salary, joinDate, address, status } = req.body;

    const employee = await Employee.create({
      name,
      designation,
      phone:    phone    || '',
      email:    email    || '',
      salary:   salary   || 0,
      joinDate: joinDate || '',
      address:  address  || '',
      status:   status   || 'active',
      photo:    req.file ? req.file.filename : '',
    });

    getIO().emit('employeeCreated', employee);
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { name, designation, phone, email, salary, joinDate, address, status } = req.body;

    const update = { name, designation, phone, email, salary, joinDate, address, status };
    if (req.file) update.photo = req.file.filename;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    getIO().emit('employeeUpdated', employee);
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    getIO().emit('employeeDeleted', req.params.id);
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};