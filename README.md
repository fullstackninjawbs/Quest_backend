# ASC Quest Integration Backend API

Welcome to the **ASC Quest Backend** development guide. This repository contains the server-side logic for the ASC Quest platform. It is structured as a **modular monolith** in Node.js (ES modules) using Express, MongoDB (via Mongoose), and integrations with Stripe (for billing) and Quest Diagnostics (via SOAP Web Services).

---

## 📂 Directory Structure

```
Quest_backend/
├── scripts/                    # Database migrations, seeding, and verification scripts
├── src/
│   ├── app.js                  # Main Express application configuration & middleware routing
│   ├── server.js               # Entrypoint. Connects to database and spawns server
│   ├── config/                 # Global server configurations (database, environments, CORS)
│   │   ├── corsOptions.js      # CORS policy configuration
│   │   ├── db.js               # MongoDB connection client
│   │   └── env.js              # Environment variable loader & validator
│   ├── services/               # Core business services tier
│   │   ├── auth.service.js     # Unified auth engine (OTP management, password hashing)
│   │   ├── email.service.js    # Transporter abstraction (EmailJS & Nodemailer support)
│   │   └── quest.service.js    # SOAP Web Service client for Quest UAT integrations
│   ├── utils/                  # Global utilities and system error definitions
│   │   ├── AppError.js         # Operational error helper class
│   │   ├── catchAsync.js       # Asynchronous router handler wrapper
│   │   ├── emailTemplates.js   # HTML rich-text templates for email layouts
│   │   └── token.util.js       # Cryptographic generation/hashing of OTPs & JWTs
│   ├── shared/                 # Common elements shared between modules
│   │   ├── middleware/         # App-wide request hooks (errors, limiters, schema validators)
│   │   └── models/             # Shared Mongoose models (e.g., OTP database)
│   └── modules/                # Monolithic modules divided by domain
│       ├── superAdmin/         # Super Admin panel capabilities
│       │   ├── controllers/    # Request handlers (dashboard stats, employer control)
│       │   ├── middleware/     # Auth hooks (Super Admin authorization checks)
│       │   ├── models/         # Collections (SuperAdmin, CollectionSite, TestOption, TestPanel, AuditLog)
│       │   ├── routes/         # REST endpoint controllers
│       │   └── validators/     # Joi validators for admin operations
│       └── employer/           # Employer portal capabilities
│           ├── controllers/    # Profile updates, Stripe sessions, Employee roster logic
│           ├── middleware/     # Auth hooks (Employer authorization checks)
│           ├── models/         # Collections (Employer, Employee)
│           ├── routes/         # REST endpoint controllers
│           └── validators/     # Joi validation rules
├── uploads/                    # Temporary folder for file uploads (CSV import caches)
├── .env                        # Local configurations (ignored in git)
├── .env.example                # Sample environment file template
├── package.json                # Project dependencies and script declarations
└── README.md                   # Repository overview (this file)
```

---

## ⚙️ Dependencies & Core Libraries

- **Runtime**: Node.js (configured as ES Module, `"type": "module"`)
- **Web Framework**: `express`
- **Database Layer**: `mongoose` (MongoDB)
- **Security & Optimization**:
  - `helmet` (Secure HTTP headers)
  - `cors` (Cross-Origin Resource Sharing)
  - `express-rate-limit` (DDoS prevention)
  - `bcryptjs` (Password hashing)
  - `jsonwebtoken` (Stateless session management)
- **Integrations**:
  - `stripe` (Stripe payments checkout sessions)
  - `xml2js` (SOAP XML payload parsing)
  - `axios` (HTTP requests to Quest and Stripe)
  - `@emailjs/nodejs` & `nodemailer` (Dual-channel email delivery)
- **Utilities**:
  - `multer` (File upload multipart parser)
  - `csv-parser` (Streaming CSV parsing for employee import)
  - `joi` (Input validation)

---

## 🔒 Authentication & Security Flows

Authentication is split into specialized modules for **Super Admin** and **Employer**, but leverages a unified authentication engine under the hood:

### 1. Unified Registration & Verification Flow
- Users register via role-based schemas (e.g., Employer requires `company_name` and optional DOT details).
- Email addresses must be unique across the entire system.
- An **OTP (One Time Password)** is automatically generated, hashed in the database, and dispatched via email.
- The employer is initially marked as `status: 'pending'` and must verify their email with the 6-digit OTP before log-in is allowed.

### 2. Password Recovery Flow
Two distinct strategies are available for password resets:
- **OTP Method**: Generates a 6-digit recovery OTP, which must be verified alongside the email to update the password.
- **Token Link Method**: Generates a cryptographically secure, short-lived reset token sent as a URL (`/reset-password?token=...`). The token is hashed in MongoDB for comparison. Successful resets automatically toggle `isEmailVerified: true`.

### 3. Middleware Defense Layer
- **`apiLimiter`**: Express Rate Limit blocks abusive traffic under the `/api` prefix.
- **`validate(...)`**: Shared Joi middleware intercepts requests and reports errors before hitting controllers.
- **`superAdminAuth`** / **`employerAuth`**: Validates JWTs inside the HTTP Authorization header (`Bearer <token>`). Verifies the signature, checks that the user still exists in their respective collection, and confirms role matches.

---

## 🏛️ Database Models & Schemas

### 1. `SuperAdmin`
- **Fields**: `first_name`, `last_name`, `email` (unique), `phone`, `password` (hidden), `role` (immutable `"super_admin"`), `status` (`"active"`, `"suspended"`), `isEmailVerified` (boolean), `profile_pic`, `resetToken`, `resetTokenExpiry`.

### 2. `Employer`
- **Fields**: `first_name`, `last_name`, `email` (unique), `phone`, `password` (hidden), `role` (immutable `"employer"`), `status` (`"pending"`, `"active"`, `"suspended"`), `isEmailVerified` (boolean), `company_name`, `business_type` (`"DOT"`, `"NON-DOT"`), `dot_number` (required if business type is DOT), `address`, `employee_count`, `total_orders`, `last_modified_by` (Ref `SuperAdmin`), `last_modified_at`, `suspension_reason`.

### 3. `Employee`
- **Fields**: `employer_id` (Ref `Employer`), `employee_id` (Short generated/user ID), `first_name`, `last_name`, `email`, `phone`, `license_number`, `dob`, `zip_code`, `state`, `der_name`, `der_phone`, `type` (`"DOT"`, `"NON-DOT"`), `status` (`"Active"`, `"Inactive"`), `last_tested`, `test_name`, `test_result`.
- **Indexes**: Compound unique indexes ensure `email` and `employee_id` are unique *only within the context of a single employer*:
  - `{ employer_id: 1, email: 1 }` (Unique)
  - `{ employer_id: 1, employee_id: 1 }` (Unique)

### 4. `CollectionSite`
Synchronized directly from the Quest Diagnostics Web Service.
- **Fields**: `siteCode` (unique), `name`, `status`, `address` (line1, line2, city, state, zip, county), `phone`, `secondaryPhone`, `fax`, `email`, `website`, `hours`, `coordinates` (latitude & longitude), capabilities (breath alcohol, hair, oral fluid, DNA, observed, electronic CCF types, DOT physicals, etc.), time flags (hours after 5, weekend availability, 24/7), technical flags, `isActive`, `lastSyncedAt`.
- **Indexes**: Indexed by `address.zip` and `address.city` for rapid geographic lookup.

### 5. `TestOption` & `TestPanel`
- **`TestOption`**: Stores administrative dropdown configurations under categories like `"TEST_TYPE"`, `"REASON_FOR_TEST"`, and `"COLLECTION_TYPE"`.
- **`TestPanel`**: Configures purchasing cards (price, title, description, icon identifier) used in Stripe checkout generation.

### 6. `OTP` (Shared)
- **Fields**: `email`, `otp_code` (SHA-256 hashed OTP), `expires_at`, `used` (boolean), `type` (`"signup"`, `"reset"`).

### 7. `AuditLog`
- Tracks critical modifications made to Employers by Super Admins.
- **Fields**: `employer_id` (Ref `Employer`), `action` (`"edit"`, `"suspend"`, `"delete"`), `performed_by` (Ref `SuperAdmin`), `old_data` (Object snapshot), `new_data` (Object snapshot), `ip_address`, `timestamp`.

---

## 📡 Integrations

### 1. Quest Diagnostics (SOAP ESService)
The backend integrates with the **Quest Diagnostics UAT Web Service** (`ESService.asmx`) inside [quest.service.js](file:///D:/Clients/ASC/Quest_integration_Final/Quest_backend/src/services/quest.service.js).
- **SOAP Requests**: Formats XML envelopes for SOAP v1.1.
- **`FullRetrieveCollectionSiteDetails`**: Pulls the entire database of collection sites (~25,000+ entries). Due to payload sizes, the XML parser runs with unlimited buffer allocations and execution timeouts set to 5 minutes.
- **`UpdateRetrieveCollectionSiteDetails`**: Performs incremental updates by requesting changes since the last sync timestamp.
- **Sync Controller**: Batches database upserts inside a `bulkWrite` operations runner (using a batch size of 5000) to keep memory overhead clean.

### 2. Stripe Payments
Provides checkout session URLs for Employers purchasing test panels inside [billing.controller.js](file:///D:/Clients/ASC/Quest_integration_Final/Quest_backend/src/modules/employer/controllers/billing.controller.js).
- Fetches the active `TestPanel` price, parses currency strings, converts them to integer cents (to bypass floating-point issues), and starts a secure Stripe Checkout Session returning `session.url` to redirect the user.

### 3. Email Handlers (Nodemailer / EmailJS)
Enforces a fallback strategy:
- If `MAILER=true`, Nodemailer relays custom emails via local SMTP (e.g., Google SMTP).
- If `MAILER=false`, details are sent using EmailJS API triggers, sending templated layouts. If the API fails, it defaults to logging payloads to the console interface (ensuring seamless local development without complex setups).

---

## 🔌 API Route Map

### 👑 Super Admin Domain (`/api/v1/superadmin`)
| Route | Method | Access | Description |
| :--- | :---: | :--- | :--- |
| `/login` | `POST` | Public | Super Admin dashboard login |
| `/verify` | `POST` | Public | Verify OTP code |
| `/resend` | `POST` | Public | Resend OTP to email |
| `/otp` | `POST` | Public | Check active OTP status |
| `/forgot` | `POST` | Public | Trigger forgot password OTP |
| `/reset` | `POST` | Public | Reset password using OTP code |
| `/forgot-password-link` | `POST` | Public | Send recovery token link |
| `/reset-password-link` | `POST` | Public | Reset password using token link |
| `/logout` | `POST` | Admin | Terminate session |
| `/me` | `GET` | Admin | Get current admin profile details |
| `/change-password` | `POST` | Admin | Update password with old credential match |
| `/stats` | `GET` | Admin | Platform-wide aggregation statistics |
| `/employers` | `GET` | Admin | Fetch and filter all registered Employers |
| `/emp/:id/status` | `PATCH` | Admin | Toggle status (`"active"`, `"suspended"`, `"pending"`) |
| `/emp/:id/detail-profile`| `GET` | Admin | Fetch full details of a specific Employer |
| `/emp/:id/profile-edit` | `PUT` | Admin | Edit Employer details (logs Audit entry) |
| `/emp/:id/delete` | `DELETE` | Admin | Permanent hard delete (logs Audit entry) |
| `/config/options` | `GET`/`POST`| Admin | Retrieve or define Joi configuration options |
| `/config/options/:id` | `PUT`/`DELETE`| Admin | Update or remove configuration options |
| `/config/panels` | `GET`/`POST`| Admin | Retrieve or define Test Panels |
| `/config/panels/:id` | `PUT`/`DELETE`| Admin | Update or remove Test Panels |
| `/collection-sites` | `GET` | Admin | Search and paginate cached collection sites |
| `/collection-sites/status`| `GET` | Admin | Get last synced date and cache statistics |
| `/collection-sites/sync` | `POST` | Admin | Manually trigger Quest SOAP Synchronization |

### 🏢 Employer Domain (`/api/v1/employer`)
| Route | Method | Access | Description |
| :--- | :---: | :--- | :--- |
| `/signup` | `POST` | Public | Employer registration |
| `/login` | `POST` | Public | Employer login |
| `/verify` | `POST` | Public | Verify OTP code |
| `/resend` | `POST` | Public | Resend signup/reset OTP code |
| `/otp` | `POST` | Public | Check active OTP status |
| `/forgot` | `POST` | Public | Trigger forgot password OTP |
| `/reset` | `POST` | Public | Reset password using OTP code |
| `/forgot-password-link` | `POST` | Public | Send recovery token link |
| `/reset-password-link` | `POST` | Public | Reset password using token link |
| `/logout` | `POST` | Employer | Terminate session |
| `/me` | `GET` | Employer | Get current employer profile |
| `/change-password` | `POST` | Employer | Change password with old credential verification |
| `/profile` | `GET` | Employer | Get profile details |
| `/profile-edit` | `PATCH` | Employer | Update self profile |
| `/profile-delete` | `DELETE` | Employer | Permanent self-deletion of Employer account |
| `/config/options` | `GET` | Employer | Read test configurations |
| `/config/panels` | `GET` | Employer | Read test panels pricing cards |
| `/config/collection-sites`| `GET` | Employer | Search/query synced Quest collection sites |
| `/employee/add` | `POST` | Employer | Add a single employee to roster |
| `/employee/list` | `GET` | Employer | Paginate and search employee roster |
| `/employee/:id` | `GET` | Employer | Get details of a single employee |
| `/employee/:id` | `PUT` | Employer | Update single employee profile |
| `/employee/:id` | `DELETE` | Employer | Delete employee from records |
| `/employee/add-csv` | `POST` | Employer | Upload CSV file to bulk import employees |

### 💳 Billing Domain (`/api/v1/billing`)
| Route | Method | Access | Description |
| :--- | :---: | :--- | :--- |
| `/create-checkout-session` | `POST` | Employer | Initialize Stripe Checkout Session for test panel |

---

## 🛠️ Utility & Development Scripts

Scripts are located in `/scripts` and executed via `npm run <script-name>` or `node scripts/<filename>.js`:

1. **`seed-admin.js`**
   - Automatically seeds a default Super Admin account in the database.
   - Command: `npm run seed:admin`
2. **`verify-auth-foundation.js`**
   - Automatically boots up database connections and tests the entire signup, validation, login, password reset, and teardown loop via HTTP integration calls against the local host.
3. **`migrate-users.js`**
   - Imports legacy records from the consolidated `users` collection, maps names to structured fields, and populates the newer `SuperAdmin` and `Employer` collections appropriately.
4. **`cleanup-db.js`**
   - Empties testing records, stale OTPs, and temporary test models from MongoDB.
5. **`load-test-db.js` / `load-test-500.js`**
   - Simulates scale limits by injecting massive numbers of test entries.

---

## 🎯 Architecture critique: Scaling to the Next Level

Review `D:\Clients\ASC\Quest_integration_Final\backend_optimization_strategy.md` for a comprehensive plan detailing optimizations for production. Key recommendations include:
1. **Idempotent Stripe Operations**: Prevent double-charges by implementing `idempotencyKey` headers generated via request metadata hashes.
2. **SAGA / Transactional Order Creation**: Move order initialization to the beginning of purchase logic to prevent database records from dropping if third-party APIs fail. Implement automated Stripe refund calls in catch blocks.
3. **Promise Concurrency**: Eliminate sequential awaits on independent queries (e.g. loading employee, site, panel, and employer concurrently via `Promise.all`).
4. **Background Queue Engine**: Move Quest SOAP network executions (which can take several seconds) out of main HTTP request loops and process them asynchronously using queues like Redis/BullMQ.
5. **Integer Currency Handling**: Migrate the database schema to store financial values in integer cents (`priceInCents: 4900`) instead of float parsing strings.
