const mongoose = require('mongoose');
const Employer = require('./src/modules/employer/models/employer.model');
const bcrypt = require('bcryptjs');
const { MONGODB_URI } = require('./src/config/env');

async function debugEmployer() {
    try {
        await mongoose.connect(MONGODB_URI);
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
