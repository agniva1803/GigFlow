import mongoose, { Schema } from 'mongoose';
import { IActivity, ActivityAction } from '../types';

const activitySchema = new Schema<IActivity>(
  {
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['created', 'status_changed', 'assigned', 'updated', 'deleted', 'note_added'] as ActivityAction[],
      required: true,
    },
    field: { type: String },
    fromValue: { type: String },
    toValue: { type: String },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Activities are queried by lead, newest first — composite index keeps this O(log n)
activitySchema.index({ lead: 1, createdAt: -1 });

const Activity = mongoose.model<IActivity>('Activity', activitySchema);

export default Activity;
