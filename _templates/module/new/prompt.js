// See https://www.hygen.io/docs/templates#prompt-file
module.exports = [
  {
    type: 'input',
    name: 'name',
    message: 'Module name (e.g., product, order, payment):',
    validate: (value) => {
      if (!value) return 'Module name is required';
      if (!/^[a-z][a-z0-9-]*$/.test(value)) {
        return 'Module name must be lowercase, start with letter, and contain only letters, numbers, and hyphens';
      }
      return true;
    },
  },
  {
    type: 'input',
    name: 'description',
    message: 'Module description:',
    default: '',
  },
];
