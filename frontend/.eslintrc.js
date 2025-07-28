module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Disable unused variable warnings for development
    'no-unused-vars': 'warn',
    
    // Disable React hooks exhaustive deps warnings for complex cases
    'react-hooks/exhaustive-deps': 'warn',
    
    // Disable no-self-assign warnings
    'no-self-assign': 'warn',
    
    // Allow console.log for debugging
    'no-console': 'off'
  },
  overrides: [
    {
      files: ['**/*.js', '**/*.jsx'],
      rules: {
        // More lenient rules for specific patterns
        'no-unused-vars': ['warn', { 
          'argsIgnorePattern': '^_',
          'varsIgnorePattern': '^_',
          'ignoreRestSiblings': true 
        }]
      }
    }
  ]
};
