// const EmergencyContact = require('../models/EmergencyContact');
// const User = require('../models/User');
// const { sendSMS, sendEmail } = require('../services/notificationService');
// const { getLocationDetails } = require('../services/locationService');
// const { logger } = require('../utils/logger');
// const { validatePhone, validateEmail } = require('../utils/validators');
// const { RateLimiter } = require('../utils/rateLimiter');

// // Initialize rate limiter (5 SOS triggers per hour per user)
// const sosRateLimiter = new RateLimiter({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 5,
//   message: 'Too many SOS requests. Please wait before trying again.'
// });

// // @desc    Get emergency configuration
// // @route   GET /api/emergency/config
// // @access  Private
// exports.getEmergencyConfig = async (req, res) => {
//   try {
//     const [contacts, user] = await Promise.all([
//       EmergencyContact.find({ user: req.user.id }),
//       User.findById(req.user.id).select('emergencySettings')
//     ]);

//     const defaultConfig = {
//       systemActive: true,
//       requireConfirmation: true,
//       alertCooldown: 300 // 5 minutes
//     };

//     res.json({
//       success: true,
//       data: {
//         contacts,
//         settings: user.emergencySettings || defaultConfig
//       }
//     });
//   } catch (error) {
//     logger.error('Failed to get emergency config', { error, userId: req.user.id });
//     res.status(500).json({
//       success: false,
//       error: 'Failed to load emergency configuration'
//     });
//   }
// };

// // @desc    Add/Update emergency contact
// // @route   POST /api/emergency/contacts
// // @route   PUT /api/emergency/contacts/:id
// // @access  Private
// exports.manageContact = async (req, res) => {
//   try {
//     const { name, contactMethod, contactInfo, isActive } = req.body;
//     const { id } = req.params;

//     // Validation
//     if (!name || !contactMethod || !contactInfo) {
//       return res.status(400).json({
//         success: false,
//         error: 'Name, contact method and contact info are required'
//       });
//     }

//     if (contactMethod === 'phone' && !validatePhone(contactInfo)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid phone number format'
//       });
//     }

//     if (contactMethod === 'email' && !validateEmail(contactInfo)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid email format'
//       });
//     }

//     // Prepare contact data
//     const contactData = {
//       user: req.user.id,
//       name,
//       contactMethod,
//       contactInfo,
//       isActive: isActive !== false
//     };

//     let contact;
//     if (id) {
//       // Update existing contact
//       contact = await EmergencyContact.findOneAndUpdate(
//         { _id: id, user: req.user.id },
//         contactData,
//         { new: true, runValidators: true }
//       );
//       if (!contact) {
//         return res.status(404).json({
//           success: false,
//           error: 'Contact not found'
//         });
//       }
//     } else {
//       // Create new contact
//       contact = await EmergencyContact.create(contactData);
//     }

//     res.status(id ? 200 : 201).json({
//       success: true,
//       data: contact
//     });
//   } catch (error) {
//     logger.error('Failed to manage emergency contact', { error, userId: req.user.id });
//     res.status(500).json({
//       success: false,
//       error: 'Failed to save contact'
//     });
//   }
// };

// // @desc    Delete emergency contact
// // @route   DELETE /api/emergency/contacts/:id
// // @access  Private
// exports.deleteContact = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const contact = await EmergencyContact.findOneAndDelete({
//       _id: id,
//       user: req.user.id
//     });

//     if (!contact) {
//       return res.status(404).json({
//         success: false,
//         error: 'Contact not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: {}
//     });
//   } catch (error) {
//     logger.error('Failed to delete emergency contact', { error, userId: req.user.id });
//     res.status(500).json({
//       success: false,
//       error: 'Failed to delete contact'
//     });
//   }
// };

// // @desc    Trigger emergency SOS
// // @route   POST /api/emergency/sos
// // @access  Private
// exports.triggerSOS = async (req, res) => {
//   try {
//     // Apply rate limiting
//     const rateLimitKey = `sos:${req.user.id}`;
//     const rateLimited = await sosRateLimiter.check(rateLimitKey);
//     if (rateLimited) {
//       return res.status(429).json({
//         success: false,
//         error: rateLimited.message
//       });
//     }

//     const { location, isTest = false } = req.body;

//     // Validate location
//     if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
//       return res.status(400).json({
//         success: false,
//         error: 'Valid location coordinates are required'
//       });
//     }

//     // Get user settings and active contacts
//     const [user, activeContacts] = await Promise.all([
//       User.findById(req.user.id).select('emergencySettings name'),
//       EmergencyContact.find({ user: req.user.id, isActive: true })
//     ]);

//     // Check system status
//     if (user.emergencySettings?.systemActive === false) {
//       return res.status(400).json({
//         success: false,
//         error: 'Emergency system is currently disabled'
//       });
//     }

//     // Check for active contacts
//     if (activeContacts.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'No active emergency contacts configured'
//       });
//     }

//     // Get location details (reverse geocoding)
//     const locationDetails = await getLocationDetails(location.latitude, location.longitude);
    
//     // Prepare alert message
//     const alertMessage = {
//       userName: user.name,
//       location: {
//         coordinates: location,
//         details: locationDetails
//       },
//       timestamp: new Date(),
//       isTest
//     };

//     // Send alerts to all active contacts
//     const notificationPromises = activeContacts.map(contact => {
//       const message = `EMERGENCY ALERT: ${user.name} needs help!\n` +
//         `Location: ${locationDetails.address || 'Unknown location'}\n` +
//         `Coordinates: ${location.latitude}, ${location.longitude}\n` +
//         `Time: ${alertMessage.timestamp.toLocaleString()}` +
//         (isTest ? '\n\nTHIS IS A TEST ALERT' : '');

//       if (contact.contactMethod === 'phone') {
//         return sendSMS(contact.contactInfo, message);
//       } else {
//         return sendEmail(contact.contactInfo, 'Emergency Alert', message);
//       }
//     });

//     // Execute all notifications in parallel
//     const results = await Promise.allSettled(notificationPromises);
//     const successfulAlerts = results.filter(r => r.status === 'fulfilled').length;

//     // Log the emergency event
//     logger.info('Emergency SOS triggered', {
//       userId: req.user.id,
//       location,
//       contactsAttempted: activeContacts.length,
//       contactsNotified: successfulAlerts,
//       isTest
//     });

//     res.json({
//       success: true,
//       data: {
//         contactsNotified: successfulAlerts,
//         totalContacts: activeContacts.length,
//         locationDetails,
//         isTest
//       }
//     });
//   } catch (error) {
//     logger.error('Failed to trigger emergency SOS', { error, userId: req.user.id });
//     res.status(500).json({
//       success: false,
//       error: 'Failed to send emergency alerts'
//     });
//   }
// };

// // @desc    Update emergency settings
// // @route   PUT /api/emergency/settings
// // @access  Private
// exports.updateSettings = async (req, res) => {
//   try {
//     const { systemActive, requireConfirmation, alertCooldown } = req.body;

//     const updates = {};
//     if (typeof systemActive === 'boolean') updates['emergencySettings.systemActive'] = systemActive;
//     if (typeof requireConfirmation === 'boolean') updates['emergencySettings.requireConfirmation'] = requireConfirmation;
//     if (typeof alertCooldown === 'number') updates['emergencySettings.alertCooldown'] = alertCooldown;

//     const user = await User.findByIdAndUpdate(
//       req.user.id,
//       { $set: updates },
//       { new: true, select: 'emergencySettings' }
//     );

//     res.json({
//       success: true,
//       data: user.emergencySettings
//     });
//   } catch (error) {
//     logger.error('Failed to update emergency settings', { error, userId: req.user.id });
//     res.status(500).json({
//       success: false,
//       error: 'Failed to update settings'
//     });
//   }
// };

const EmergencyContact = require('../models/EmergencyContact');
const { sendEmergencyAlert } = require('../utils/notification');
const { uploadToIPFS } = require('../utils/ipfs');
const TrackerLog = require('../models/TrackerLog');

// @desc    Get emergency config including contacts
// @route   GET /api/emergency/config
// @access  Private
exports.getEmergencyConfig = async (req, res, next) => {
  try {
    const contacts = await EmergencyContact.find({ user: req.user.id });
    
    res.status(200).json({
      success: true,
      data: {
        contacts,
        isActive: true // Default to true
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add emergency contact
// @route   POST /api/emergency/config
// @access  Private
exports.addEmergencyContact = async (req, res, next) => {
  try {
    const { name, contactMethod, contactInfo, isActive } = req.body;
    
    if (!name || !contactMethod || !contactInfo) {
      return res.status(400).json({
        success: false,
        error: 'Name, contact method and contact info are required'
      });
    }

    if (contactMethod === 'phone' && !/^\+?[0-9\s\-]+$/.test(contactInfo)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    if (contactMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const contact = await EmergencyContact.create({
      user: req.user.id,
      name,
      contactMethod,
      contactInfo,
      isActive: isActive !== false
    });

    res.status(201).json({
      success: true,
      data: contact
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update emergency contact
// @route   PUT /api/emergency/config/:id
// @access  Private
exports.updateEmergencyContact = async (req, res, next) => {
  try {
    let contact = await EmergencyContact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    if (contact.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this contact'
      });
    }

    const { name, contactMethod, contactInfo, isActive } = req.body;

    if (name) contact.name = name;
    if (contactMethod) contact.contactMethod = contactMethod;
    if (contactInfo) contact.contactInfo = contactInfo;
    if (typeof isActive !== 'undefined') contact.isActive = isActive;

    await contact.save();

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete emergency contact
// @route   DELETE /api/emergency/config/:id
// @access  Private
exports.deleteEmergencyContact = async (req, res, next) => {
  try {
    const contact = await EmergencyContact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    if (contact.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this contact'
      });
    }

    await contact.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Trigger emergency alert
// @route   POST /api/emergency/sos
// @access  Private
exports.triggerEmergency = async (req, res, next) => {
  console.log('🟢 [STEP 1] Incoming request body:', req.body);

  try {
    const { location, isTest = false } = req.body;

    if (!location || !location.lat || !location.lng) {
      console.warn('⚠️ [STEP 2] Invalid location data');
      return res.status(400).json({
        success: false,
        error: 'Location data is required'
      });
    }

    console.log('🟢 [STEP 3] Location received:', location);

    if (!req.user || !req.user.id) {
      console.error('❌ [STEP 4] Authenticated user info missing');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized or user info missing'
      });
    }

    console.log('🟢 [STEP 5] Authenticated user ID:', req.user.id);

    const contacts = await EmergencyContact.find({
      user: req.user.id,
      isActive: true
    });

    console.log(`🟢 [STEP 6] Active emergency contacts found: ${contacts.length}`);

    if (contacts.length === 0) {
      console.warn('⚠️ [STEP 7] No active emergency contacts');
      return res.status(400).json({
        success: false,
        error: 'No active emergency contacts configured'
      });
    }

    const logs = await TrackerLog.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log(`🟢 [STEP 8] Last 5 tracker logs fetched. Count: ${logs.length}`);

    let ipfsHash = null;
    let notificationsSent = 0;

    console.log('🟢 [STEP 9] Starting to notify contacts...');

    const alertPromises = contacts.map(contact =>
      sendEmergencyAlert({ contact, location })
    );

    console.log('🟢 [STEP 10] Uploading to IPFS...');
    try {
      ipfsHash = await uploadToIPFS({
        userId: req.user.id,
        logs,
        triggerTime: new Date(),
        isTest
      });
      console.log('🟢 [STEP 11] IPFS upload successful. Hash:', ipfsHash);
    } catch (ipfsErr) {
      console.error('❌ [STEP 11] IPFS upload failed:', ipfsErr.message);
    }

    console.log('🟢 [STEP 12] Waiting for all alert promises to finish...');
    const results = await Promise.all(alertPromises);
    notificationsSent = results.filter(Boolean).length;

    console.log(`🟢 [STEP 13] Notifications sent successfully: ${notificationsSent}`);

    return res.status(200).json({
      success: true,
      data: {
        contactsNotified: notificationsSent,
        isTest,
        ipfsHash
      }
    });
  } catch (err) {
    console.error('❌ [FINAL STEP] Unexpected error:', err);
    next(err);
  }
};

// @desc    Update emergency settings
// @route   PUT /api/emergency/settings
// @access  Private
exports.updateEmergencySettings = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    res.status(200).json({
      success: true,
      data: {
        isActive: isActive !== false
      }
    });
  } catch (err) {
    next(err);
  }
};