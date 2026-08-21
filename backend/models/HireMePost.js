const mongoose = require('mongoose');

const hireMePostSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Post title / role is required'],
      trim: true,
      maxlength: 120,
    },
    roleCategory: {
      type: String,
      enum: ['software_dev', 'design_creative', 'marketing_sales', 'translation_writing', 'finance_business', 'craft_daily_work', 'education_tutoring', 'other'],
      default: 'software_dev',
    },
    skills: [{ type: String, trim: true }],
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 2500,
    },
    rate: {
      amount:   { type: Number, default: 0 },
      currency: { type: String, default: 'TND' },
      period:   { type: String, enum: ['hour', 'day', 'project', 'month'], default: 'project' },
      isNegotiable: { type: Boolean, default: true },
    },
    availability: {
      type: String,
      enum: ['immediate', 'part_time', 'full_time', 'weekends', 'contract'],
      default: 'immediate',
    },
    location: {
      city:    { type: String, default: 'Tunis' },
      country: { type: String, default: 'Tunisia' },
      isRemote:{ type: Boolean, default: true },
    },
    portfolioLinks: [{ type: String }],
    contactInfo: {
      phone:   { type: String },
      email:   { type: String },
      whatsapp:{ type: String },
    },
    // Interaction tracking (Inquiries / Hire Offers / Contact requests)
    inquiries: [
      {
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        senderName:    { type: String, required: true },
        senderEmail:   { type: String, required: true },
        senderPhone:   { type: String },
        senderCompany: { type: String },
        message:       { type: String, required: true },
        offeredBudget: { type: String },
        createdAt:     { type: Date, default: Date.now },
      },
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

hireMePostSchema.index({ title: 'text', description: 'text', skills: 'text' });
hireMePostSchema.index({ authorId: 1, createdAt: -1 });
hireMePostSchema.index({ roleCategory: 1, 'location.city': 1, isActive: 1 });

module.exports = mongoose.model('HireMePost', hireMePostSchema);
