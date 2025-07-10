const Partner = require('../models/Partner');
const { sendPartnerEmail } = require('../utils/mailer');

// @desc    Get partner info
// @route   GET /api/partner/me
// @access  Private
exports.getPartner = async (req, res, next) => {
  try {
    const partner = await Partner.findOne({ user: req.user.id });

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'No partner information found'
      });
    }

    res.status(200).json({
      success: true,
      data: partner
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create or update partner info
// @route   POST /api/partner/setup
// @access  Private
exports.setupPartner = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    let partner = await Partner.findOne({ user: req.user.id });

    if (!partner) {
      // Create new partner info
      partner = await Partner.create(req.body);
      return res.status(201).json({
        success: true,
        data: partner
      });
    }

    // Update existing partner info
    partner = await Partner.findOneAndUpdate(
      { user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: partner
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send message to partner
// @route   POST /api/partner/send
// @access  Private
exports.sendPartnerMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    
    const partner = await Partner.findOne({ user: req.user.id });

    if (!partner) {
      return res.status(400).json({
        success: false,
        error: 'No partner information found'
      });
    }

    if (!partner.consent) {
      return res.status(400).json({
        success: false,
        error: 'Partner has not given consent for messages'
      });
    }

    // Send via preferred method
    if (partner.notificationPreferences.includes('email') && partner.email) {
      await sendPartnerEmail({
        email: partner.email,
        subject: 'Update from your partner',
        message
      });
    }

    // Could add SMS/WhatsApp integration here

    res.status(200).json({
      success: true,
      data: 'Message sent successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete partner info
// @route   DELETE /api/partner/me
// @access  Private
exports.deletePartner = async (req, res, next) => {
  try {
    const partner = await Partner.findOne({ user: req.user.id });

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'No partner information found'
      });
    }

  await Partner.findByIdAndDelete(partner._id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};