const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      enum: ['Admin', 'Moderator', 'User', 'Staff'],
    },
    description: {
      type: String,
      default: '',
    },
    permissions: [
      {
        type: String,
        default: [],
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Query helper để exclude deleted roles
roleSchema.query.active = function () {
  return this.where({ isDeleted: false });
};

module.exports = mongoose.model('Role', roleSchema);
