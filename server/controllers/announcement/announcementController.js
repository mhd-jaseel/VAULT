import Announcement from '../../models/Announcement.js';

// ==========================================
// PUBLIC CONTROLLER
// ==========================================

// Get active public announcement configuration
export const getPublicAnnouncement = async (req, res) => {
  try {
    let announcement = await Announcement.findOne();
    
    // If no document exists in DB yet, create a default active one
    if (!announcement) {
      announcement = await Announcement.create({
        content: 'FREE SUNGLASSES WORTH RS 949 ABOVE A PURCHASE OF RS 2000',
        isActive: true,
      });
    }

    // Return the announcement status and content
    return res.status(200).json({
      success: true,
      data: {
        _id: announcement._id,
        content: announcement.content,
        isActive: announcement.isActive,
        updatedAt: announcement.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching public announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve announcement details',
    });
  }
};

// ==========================================
// ADMIN CONTROLLERS
// ==========================================

// Get announcement details for admin panel
export const getAdminAnnouncement = async (req, res) => {
  try {
    let announcement = await Announcement.findOne();

    if (!announcement) {
      announcement = await Announcement.create({
        content: 'FREE SUNGLASSES WORTH RS 949 ABOVE A PURCHASE OF RS 2000',
        isActive: true,
      });
    }

    return res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error('Error fetching admin announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve announcement settings',
    });
  }
};

// Update announcement configuration (Content & Active Status)
export const updateAnnouncement = async (req, res) => {
  try {
    const { content, isActive } = req.body;

    // Strict validation
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Announcement content cannot be empty',
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Active status must be a boolean value',
      });
    }

    const trimmedContent = content.trim();

    // Find and update or create single announcement doc
    let announcement = await Announcement.findOne();

    if (!announcement) {
      announcement = await Announcement.create({
        content: trimmedContent,
        isActive,
      });
    } else {
      announcement.content = trimmedContent;
      announcement.isActive = isActive;
      await announcement.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement,
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating announcement configuration',
    });
  }
};
