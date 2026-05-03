const Activity = require('../models/Activity');

const logActivity = async ({ user, project, task, action, details, metadata }) => {
  try {
    await Activity.create({ user, project, task, action, details, metadata });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

module.exports = { logActivity };
