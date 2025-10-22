import Joi from 'joi';

// Esquema de validación para candidatos
export const candidateSchema = Joi.object({
  numeroOpositor: Joi.string()
    .pattern(/^[0-9]+$/)
    .min(1)
    .max(20)
    .required()
    .messages({
      'string.pattern.base': 'El número de opositor debe contener solo números',
      'string.min': 'El número de opositor debe tener al menos 1 carácter',
      'string.max': 'El número de opositor no puede tener más de 20 caracteres',
      'any.required': 'El número de opositor es obligatorio'
    }),
  
  nota: Joi.number()
    .min(0)
    .max(200)
    .precision(2)
    .required()
    .messages({
      'number.min': 'La nota debe ser mayor o igual a 0',
      'number.max': 'La nota debe ser menor o igual a 200',
      'any.required': 'La nota es obligatoria'
    })
});

// Función de validación para candidatos
export const validateCandidate = (data) => {
  return candidateSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });
};

// Middleware de validación genérico
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.body = value;
    next();
  };
};

// Middleware para validar parámetros de URL
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.params = value;
    next();
  };
};

// Schema para validar número de opositor en parámetros
export const numeroOpositorParamSchema = Joi.object({
  numeroOpositor: Joi.string()
    .trim()
    .min(1)
    .max(20)
    .required()
    .messages({
      'string.empty': 'El número de opositor no puede estar vacío',
      'string.min': 'El número de opositor debe tener al menos 1 carácter',
      'string.max': 'El número de opositor no puede tener más de 20 caracteres',
      'any.required': 'El número de opositor es obligatorio'
    })
});