const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Task must belong to a project']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  dueDate: Date,
  completedAt: Date,
  tags: [{ type: String, trim: true, maxlength: 30 }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, trim: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ dueDate: 1 });

// Virtual: isOverdue
taskSchema.virtual('isOverdue').get(function () {
  return this.status !== 'done' && this.dueDate && new Date() > this.dueDate;
});

// Update project task counts on save
taskSchema.post('save', async function () {
  const Project = require('./Project');
  const totalCount = await this.constructor.countDocuments({ project: this.project });
  const doneCount = await this.constructor.countDocuments({ project: this.project, status: 'done' });
  await Project.findByIdAndUpdate(this.project, {
    taskCount: totalCount,
    completedTaskCount: doneCount
  });
});

// Update project task counts on delete
taskSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Project = require('./Project');
    const totalCount = await mongoose.model('Task').countDocuments({ project: doc.project });
    const doneCount = await mongoose.model('Task').countDocuments({ project: doc.project, status: 'done' });
    await Project.findByIdAndUpdate(doc.project, {
      taskCount: totalCount,
      completedTaskCount: doneCount
    });
  }
});

// Set completedAt when status changes to done
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'done') {
      this.completedAt = undefined;
    }
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
