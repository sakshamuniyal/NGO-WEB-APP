import { Request, Response } from 'express';
import { submitContactForm } from '../services/contactService';
import axios from 'axios';

export async function handleContactSubmission(req: Request, res: Response) {
  try {
    const { name, email, phone, message, recaptchaToken } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Validate reCAPTCHA
    if (!recaptchaToken) {
      return res.status(400).json({
        success: false,
        message: 'reCAPTCHA verification is required',
      });
    }

    // Verify reCAPTCHA with Google
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (!recaptchaSecret) {
      console.error('RECAPTCHA_SECRET_KEY is not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    try {
      const recaptchaResponse = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: recaptchaSecret,
            response: recaptchaToken,
          },
        }
      );

      if (!recaptchaResponse.data.success) {
        return res.status(400).json({
          success: false,
          message: 'reCAPTCHA verification failed. Please try again.',
        });
      }
    } catch (recaptchaError) {
      console.error('reCAPTCHA verification error:', recaptchaError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify reCAPTCHA. Please try again.',
      });
    }

    // Submit contact form
    const contact = await submitContactForm({
      name,
      email,
      phone,
      message,
    });

    res.status(200).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      contactId: contact.id,
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again later.',
    });
  }
}
