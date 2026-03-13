const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const SuperAdmin = require("../src/modules/superAdmin/models/superAdmin.model");

const checkPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = "dev.admin@ascquest.com";
        const admin = await SuperAdmin.findOne({ email }).select("+password");
        
        if (admin) {
            const isMatch = await bcrypt.compare("password123", admin.password);
            console.log("Password matches 'password123':", isMatch);
        } else {
            console.log("Admin not found");
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkPassword();
