# EventHub Complete Practical Testing Framework

This repository directory contains the comprehensive testing suite for **EventHub**, a full-stack event booking application built with Node.js, Express.js, MongoDB, and Angular.

The testing setup covers three essential quality assurance disciplines:
1. **Automated Unit & Integration Testing**: [Jest](https://jestjs.io/) + [Supertest](https://github.com/ladjs/supertest)
2. **Interactive API & Workflow Testing**: [Postman](https://www.postman.com/) Collection & Environment
3. **Performance & Concurrency Load Testing**: [Grafana k6](https://k6.io/)

---

## 1. Directory Structure

```
eventhub/
├── backend/
│   ├── app.js                          # Pure Express application export for Supertest
│   ├── server.js                       # Server entry point with DB & background workers
│   ├── jest.config.js                  # Jest configuration for Node.js CommonJS
│   ├── package.json                    # Scripts: test, test:watch, test:coverage
│   └── tests/                          # Automated backend test suites
│       ├── setup.js                    # Test environment setup, mock gateways & DB hooks
│       ├── auth.test.js                # Authentication & JWT test cases (10 tests)
│       ├── event.test.js               # Event CRUD, filters & status tests (11 tests)
│       ├── booking.test.js             # Booking capacity & cancellation tests (7 tests)
│       ├── payment.test.js             # Razorpay HMAC verification tests (5 tests)
│       ├── feedback.test.js            # Feedback submission & admin moderation (7 tests)
│       └── profile.test.js             # Profile management & password change (5 tests)
└── testing/
    ├── README.md                       # Master testing framework guide (this file)
    ├── postman/
    │   ├── EventHub.postman_collection.json   # 28 fully configured API requests with assertions
    │   └── EventHub.postman_environment.json  # Configurable environment with dynamic chaining
    └── performance/
        ├── README.md                   # k6 setup and installation guide
        ├── eventhub-load.js            # Staged end-to-end API load test script (1-10 VUs)
        └── events-load.js              # High-throughput event catalogue & search stress test
```

---

## 2. Tools & Dependencies

| Tool | Role | Configuration / Files |
| :--- | :--- | :--- |
| **Jest (v30.5.2)** | Test runner, assertion library, execution reporter, and code coverage generator | `backend/jest.config.js` |
| **Supertest (v7.3.1)** | HTTP integration testing for Express routes without binding network sockets | Injected into all `backend/tests/*.test.js` |
| **Isolated Test Database** | Dedicated `eventhub_automated_tests` MongoDB instance with automated collection teardown | `backend/tests/setup.js` |
| **Postman (v2.1 Collection)** | Interactive API validation, automated test assertion scripts, variable extraction | `testing/postman/` |
| **Grafana k6** | High-performance metric-driven load testing, latency benchmarking, and SLA gates | `testing/performance/` |

---

## 3. Automated Backend Testing (Jest + Supertest)

### Prerequisites
Make sure dependencies are installed in the backend folder:
```powershell
cd backend
npm install
```

### Execution Commands

```powershell
# Run the complete test suite
npm test

# Run tests in interactive watch mode
npm run test:watch

# Generate full code coverage report
npm run test:coverage

# Run a specific test suite
npx jest tests/auth.test.js
npx jest tests/event.test.js
npx jest tests/booking.test.js
npx jest tests/payment.test.js
npx jest tests/feedback.test.js
npx jest tests/profile.test.js
```

### Coverage Scope
The automated test suite achieves **100% pass rate across 45 comprehensive test cases**:
- **Authentication (10 tests)**: Registration, email duplication check, valid login, invalid password check, missing input validation, unauthenticated route rejection, JWT signature check.
- **Events (11 tests)**: Admin event creation, organizer pending creation, public catalogue listing, details by ID, 404 missing ID, invalid ObjectID rejection, admin update, unauthorized update block, past event auto-complete, admin delete.
- **Bookings (7 tests)**: Ticket reservation, capacity overflow guard, participant duplication guard, owner access check, unauthorized cancellation block, owner cancellation with ticket rollback, double-cancellation block.
- **Payments (5 tests)**: Payment gateway config, Razorpay order generation with mocked SDK, non-existent event 404, invalid cryptographic HMAC SHA256 rejection, valid signature verification and booking confirmation.
- **Feedback & Queries (7 tests)**: Valid submission, missing message rejection, my feedback retrieval, non-admin listing guard, admin moderation, feedback editing, feedback deletion.
- **Profile (5 tests)**: Fetch authenticated profile, unauthenticated 401 block, update name and contact, incorrect current password rejection, valid password change.

---

## 4. Postman API Testing

### Files
- **Collection**: `testing/postman/EventHub.postman_collection.json`
- **Environment**: `testing/postman/EventHub.postman_environment.json`

### Import Instructions
1. Open the **Postman** desktop app or web client.
2. Click the **Import** button in the top-left corner.
3. Drag and drop both JSON files from `testing/postman/`.
4. In the top-right environment dropdown, select **EventHub Local Environment**.
5. Ensure your backend server is running at `http://localhost:5000` (`npm run dev` in `backend/`).

### Running the Collection
1. Click the **EventHub API Testing Collection**.
2. Click **Run Collection**.
3. Keep the default execution order (Authentication &rarr; Events &rarr; Booking &rarr; Payment &rarr; Feedback &rarr; Profile).
4. Tokens (`authToken`, `adminToken`) and identifiers (`eventId`, `bookingId`, `feedbackId`) are dynamically captured by test scripts and passed into subsequent requests.
5. Click **Run EventHub API Testing Collection**.

### Running via Newman CLI (Optional)
If Newman is installed:
```powershell
npx newman run testing/postman/EventHub.postman_collection.json -e testing/postman/EventHub.postman_environment.json
```

---

## 5. Performance & Load Testing (Grafana k6)

### Prerequisites
Install Grafana k6 on your system (see `testing/performance/README.md` for platform details). On Windows:
```powershell
winget install k6 --source winget
# or
choco install k6
```

### Running the Load Tests
Make sure the EventHub backend is active on `http://localhost:5000`.

```powershell
cd testing/performance

# 1. Quick 1-Virtual-User Smoke Test
k6 run --vus 1 --duration 15s eventhub-load.js

# 2. Complete Staged Load Test (1 VU -> 5 VUs -> 10 VUs -> Cooldown)
k6 run eventhub-load.js

# 3. Public Catalogue Stress Test
k6 run events-load.js
```

### SLA / Performance Thresholds Enforced
- **Failure Rate**: `< 1.0%` HTTP error rate
- **95th Percentile Latency (p95)**: `< 500ms`
- **Average Latency**: `< 300ms`
- **Health Check p95**: `< 200ms`

---

## 6. Testing Safety & Quality Assurance Rules

1. **Zero Production Contamination**: Automated tests use an isolated database (`eventhub_automated_tests`) with clean teardowns. Real users, live events, and orders are never touched.
2. **Mocked Financial Operations**: Live payment gateways and payment verification webhooks are strictly mocked. No real financial charges or live Razorpay API calls occur during test execution.
3. **No Hardcoded Secrets**: Collection files and configuration templates do not store live secrets, bank details, or passwords.
4. **Controlled Concurrency**: Load tests never default to uncontrolled concurrency (capped at 10 VUs) to avoid database thread starvation or memory leaks.
