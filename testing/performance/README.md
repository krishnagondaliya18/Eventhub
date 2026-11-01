# EventHub Performance & Load Testing with Grafana k6

This directory contains load and stress testing scripts designed specifically for the EventHub REST APIs using [Grafana k6](https://k6.io/).

---

## 1. Test Scripts Overview

| Script | Purpose | Traffic Profile | Key Targets |
| :--- | :--- | :--- | :--- |
| **`eventhub-load.js`** | End-to-end full stack API load testing across all core modules | Staged: 1 VU (smoke) &rarr; 5 VUs &rarr; 10 VUs (moderate load) &rarr; cooldown | Health check, Event Listing, Autocomplete, Event Details, Auth Login, Booking History, Payment Config |
| **`events-load.js`** | High-throughput stress test focused on public event browsing and search | Staged: 2 VUs &rarr; 5 VUs &rarr; 10 VUs | Paginated catalogue fetch, category filtering, live autocomplete suggestions |

---

## 2. Installing Grafana k6

### Windows
Choose either of the following methods in PowerShell:

```powershell
# Method 1: Using Chocolatey
choco install k6

# Method 2: Using Winget
winget install k6 --source winget

# Method 3: Using Scoop
scoop install k6

# Method 4: Manual MSI Installer
# Download official installer from: https://dl.k6.io/msi/k6-latest-amd64.msi
```

Verify installation:
```powershell
k6 version
```

### macOS
```bash
brew install k6
```

### Linux (Ubuntu / Debian)
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

---

## 3. Running Performance Tests

### Step 1: Ensure Local EventHub Backend is Running
In your backend terminal:
```powershell
cd backend
npm run dev
# Or: node server.js
```
The server will run at `http://localhost:5000`.

### Step 2: Run End-to-End Load Test
```powershell
cd testing/performance
k6 run eventhub-load.js
```

### Step 3: Run Event Catalogue Stress Test
```powershell
cd testing/performance
k6 run events-load.js
```

### Custom Configuration & Environment Overrides
You can customize the base URL and credentials using environment variables:

```powershell
k6 run -e BASE_URL=http://localhost:5000 -e TEST_USER_EMAIL=admin@eventhub.com -e TEST_USER_PASSWORD=admin123 eventhub-load.js
```

To run a single virtual user smoke test quickly:
```powershell
k6 run --vus 1 --duration 10s eventhub-load.js
```

---

## 4. Key Performance Thresholds & Quality Gates

Both test scripts enforce strict non-functional requirements (SLAs/SLOs):

- **Error Rate (`http_req_failed`)**: `< 1.0%` &mdash; 99% of all requests must return valid HTTP 2xx status codes.
- **p95 Latency (`http_req_duration: p(95)`)**: `< 500ms` &mdash; 95% of API responses must finish in under 500ms.
- **Average Latency (`http_req_duration: avg`)**: `< 300ms` &mdash; Average response time across all endpoints.
- **Health Check (`health_duration: p(95)`)**: `< 200ms` &mdash; Fast failover check SLA.
- **Catalogue Query Latency (`events_query_latency: p(95)`)**: `< 350ms` &mdash; Database indexing validation.

---

## 5. Performance Safety & Production Safeguards

1. **Safe Concurrency**: The scripts default to a conservative maximum of **10 Virtual Users (VUs)**. Never run 100+ VUs against non-isolated infrastructure.
2. **Read-Only / Non-Destructive**: Automated load tests exercise listing, filtering, search autocomplete, login, and query operations. They do not trigger real payments or delete production data.
3. **No External Payment Gateway Calls**: Razorpay payment order initiation and webhook callbacks are not spammed during performance runs to avoid rate-limiting or account flags.
