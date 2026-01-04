import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Forum } from '../models/Forum.js';

const seedForums = [
  { 
    name: 'Mathematics', 
    description: 'Discuss calculus, algebra, and more', 
    icon: '🔢', 
    color: 'blue' 
  },
  { 
    name: 'Physics', 
    description: 'Mechanics, thermodynamics, quantum physics', 
    icon: '⚛️', 
    color: 'purple' 
  },
  { 
    name: 'Chemistry', 
    description: 'Organic, inorganic, and physical chemistry', 
    icon: '🧪', 
    color: 'green' 
  },
  { 
    name: 'Computer Science', 
    description: 'Programming, algorithms, data structures', 
    icon: '💻', 
    color: 'indigo' 
  },
  { 
    name: 'Biology', 
    description: 'Cell biology, genetics, ecology', 
    icon: '🧬', 
    color: 'emerald' 
  },
  { 
    name: 'English Literature', 
    description: 'Poetry, novels, literary analysis', 
    icon: '📚', 
    color: 'orange' 
  },
];

async function seedDB() {
  try {
    await mongoose.connect("mongodb+srv://Khelan05:KrxRwjRwkhgYUdwh@cluster0.c6y9phd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    console.log('Connected to MongoDB');

    // Clear existing forums
    await Forum.deleteMany({});
    console.log('Cleared existing forums');

    // Insert seed data
    const forums = await Forum.insertMany(seedForums);
    console.log(`Inserted ${forums.length} forums`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDB();