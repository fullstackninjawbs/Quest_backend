const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const SuperAdmin = require("../src/modules/superAdmin/models/superAdmin.model");

const resetPass = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = "dev.admin@ascquest.com";
        const admin = await SuperAdmin.findOne({ email });
        
        if (admin) {
            admin.password = "password123";
            await admin.save();
            console.log("Password reset to 'password123' successfully.");
        } else {
            console.log("Admin not found");
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

resetPass();
