import mongoose from 'mongoose';
import Employer from '../src/modules/employer/models/employer.model.js';
import bcrypt from 'bcryptjs';
import { MONGO_URI } from '../src/config/env.js';

async function debugEmployer() {
    try {
        await mongoose.connect(MONGO_URI);
        const email = 'john@taxi-fleet.com';
        const user = await Employer.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('---RESULT---');
            console.log(`User ${email} NOT FOUND in Employer collection.`);
            console.log('---END---');
            return;
        }

        const isMatch = await bcrypt.compare('password123', user.password);
        console.log('---RESULT---');
        console.log(`User: ${user.email}`);
        console.log(`ID: ${user._id}`);
        console.log(`Role: ${user.role}`);
        console.log(`Password Match ('password123'): ${isMatch}`);
        console.log(`Hashed Password in DB: ${user.password}`);
        console.log('---END---');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debugEmployer();
