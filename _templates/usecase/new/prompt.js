// Use Case generator prompt
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
    message: 'Use case name (e.g., activate-user, process-payment):',
    validate: (value) => (value ? true : 'Use case name is required'),
  },
  {
    type: 'list',
    name: 'type',
    message: 'Use case type:',
    choices: ['command', 'query'],
  },
];
