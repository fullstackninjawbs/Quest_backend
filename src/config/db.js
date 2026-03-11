const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const connectDB = async () => {
    const useAWS = process.env.USE_AWS_DB === "true";

    try {
        if (useAWS) {
            // ─── Amazon DocumentDB ─────────────────────────────────────────────
            const uri = process.env.AWS_DOCUMENTDB_URI;
            const connectionOptions = {
                maxPoolSize: 100,
                replicaSet: "rs0",
                readPreference: "secondaryPreferred",
                retryWrites: false,
            };

            // Load TLS certificate if available
            const certPath = path.join(__dirname, "../../certs/global-bundle.pem");
            if (fs.existsSync(certPath)) {
                connectionOptions.tls = true;
                connectionOptions.tlsCAFile = certPath;
            }

            const conn = await mongoose.connect(uri, connectionOptions);
            console.log(`Amazon DocumentDB Connected: ${conn.connection.host}`);
        } else {
            // ─── MongoDB Atlas (default) ───────────────────────────────────────
            const conn = await mongoose.connect(process.env.MONGO_URI, { maxPoolSize: 100 });
            console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
        }
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
