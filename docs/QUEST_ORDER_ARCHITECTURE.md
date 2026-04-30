# Quest Diagnostics Integration: Create Order Technical Architecture

This document provides a developer-focused, step-by-step breakdown of the "Create Order" flow. It replaces complex diagrams with a clear execution sequence and data mapping strategy.

---

## 1. Execution Workflow (Step-by-Step)

The "Create Order" process follows a strict 5-step sequence to ensure no data is lost during the external SOAP call.

### Step 1: Frontend Submission
*   **Action**: User clicks "Submit" in the 5-step wizard.
*   **Payload**: A single JSON object containing Employee, Test, and Collection Site data.
*   **API**: `POST /api/v1/orders/submit`

### Step 2: Internal Validation (Joi)
*   **Action**: The backend validates the payload before any DB or API calls.
*   **Checks**: 
    *   DOB must be `YYYY-MM-DD`.
    *   DOT vs Non-DOT consistency (Unit Code requirement).
    *   Phone number formatting.
    *   Required fields (SSN last 4, Gender, Account Number).

### Step 3: Local Persistence (State: `pending`)
*   **Action**: Save the order to MongoDB with `status: "pending"`.
*   **Rationale**: If the Quest API times out or the server crashes mid-call, we have a record of the request data for manual recovery or retry.

### Step 4: External Quest Integration (SOAP)
*   **Action**: The `QuestSoapService` takes the JSON, builds a SOAP Envelope, and sends it to Quest ESP.
*   **Process**:
    1.  **Build XML**: Inject JSON data into the `CreateOrder` XML template.
    2.  **Transport**: Send POST request to Quest with SOAP headers.
    3.  **Parse**: Convert the XML response back into a Javascript object.

### Step 5: Final Update (State: `created` or `failed`)
*   **Action**: Update the MongoDB record based on the Quest response.
*   **On Success**: Save `questOrderId`, `referenceTestId`, and update status to `created`.
*   **On Failure**: Save the error details in the `auditTrail` and update status to `failed`.

---

## 2. Component Responsibilities

| Component | Responsibility |
| :--- | :--- |
| **Order Controller** | Validates the request, manages the DB lifecycle, and returns the final JSON to the UI. |
| **Order Model** | Defines the schema for the order, including snapshots of the collection site and test details. |
| **Quest SOAP Service** | Handles XML building, SOAP transport (Axios), and XML parsing. |
| **Audit Log** | Automatically records every state change (Pending -> Created) for compliance. |

---

## 3. Data Mapping (JSON to XML)

Developers should map the following frontend fields to these specific Quest XML tags:

| Frontend JSON Field | Quest XML Tag | Format Note |
| :--- | :--- | :--- |
| `employee.dob` | `<DOB>` | Must be `YYYYMMDD` |
| `employee.gender` | `<Gender>` | `M` or `F` |
| `test.testCode` | `<TestCode>` | String (e.g., "35190N") |
| `test.accountNumber` | `<AccountNumber>` | From Lab Account setup |
| `collectionSite.siteId` | `<LocationID>` | Unique site identifier |

---

## 4. Error Handling Strategy

| Scenario | Result | Action |
| :--- | :--- | :--- |
| **Invalid Payload** | `422 Unprocessable Entity` | UI shows validation message; no DB record created. |
| **Quest Auth Failure** | `500 Internal Server Error` | Order status remains `pending`; Alert developer. |
| **Quest Logic Error** | `400 Bad Request` | Order status -> `failed`. UI shows Quest's error message. |
| **Timeout** | `504 Gateway Timeout` | Order status -> `pending`. Admin dashboard flagged for manual check. |

---

## 5. Security Requirements
1.  **Credentials**: Never hardcode Quest `Username` or `Password`. Use `process.env`.
2.  **SOAP Headers**: All requests must include the WS-Security header with the hashed password.
3.  **PII**: Employee SSN and DOB must be treated as sensitive data.
