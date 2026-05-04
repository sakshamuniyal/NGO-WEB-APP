import express from 'express';
import { handleContactSubmission } from '../controllers/contactController';
import { z } from 'zod';

const router = express.Router();

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required'),
  recaptchaToken: z.string().min(1, 'reCAPTCHA token is required'),
});

// Validation middleware
const validateContactForm = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    req.body = contactFormSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    next(error);
  }
};

// POST /api/contact
router.post('/contact', validateContactForm, handleContactSubmission);

export default router;
