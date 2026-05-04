import express from 'express';
import { getUserProfile, updateUserProfile } from '../../services/user/userService';

const router = express.Router();

// GET /get-profile
router.get('/get-profile', async (req, res) => {
  const phoneNumber = req.query.phoneNumber as string;

  try {
    const user = await getUserProfile(phoneNumber);
    console.log(phoneNumber)
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// PUT /update-profile
router.put('/update-profile', async (req, res) => {
  const {
    phoneNumber,
    firstName,
    lastName,
    email,
    panCard,
    companyName,
    address, // ⭐ Destructure the NESTED 'address' object directly ⭐,
  } = req.body;

  // Now, destructure the properties from the 'address' object
  // Provide default empty values to prevent issues if frontend sends null/undefined
  const {
    line1 = '',
    line2 = '', // Assuming optional, can be empty string or undefined based on Prisma schema
    zipCode = '',
    country = '',
    state = '',
  } = address || {}; // Use || {} to prevent errors if 'address' itself is undefined

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Missing phoneNumber' });
  }

   // Add validation for required address fields before calling userService
   if (!line1 || !zipCode || !country || !state) {
    return res.status(400).json({ success: false, message: 'Missing required address fields (line1, zipCode, country, state).' });
}

  try {
    const updatedUser = await updateUserProfile(phoneNumber, {
      firstName,
      lastName,
      email,
      panCard,
      companyName,
      address: {
        line1: line1,
        line2: line2,
        zipCode: zipCode,
        country: country,
        state: state,
      },
    });

    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

export default router;
