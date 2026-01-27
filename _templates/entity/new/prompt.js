// Entity generator prompt
module.exports = [
  {
    type: 'input',
    name: 'module',
    message: 'Module name (e.g., user, product):',
    validate: (value) => (value ? true : 'Module name is required'),
  },
  {
    type: 'input',
    name: 'name',
    message: 'Entity name (e.g., address, payment-method):',
    validate: (value) => (value ? true : 'Entity name is required'),
  },
];
