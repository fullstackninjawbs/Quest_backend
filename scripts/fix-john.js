const mongoose = require('mongoose');
const Employer = require('../src/modules/employer/models/employer.model');
const { MONGO_URI } = require('../src/config/env');

async function resetJohnPassword() {
    try {
        await mongoose.connect(MONGO_URI);
        const email = 'john@taxi-fleet.com';
        const user = await Employer.findOne({ email });

        if (!user) {
            console.log(`User ${email} not found.`);
            return;
        }

        user.password = 'password123';
        user.confirmPassword = 'password123'; // Required by schema triggers usually
        await user.save();

        console.log('---SUCCESS---');
        console.log(`Password for ${email} has been reset to: password123`);
        console.log('---END---');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

resetJohnPassword();
