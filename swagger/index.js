const swaggerJsdoc = require('swagger-jsdoc');

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Candidate Exam API',
      version: '1.0.0',
      description: 'API for managing candidate exams',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server',
      },
    ],
  },
  // Add all route files here
  apis: ['./controller/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

module.exports = swaggerDocs;
