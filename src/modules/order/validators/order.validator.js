import Joi from 'joi';

export const submitOrderSchema = Joi.object({
    employee: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required(),
        dob: Joi.date().iso().required(),
        gender: Joi.string().valid('M', 'F').required(),
        ssnLast4: Joi.string().min(4).max(15).optional()
    }).required(),
    
    test: Joi.object({
        testCode: Joi.string().required(),
        testName: Joi.string().required(),
        isDOT: Joi.boolean().default(false),
        unitCode: Joi.when('isDOT', {
            is: false,
            then: Joi.string().required(),
            otherwise: Joi.string().allow('', null).optional()
        }),
        accountNumber: Joi.string().required()
    }).required(),
    
    collectionSite: Joi.object({
        siteId: Joi.string().allow('', null).optional(),
        name: Joi.string().required(),
        address: Joi.string().required(),
        phone: Joi.string().allow('', null).optional(),
        snapshot: Joi.object().optional()
    }).required(),
    
    scheduling: Joi.object({
        mode: Joi.string().valid('walk_in', 'schedule_with_quest').default('walk_in'),
        scheduledDate: Joi.date().iso().optional()
    }).default()
});
