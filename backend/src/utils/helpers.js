// src/utils/helpers.js

// Format date (optional use)
exports.formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

// Generate random slot ID (if needed later)
exports.generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};