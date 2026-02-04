// Type definitions
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Question {
  id: number;
  text: string;
  difficulty: Difficulty;
  answer?: string;
}

export interface RoleData {
  id: string;
  name: string;
  icon: string;
}

export interface CategoryData {
  id: string;
  name: string;
}

// Role definitions
export const roles: RoleData[] = [
  { id: "backend-developer", name: "Backend Developer", icon: "Server" },
  { id: "ai-engineer", name: "AI Engineer", icon: "Brain" },
  { id: "frontend-developer", name: "Frontend Developer", icon: "Layout" },
  { id: "data-science-ml", name: "Data Science & ML", icon: "LineChart" },
  { id: "system-design", name: "System Design & Architecture", icon: "Network" },
  { id: "devops-cloud", name: "DevOps & Cloud", icon: "Cloud" },
  { id: "java-developer", name: "Java Developer", icon: "Coffee" },
  { id: "data-analyst", name: "Data Analyst", icon: "BarChart" },
  { id: "product-management", name: "Product Management", icon: "Briefcase" },
  { id: "ux-ui-design", name: "UX/UI & Design", icon: "Palette" },
  { id: "marketing", name: "Marketing", icon: "Megaphone" },
  { id: "sales", name: "Sales", icon: "TrendingUp" },
  { id: "founders-office", name: "Founders Office", icon: "Rocket" },
  { id: "blockchain", name: "Blockchain", icon: "Blocks" },
  { id: "web3", name: "Web3", icon: "Globe" },
];

// Category definitions
export const categories: CategoryData[] = [
  { id: "interview-questions", name: "Interview Questions" },
  { id: "dsa-questions", name: "DSA Questions" },
  { id: "aptitude-questions", name: "Aptitude Questions" },
  { id: "sql-questions", name: "SQL Questions" },
  { id: "core-cs-questions", name: "Core CS Questions" },
];

// Questions data organized by role and category
export const questionsData: Record<string, Record<string, Question[]>> = {
  "backend-developer": {
    "interview-questions": [
      { 
        id: 1, 
        text: "What is middleware in web frameworks and how is it used?", 
        difficulty: "Easy",
        answer: `Middleware is software that acts as an intermediary layer between the incoming HTTP request and the final route handler in web applications.

**How it works:**
1. Request comes in → Middleware processes it → Route handler responds
2. Can modify request/response objects
3. Can end the request-response cycle
4. Can call the next middleware in the stack

**Common use cases:**
- **Authentication**: Verify JWT tokens or session cookies
- **Logging**: Record request details for debugging
- **CORS handling**: Add cross-origin headers
- **Rate limiting**: Throttle requests
- **Body parsing**: Parse JSON/form data

\`\`\`javascript
// Express.js middleware example
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Verify token...
  next(); // Pass to next middleware/handler
};
\`\`\``
      },
      { 
        id: 2, 
        text: "How does HTTP caching work and which headers control it?", 
        difficulty: "Easy",
        answer: `HTTP caching stores copies of responses to reduce server load and improve performance.

**Key Cache Headers:**

| Header | Purpose |
|--------|---------|
| \`Cache-Control\` | Main directive (max-age, no-cache, no-store) |
| \`ETag\` | Unique identifier for resource version |
| \`Last-Modified\` | Timestamp of last change |
| \`Expires\` | Absolute expiration date (legacy) |

**Cache-Control Directives:**
- \`max-age=3600\` - Cache for 1 hour
- \`no-cache\` - Revalidate before using
- \`no-store\` - Never cache (sensitive data)
- \`private\` - Only browser can cache
- \`public\` - CDNs can cache

**Validation Flow:**
1. Browser sends \`If-None-Match: <etag>\` or \`If-Modified-Since: <date>\`
2. Server returns \`304 Not Modified\` if unchanged
3. Browser uses cached version`
      },
      { 
        id: 3, 
        text: "Explain REST vs. GraphQL and trade-offs.", 
        difficulty: "Easy",
        answer: `**REST (Representational State Transfer)**
- Resource-based URLs: \`/users/123\`, \`/posts\`
- Fixed response structure per endpoint
- Multiple endpoints for related data
- HTTP verbs define actions (GET, POST, PUT, DELETE)

**GraphQL**
- Single endpoint: \`/graphql\`
- Client specifies exactly what data it needs
- Strongly typed schema
- Single request for related data

**Trade-offs:**

| Aspect | REST | GraphQL |
|--------|------|---------|
| Over-fetching | Common | Eliminated |
| Under-fetching | Requires multiple calls | Single query |
| Caching | HTTP caching built-in | Complex, needs Apollo/etc |
| Learning curve | Lower | Higher |
| Tooling | Mature | Growing |
| File uploads | Native | Requires workarounds |

**When to use REST:** Simple CRUD, caching critical, team familiarity
**When to use GraphQL:** Complex relationships, mobile apps, varying client needs`
      },
      { 
        id: 4, 
        text: "What is CORS and how do you configure it?", 
        difficulty: "Easy",
        answer: `**CORS (Cross-Origin Resource Sharing)** is a security mechanism that allows servers to specify which origins can access their resources.

**The Problem:**
Browsers block requests from \`https://app.com\` to \`https://api.com\` by default (same-origin policy).

**How CORS Works:**
1. Browser sends preflight \`OPTIONS\` request
2. Server responds with allowed origins/methods
3. If allowed, browser sends actual request

**Key Headers:**
\`\`\`http
Access-Control-Allow-Origin: https://app.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
\`\`\`

**Express.js Configuration:**
\`\`\`javascript
const cors = require('cors');

app.use(cors({
  origin: ['https://app.com', 'https://admin.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  maxAge: 86400
}));
\`\`\`

**Security tip:** Never use \`origin: '*'\` with \`credentials: true\``
      },
      { 
        id: 5, 
        text: "How do you secure sensitive data at rest?", 
        difficulty: "Easy",
        answer: `**Data at rest** = stored data (databases, files, backups)

**Encryption Methods:**

**1. Database-Level Encryption (TDE)**
\`\`\`sql
-- Transparent Data Encryption (PostgreSQL)
-- Encrypts entire database files
CREATE EXTENSION pgcrypto;
\`\`\`

**2. Column-Level Encryption**
\`\`\`javascript
// Encrypt sensitive columns
const crypto = require('crypto');

function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return { iv: iv.toString('hex'), data: encrypted.toString('hex'), tag: cipher.getAuthTag().toString('hex') };
}

// Store: SSN, credit cards, health data
await db.query('INSERT INTO users (ssn_encrypted) VALUES ($1)', [encrypt(ssn, key)]);
\`\`\`

**3. Application-Level Encryption**
- Encrypt before storing
- Decrypt after retrieving
- Key management crucial

**Best Practices:**
- **AES-256** for encryption
- **Key rotation** periodically
- **Separate key storage** (AWS KMS, HashiCorp Vault)
- **Backup encryption**
- **Disk encryption** for physical security

**Key Management:**
\`\`\`javascript
// Never store keys in code!
const key = await vault.getSecret('encryption-key');
\`\`\``
      },
      { 
        id: 6, 
        text: "What is a reverse proxy and why use one?", 
        difficulty: "Easy",
        answer: `A **reverse proxy** sits between clients and servers, forwarding requests to backend servers.

**How it works:**
\`\`\`
Client → Reverse Proxy → Backend Server(s)
                      → Backend Server 2
                      → Backend Server 3
\`\`\`

**Benefits:**

**1. Load Balancing**
\`\`\`nginx
upstream backend {
  server backend1.example.com weight=3;
  server backend2.example.com;
  server backend3.example.com backup;
}
\`\`\`

**2. SSL Termination**
- Handle HTTPS at proxy level
- Backend uses HTTP internally

**3. Caching**
\`\`\`nginx
proxy_cache_path /tmp/cache levels=1:2 keys_zone=my_cache:10m;
location / {
  proxy_cache my_cache;
  proxy_pass http://backend;
}
\`\`\`

**4. Security**
- Hide backend server details
- DDoS protection
- Web Application Firewall (WAF)

**5. Compression**
\`\`\`nginx
gzip on;
gzip_types text/plain application/json;
\`\`\`

**Popular Reverse Proxies:**
- **Nginx** - Fast, widely used
- **HAProxy** - High availability focus
- **Traefik** - Container-native
- **Cloudflare** - CDN + proxy

**When to use:**
- Multiple backend servers
- Need SSL offloading
- Want caching layer
- Require load balancing`
      },
      { 
        id: 7, 
        text: "Explain JSON Web Tokens (JWT) structure.", 
        difficulty: "Easy",
        answer: `A JWT consists of three base64-encoded parts separated by dots: \`header.payload.signature\`

**1. Header**
\`\`\`json
{
  "alg": "HS256",
  "typ": "JWT"
}
\`\`\`

**2. Payload (Claims)**
\`\`\`json
{
  "sub": "user123",
  "name": "John Doe",
  "role": "admin",
  "iat": 1704067200,
  "exp": 1704153600
}
\`\`\`

**Standard Claims:**
- \`iss\` - Issuer
- \`sub\` - Subject (user ID)
- \`exp\` - Expiration time
- \`iat\` - Issued at
- \`aud\` - Audience

**3. Signature**
\`\`\`javascript
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
\`\`\`

**Important:** JWTs are signed, NOT encrypted. Anyone can decode the payload. Never store sensitive data in JWTs.

**Verification Flow:**
1. Extract header & payload
2. Recompute signature with secret
3. Compare with received signature
4. Check expiration time`
      },
      { 
        id: 8, 
        text: "What is connection pooling and its benefits?", 
        difficulty: "Easy",
        answer: `**Connection pooling** reuses database connections instead of creating new ones for each request.

**Problem Without Pooling:**
\`\`\`
Request 1 → Open connection → Query → Close connection
Request 2 → Open connection → Query → Close connection
(Each connection takes ~50-100ms to establish)
\`\`\`

**With Pooling:**
\`\`\`
Pool: [Conn1, Conn2, Conn3, Conn4, Conn5]
Request 1 → Borrow Conn1 → Query → Return Conn1
Request 2 → Borrow Conn2 → Query → Return Conn2
\`\`\`

**Implementation:**
\`\`\`javascript
// Node.js with pg-pool
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  database: 'mydb',
  max: 20,        // Max connections
  min: 5,         // Min idle connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Use pool instead of individual connections
const result = await pool.query('SELECT * FROM users');
\`\`\`

**Benefits:**
| Aspect | Without Pool | With Pool |
|--------|--------------|-----------|
| Connection time | ~100ms each | Near instant |
| Resource usage | High | Controlled |
| Scalability | Poor | Excellent |
| DB load | Spiky | Smooth |

**Best Practices:**
- Size pool based on workload
- Monitor connection usage
- Set appropriate timeouts`
      },
      { 
        id: 9, 
        text: "Describe JSON vs. Protobuf for data serialization.", 
        difficulty: "Easy",
        answer: `**JSON (JavaScript Object Notation)**
\`\`\`json
{"name": "John", "age": 30, "active": true}
\`\`\`

**Protocol Buffers (Protobuf)**
\`\`\`protobuf
message User {
  string name = 1;
  int32 age = 2;
  bool active = 3;
}
\`\`\`

**Comparison:**

| Aspect | JSON | Protobuf |
|--------|------|----------|
| Format | Text | Binary |
| Size | Larger (~30-50% more) | Smaller |
| Speed | Slower parse | Faster parse |
| Human readable | ✓ Yes | ✗ No |
| Schema | Optional | Required |
| Language support | Universal | Code generation |
| Browser native | ✓ Yes | ✗ Needs library |

**When to use JSON:**
- Public APIs (human readable)
- Web browsers
- Debugging ease
- Flexibility needed

**When to use Protobuf:**
- Internal microservices
- High-performance systems
- Mobile apps (bandwidth)
- Strict schema enforcement

**gRPC uses Protobuf:**
\`\`\`protobuf
service UserService {
  rpc GetUser (UserRequest) returns (UserResponse);
}
\`\`\`

**Alternatives:**
- **MessagePack**: Binary JSON
- **Avro**: Schema evolution
- **Thrift**: Facebook's alternative`
      },
      { 
        id: 10, 
        text: "What is TLS handshake and its purpose?", 
        difficulty: "Easy",
        answer: `**TLS (Transport Layer Security)** encrypts data in transit. The handshake establishes a secure connection.

**Purpose:**
1. Authenticate server (optionally client)
2. Agree on encryption algorithms
3. Exchange keys securely

**TLS 1.3 Handshake (simplified):**
\`\`\`
Client                              Server
  |                                    |
  |------ Client Hello --------------->|
  |       (supported ciphers,          |
  |        client random)              |
  |                                    |
  |<----- Server Hello + Certificate --|
  |       (chosen cipher,              |
  |        server random, cert)        |
  |                                    |
  |------ Key Exchange, Finished ----->|
  |                                    |
  |<----- Finished --------------------|
  |                                    |
  |====== Encrypted Data ==============>|
\`\`\`

**Key Steps:**
1. **Client Hello**: "Here's what I support"
2. **Server Hello**: "Let's use this cipher"
3. **Certificate**: Server proves identity
4. **Key Exchange**: Generate session keys
5. **Finished**: Verify handshake integrity

**Performance:**
- TLS 1.2: 2 round trips
- TLS 1.3: 1 round trip (faster!)
- Session resumption: 0-RTT possible

**Common Issues:**
- Certificate expired
- Hostname mismatch
- Weak cipher suites
- Mixed content (HTTP on HTTPS page)`
      },
      { 
        id: 11, 
        text: "Explain symbolic links and their use in deployment.", 
        difficulty: "Easy",
        answer: `A **symbolic link (symlink)** is a file that points to another file or directory.

**Creating Symlinks:**
\`\`\`bash
# Create symlink
ln -s /path/to/target /path/to/link

# Example
ln -s /var/www/releases/v2.0 /var/www/current
\`\`\`

**Zero-Downtime Deployment Pattern:**
\`\`\`
/var/www/
├── releases/
│   ├── v1.0/          # Previous version
│   ├── v2.0/          # Current version
│   └── v2.1/          # New version
├── shared/            # Shared files (uploads, logs)
│   ├── uploads/
│   └── logs/
└── current -> releases/v2.0  # Symlink!
\`\`\`

**Deployment Process:**
\`\`\`bash
# 1. Deploy new version
cp -r app releases/v2.1/

# 2. Link shared files
ln -s /var/www/shared/uploads releases/v2.1/uploads

# 3. Atomic switch (instant!)
ln -sfn /var/www/releases/v2.1 /var/www/current

# 4. Restart app server
systemctl reload nginx
\`\`\`

**Benefits:**
- **Atomic**: Switch is instant
- **Rollback**: Point to previous release
- **No downtime**: Old version serves until switch
- **Shared resources**: Uploads persist across deploys

**Tools using this pattern:**
- Capistrano (Ruby)
- Deployer (PHP)
- Custom CI/CD scripts`
      },
      { 
        id: 12, 
        text: "What are the core principles of RESTful API design?", 
        difficulty: "Medium",
        answer: `**1. Resource-Based URLs**
\`\`\`
GET    /users          # List users
GET    /users/123      # Get specific user
POST   /users          # Create user
PUT    /users/123      # Update user
DELETE /users/123      # Delete user
\`\`\`

**2. Proper HTTP Methods**
- \`GET\` - Read (idempotent)
- \`POST\` - Create
- \`PUT\` - Full update (idempotent)
- \`PATCH\` - Partial update
- \`DELETE\` - Remove (idempotent)

**3. Meaningful Status Codes**
- \`200\` OK, \`201\` Created, \`204\` No Content
- \`400\` Bad Request, \`401\` Unauthorized, \`403\` Forbidden, \`404\` Not Found
- \`500\` Internal Server Error

**4. Statelessness**
Each request contains all information needed. No server-side sessions.

**5. HATEOAS (Hypermedia)**
\`\`\`json
{
  "id": 123,
  "name": "John",
  "_links": {
    "self": "/users/123",
    "posts": "/users/123/posts"
  }
}
\`\`\`

**6. Consistent Naming**
- Use nouns, not verbs: \`/users\` not \`/getUsers\`
- Plural resources: \`/users\` not \`/user\`
- Kebab-case: \`/user-profiles\` not \`/userProfiles\``
      },
      { 
        id: 13, 
        text: "Explain the concept of database normalization and its trade-offs.", 
        difficulty: "Medium",
        answer: `**Normalization** organizes data to reduce redundancy and improve integrity.

**Normal Forms:**

**1NF (First Normal Form)**
- Atomic values (no arrays in cells)
- Each row unique

**2NF (Second Normal Form)**
- 1NF + No partial dependencies
- All non-key columns depend on entire primary key

**3NF (Third Normal Form)**
- 2NF + No transitive dependencies
- Non-key columns don't depend on other non-key columns

**Example - Denormalized:**
| OrderID | Customer | CustomerEmail | Product | Price |
|---------|----------|---------------|---------|-------|
| 1 | John | john@email.com | Laptop | 1000 |
| 2 | John | john@email.com | Mouse | 25 |

**Normalized (3NF):**
\`\`\`sql
-- Customers table
| CustomerID | Name | Email |

-- Products table  
| ProductID | Name | Price |

-- Orders table
| OrderID | CustomerID | ProductID |
\`\`\`

**Trade-offs:**

| Normalized | Denormalized |
|------------|--------------|
| Less redundancy | Faster reads (no joins) |
| Data integrity | Data duplication |
| More joins | Update anomalies |
| Slower reads | Better for analytics |

**When to denormalize:**
- Read-heavy workloads
- Reporting/analytics
- Caching layers
- NoSQL databases`
      },
      { 
        id: 14, 
        text: "How would you implement pagination in a REST API?", 
        difficulty: "Medium",
        answer: `**Pagination** breaks large result sets into manageable pages.

**1. Offset-Based (Simple)**
\`\`\`
GET /api/users?page=2&limit=20
GET /api/users?offset=20&limit=20
\`\`\`

\`\`\`sql
SELECT * FROM users 
ORDER BY created_at 
LIMIT 20 OFFSET 20;
\`\`\`

**Pros:** Simple, familiar
**Cons:** Slow for large offsets, inconsistent with real-time data

---

**2. Cursor-Based (Recommended)**
\`\`\`
GET /api/users?cursor=eyJpZCI6MTAwfQ&limit=20
\`\`\`

\`\`\`sql
SELECT * FROM users 
WHERE id > 100  -- cursor value
ORDER BY id 
LIMIT 20;
\`\`\`

**Pros:** Consistent results, fast at any page
**Cons:** No random page access

---

**Response Format:**
\`\`\`json
{
  "data": [...],
  "pagination": {
    "total": 1000,
    "limit": 20,
    "offset": 40,
    "next_cursor": "eyJpZCI6MTIwfQ",
    "has_more": true
  },
  "links": {
    "next": "/api/users?cursor=xyz",
    "prev": "/api/users?cursor=abc"
  }
}
\`\`\`

**Best Practices:**
- Default limit (e.g., 20)
- Maximum limit (e.g., 100)
- Include total count (if performant)
- Use HATEOAS links`
      },
      { 
        id: 15, 
        text: "How do you handle file uploads in a backend application?", 
        difficulty: "Medium",
        answer: `**File Upload Strategies:**

**1. Direct Upload to Server**
\`\`\`javascript
// Express with multer
const multer = require('multer');
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    cb(null, allowed.includes(file.mimetype));
  }
});

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ filename: req.file.filename });
});
\`\`\`

**2. Pre-signed URLs (Recommended for large files)**
\`\`\`javascript
// Generate pre-signed URL
const s3 = new AWS.S3();
const url = await s3.getSignedUrlPromise('putObject', {
  Bucket: 'my-bucket',
  Key: 'uploads/file.jpg',
  Expires: 300, // 5 minutes
  ContentType: 'image/jpeg'
});

// Client uploads directly to S3
\`\`\`

**Security Considerations:**
- Validate file types (MIME + magic bytes)
- Limit file size
- Scan for malware
- Generate unique filenames
- Store outside web root

**Processing Pipeline:**
\`\`\`
Upload → Validate → Store → Process (resize, etc.) → Serve via CDN
\`\`\`

**Storage Options:**
- Local filesystem (simple, not scalable)
- Cloud storage (S3, GCS, Azure Blob)
- CDN for delivery`
      },
      { 
        id: 16, 
        text: "Describe how webhooks work and how to implement retry logic.", 
        difficulty: "Medium",
        answer: `**Webhooks** are HTTP callbacks that notify your app when events occur.

**How they work:**
\`\`\`
1. Event happens (e.g., payment completed)
2. Source sends POST to your endpoint
3. Your server processes the event
4. Return 2xx to acknowledge receipt
\`\`\`

**Receiving Webhooks:**
\`\`\`javascript
app.post('/webhooks/stripe', async (req, res) => {
  // 1. Verify signature
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body, sig, webhookSecret
  );
  
  // 2. Process event (idempotently!)
  if (event.type === 'payment_intent.succeeded') {
    await processPayment(event.data.object);
  }
  
  // 3. Acknowledge quickly
  res.status(200).send('OK');
});
\`\`\`

**Sending Webhooks with Retry:**
\`\`\`javascript
async function sendWebhook(url, payload, attempt = 1) {
  const maxAttempts = 5;
  const delays = [0, 60, 300, 3600, 86400]; // seconds
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 30000
    });
    
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    return true;
    
  } catch (error) {
    if (attempt < maxAttempts) {
      await sleep(delays[attempt] * 1000);
      return sendWebhook(url, payload, attempt + 1);
    }
    throw error;
  }
}
\`\`\`

**Best Practices:**
- **Idempotency**: Handle duplicate deliveries
- **Signatures**: Verify webhook authenticity
- **Async processing**: Queue heavy work
- **Exponential backoff**: Increase delay between retries`
      },
      { 
        id: 17, 
        text: "How do you implement rate limiting for APIs?", 
        difficulty: "Medium",
        answer: `Rate limiting protects APIs from abuse and ensures fair usage.

**Common Algorithms:**

**1. Token Bucket**
- Tokens added at fixed rate
- Request consumes token
- Allows bursts up to bucket size

**2. Sliding Window**
- Counts requests in rolling time window
- More accurate than fixed windows

**Implementation Example:**
\`\`\`javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
\`\`\`

**Redis-based (distributed):**
\`\`\`javascript
const key = \`ratelimit:\${userId}\`;
const current = await redis.incr(key);
if (current === 1) {
  await redis.expire(key, 60); // 1 minute window
}
if (current > 100) {
  throw new Error('Rate limit exceeded');
}
\`\`\`

**Response Headers:**
\`\`\`http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704153600
Retry-After: 60
\`\`\``
      },
      { 
        id: 18, 
        text: "Explain ACID properties in the context of relational databases.", 
        difficulty: "Medium",
        answer: `ACID guarantees reliable database transactions:

**A - Atomicity**
All operations succeed or all fail. No partial updates.
\`\`\`sql
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT; -- Both succeed or both rollback
\`\`\`

**C - Consistency**
Database moves from one valid state to another. Constraints always enforced.
- Foreign keys maintained
- Check constraints validated
- Triggers executed

**I - Isolation**
Concurrent transactions don't interfere. Isolation levels:
| Level | Dirty Read | Non-Repeatable | Phantom |
|-------|------------|----------------|---------|
| READ UNCOMMITTED | ✓ | ✓ | ✓ |
| READ COMMITTED | ✗ | ✓ | ✓ |
| REPEATABLE READ | ✗ | ✗ | ✓ |
| SERIALIZABLE | ✗ | ✗ | ✗ |

**D - Durability**
Committed transactions survive system failures. Data written to disk/WAL before commit acknowledged.

**Trade-off:** Stronger ACID = Lower performance
- NoSQL often sacrifices some ACID for scalability
- Distributed systems use eventual consistency`
      },
      { 
        id: 19, 
        text: "Describe how you would manage environment-specific configurations.", 
        difficulty: "Medium",
        answer: `**Environment-specific config** ensures apps behave correctly in dev, staging, and production.

**1. Environment Variables (Recommended)**
\`\`\`javascript
// .env files
// .env.development
DATABASE_URL=postgres://localhost/dev_db

// .env.production  
DATABASE_URL=postgres://prod-server/prod_db

// Usage
const dbUrl = process.env.DATABASE_URL;
\`\`\`

**2. Config Files by Environment**
\`\`\`javascript
// config/index.js
const env = process.env.NODE_ENV || 'development';

const configs = {
  development: require('./development'),
  production: require('./production'),
  test: require('./test'),
};

module.exports = configs[env];
\`\`\`

**3. Secrets Management**
\`\`\`javascript
// Never commit secrets!
// Use secret managers:
// - AWS Secrets Manager
// - HashiCorp Vault
// - Azure Key Vault

const secret = await secretsManager.getSecret('api-key');
\`\`\`

**Best Practices:**
| Do | Don't |
|----|-------|
| Use .env.example | Commit .env files |
| Validate on startup | Use defaults for secrets |
| Encrypt secrets | Log sensitive values |
| Use 12-factor principles | Hardcode configs |

**Validation:**
\`\`\`javascript
const required = ['DATABASE_URL', 'API_KEY', 'JWT_SECRET'];
required.forEach(key => {
  if (!process.env[key]) {
    throw new Error(\`Missing required env var: \${key}\`);
  }
});
\`\`\``
      },
      { 
        id: 20, 
        text: "What is a circuit breaker and how is it implemented?", 
        difficulty: "Medium",
        answer: `A circuit breaker prevents cascading failures by stopping requests to failing services.

**States:**
1. **CLOSED** - Normal operation, requests pass through
2. **OPEN** - Failures exceeded threshold, requests fail immediately
3. **HALF-OPEN** - Testing if service recovered

**State Transitions:**
\`\`\`
CLOSED --[failures > threshold]--> OPEN
OPEN --[timeout expires]--> HALF-OPEN
HALF-OPEN --[request succeeds]--> CLOSED
HALF-OPEN --[request fails]--> OPEN
\`\`\`

**Implementation:**
\`\`\`javascript
class CircuitBreaker {
  constructor(options) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailure = null;
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'HALF-OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}
\`\`\`

**Libraries:** Opossum (Node.js), Resilience4j (Java), Polly (.NET)`
      },
      { 
        id: 21, 
        text: "Explain the CAP theorem and its implications for distributed systems.", 
        difficulty: "Medium",
        answer: `**CAP Theorem**: A distributed system can only guarantee 2 of 3 properties:

- **C - Consistency**: Every read gets the most recent write
- **A - Availability**: Every request gets a response
- **P - Partition Tolerance**: System works despite network failures

**Why only 2?**
During a network partition, you must choose:
- **Respond with stale data** (sacrifice Consistency for Availability)
- **Wait/fail until partition heals** (sacrifice Availability for Consistency)

**Database Classifications:**

| Type | Guarantees | Examples |
|------|------------|----------|
| CP | Consistency + Partition | MongoDB, HBase, Redis Cluster |
| AP | Availability + Partition | Cassandra, DynamoDB, CouchDB |
| CA | Consistency + Availability | Traditional RDBMS (single node) |

**Real-World Trade-offs:**
\`\`\`
Banking: CP preferred
- Account balance MUST be consistent
- Brief unavailability acceptable

Social Media: AP preferred  
- Likes count can be eventually consistent
- Must always be available
\`\`\`

**PACELC Extension:**
If **P**artition: choose **A** or **C**
**E**lse (normal): choose **L**atency or **C**onsistency

Most systems are configurable—you choose per operation.`
      },
      { 
        id: 22, 
        text: "How would you implement health checks for microservices?", 
        difficulty: "Medium",
        answer: `**Health checks** verify service availability and readiness.

**Types:**

**1. Liveness Check** - "Is the service running?"
\`\`\`javascript
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});
\`\`\`

**2. Readiness Check** - "Can it handle traffic?"
\`\`\`javascript
app.get('/health/ready', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    dependencies: await checkDependencies()
  };
  
  const healthy = Object.values(checks).every(c => c.status === 'up');
  
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString()
  });
});

async function checkDatabase() {
  try {
    await db.query('SELECT 1');
    return { status: 'up', latency: 5 };
  } catch (e) {
    return { status: 'down', error: e.message };
  }
}
\`\`\`

**Kubernetes Configuration:**
\`\`\`yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  
readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  periodSeconds: 5
  failureThreshold: 3
\`\`\`

**Response Format:**
\`\`\`json
{
  "status": "healthy",
  "version": "1.2.3",
  "uptime": 86400,
  "checks": {
    "database": { "status": "up", "latency_ms": 5 },
    "cache": { "status": "up", "latency_ms": 2 }
  }
}
\`\`\``
      },
      { 
        id: 23, 
        text: "What are the differences between monolithic and microservice architectures?", 
        difficulty: "Medium",
        answer: `**Monolithic Architecture**
Single deployable unit containing all functionality.
\`\`\`
┌─────────────────────────────┐
│         Monolith            │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │Users│ │Orders│ │Payments│ │
│  └─────┘ └─────┘ └─────┘   │
│        Single Database      │
└─────────────────────────────┘
\`\`\`

**Microservices Architecture**
Independent services communicating via APIs.
\`\`\`
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Users   │  │ Orders  │  │Payments │
│ Service │  │ Service │  │ Service │
│   DB    │  │   DB    │  │   DB    │
└────┬────┘  └────┬────┘  └────┬────┘
     └────────────┴────────────┘
           API Gateway
\`\`\`

**Comparison:**

| Aspect | Monolith | Microservices |
|--------|----------|---------------|
| Deployment | All or nothing | Independent |
| Scaling | Scale everything | Scale per service |
| Development | Simpler initially | Complex coordination |
| Technology | Single stack | Polyglot |
| Failure | Entire app down | Isolated failures |
| Testing | Easier E2E | Complex integration |

**When to use Monolith:**
- Early-stage startups
- Small teams
- Simple domains
- Rapid prototyping

**When to use Microservices:**
- Large teams
- Complex domains
- Need independent scaling
- Different tech requirements`
      },
      { 
        id: 24, 
        text: "Explain the role of message brokers in backend systems.", 
        difficulty: "Medium",
        answer: `**Message brokers** enable async communication between services.

**How it works:**
\`\`\`
Producer → Message Broker → Consumer(s)
           (Queue/Topic)
\`\`\`

**Patterns:**

**1. Point-to-Point (Queue)**
\`\`\`
Producer → [Queue] → Consumer
           One message, one consumer
\`\`\`

**2. Pub/Sub (Topic)**
\`\`\`
Publisher → [Topic] → Subscriber 1
                   → Subscriber 2
                   → Subscriber 3
\`\`\`

**Use Cases:**
\`\`\`javascript
// Order processing
await messageQueue.publish('orders', {
  orderId: '123',
  action: 'process'
});

// Multiple consumers handle:
// - Inventory update
// - Payment processing  
// - Email notification
// - Analytics
\`\`\`

**Popular Brokers:**
| Broker | Best For |
|--------|----------|
| RabbitMQ | Traditional queuing |
| Apache Kafka | Event streaming, high volume |
| AWS SQS | Managed, serverless |
| Redis Pub/Sub | Simple, low latency |

**Benefits:**
- **Decoupling**: Services don't need to know each other
- **Reliability**: Messages persist if consumer down
- **Scalability**: Add consumers to handle load
- **Async**: Don't block on slow operations

**Example with RabbitMQ:**
\`\`\`javascript
// Producer
channel.sendToQueue('tasks', Buffer.from(JSON.stringify(task)));

// Consumer
channel.consume('tasks', (msg) => {
  const task = JSON.parse(msg.content.toString());
  processTask(task);
  channel.ack(msg);
});
\`\`\``
      },
      { 
        id: 25, 
        text: "Explain the concept of eventual consistency.", 
        difficulty: "Medium",
        answer: `**Eventual consistency** = All replicas will eventually have the same data, but not immediately.

**Strong vs Eventual:**
\`\`\`
Strong Consistency:
Write → All nodes update → Read returns new value
(Slow, always consistent)

Eventual Consistency:
Write → Primary updates → Replicas sync later → Read may return old value
(Fast, temporarily inconsistent)
\`\`\`

**Example Scenario:**
\`\`\`
User updates profile picture:
1. Write to primary database (instant)
2. Replicas in other regions update (1-5 seconds)
3. User in different region may see old picture briefly
4. Eventually, all see new picture
\`\`\`

**Where it's used:**
- DNS propagation
- CDN cache invalidation
- Social media feeds
- Shopping cart counts
- NoSQL databases (Cassandra, DynamoDB)

**Conflict Resolution:**
\`\`\`
What if two updates happen simultaneously?

1. Last Write Wins (LWW)
   - Use timestamps
   - Simple but may lose data

2. Vector Clocks
   - Track causality
   - Detect conflicts

3. CRDTs (Conflict-free Replicated Data Types)
   - Automatically merge
   - No conflicts possible
\`\`\`

**When to use:**
- High availability requirements
- Geographic distribution
- Read-heavy workloads
- Non-critical data (likes, views)

**When NOT to use:**
- Financial transactions
- Inventory management
- Anything requiring immediate accuracy`
      },
      { 
        id: 26, 
        text: "How do you prevent SQL injection vulnerabilities?", 
        difficulty: "Medium",
        answer: `SQL injection occurs when user input is directly concatenated into SQL queries.

**❌ Vulnerable Code:**
\`\`\`javascript
// NEVER DO THIS!
const query = "SELECT * FROM users WHERE id = " + userId;
const query = \`SELECT * FROM users WHERE name = '\${username}'\`;
\`\`\`

**✅ Prevention Methods:**

**1. Parameterized Queries (Best)**
\`\`\`javascript
// Node.js with pg
const result = await db.query(
  'SELECT * FROM users WHERE id = $1 AND status = $2',
  [userId, 'active']
);

// MySQL
connection.execute(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);
\`\`\`

**2. ORM/Query Builders**
\`\`\`javascript
// Prisma
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// Knex.js
const users = await knex('users')
  .where('id', userId)
  .first();
\`\`\`

**3. Input Validation**
\`\`\`javascript
const userId = parseInt(req.params.id, 10);
if (isNaN(userId)) {
  throw new Error('Invalid user ID');
}
\`\`\`

**4. Least Privilege**
- Database user should only have necessary permissions
- Use read-only connections where possible

**5. Escape Special Characters (Last Resort)**
Only use when parameterized queries aren't possible.`
      },
      { 
        id: 27, 
        text: "What is the role of API gateways in microservice ecosystems?", 
        difficulty: "Medium",
        answer: `An **API Gateway** is a single entry point that routes requests to appropriate microservices.

**Functions:**
\`\`\`
Client Request → API Gateway → Service A
                            → Service B
                            → Service C
\`\`\`

**Key Features:**

**1. Request Routing**
\`\`\`yaml
routes:
  - path: /users/*
    service: user-service
  - path: /orders/*
    service: order-service
\`\`\`

**2. Authentication/Authorization**
- Validate JWT tokens once
- Apply rate limiting
- Check permissions

**3. Request/Response Transformation**
\`\`\`javascript
// Aggregate multiple service calls
GET /dashboard →
  → GET /user-service/profile
  → GET /order-service/recent
  → GET /notification-service/unread
  → Combined response
\`\`\`

**4. Load Balancing & Circuit Breaking**

**Popular API Gateways:**
| Gateway | Type |
|---------|------|
| Kong | Open source |
| AWS API Gateway | Managed |
| NGINX | High performance |
| Traefik | Container-native |

**Benefits:**
- Centralized security
- Simplified client code
- Cross-cutting concerns in one place
- Service discovery`
      },
      { 
        id: 28, 
        text: "Explain the concept of idempotency and its importance in REST APIs.", 
        difficulty: "Medium",
        answer: `An operation is **idempotent** if calling it multiple times produces the same result as calling it once.

**HTTP Methods:**
| Method | Idempotent | Safe |
|--------|------------|------|
| GET | ✓ Yes | ✓ Yes |
| PUT | ✓ Yes | ✗ No |
| DELETE | ✓ Yes | ✗ No |
| POST | ✗ No | ✗ No |
| PATCH | Depends | ✗ No |

**Why it matters:**
\`\`\`
Network timeout during payment:
- Did the payment go through?
- Safe to retry?

With idempotency:
- Retry safely with same idempotency key
- Server recognizes duplicate, returns same result
\`\`\`

**Implementation:**
\`\`\`javascript
app.post('/payments', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  
  // Check if already processed
  const existing = await cache.get(\`idem:\${idempotencyKey}\`);
  if (existing) {
    return res.json(JSON.parse(existing));
  }
  
  // Process payment
  const result = await processPayment(req.body);
  
  // Store result (24 hour TTL)
  await cache.set(\`idem:\${idempotencyKey}\`, JSON.stringify(result), 86400);
  
  res.json(result);
});
\`\`\`

**Best Practices:**
- Client generates unique idempotency keys
- Store results for reasonable TTL
- Return same response for duplicates
- Use for any mutating operations`
      },
      { 
        id: 29, 
        text: "What is container orchestration and why use Kubernetes?", 
        difficulty: "Medium",
        answer: `**Container orchestration** automates deployment, scaling, and management of containerized applications.

**Why Kubernetes (K8s)?**

**1. Automatic Scaling**
\`\`\`yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      targetAverageUtilization: 70
\`\`\`

**2. Self-Healing**
- Restarts failed containers
- Replaces unresponsive nodes
- Kills containers that don't pass health checks

**3. Service Discovery**
\`\`\`yaml
# Services find each other by name
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
  - port: 80
\`\`\`

**4. Rolling Updates**
\`\`\`bash
kubectl set image deployment/app app=app:v2
# Gradually replaces old pods with new ones
\`\`\`

**Key Concepts:**
| Concept | Purpose |
|---------|---------|
| Pod | Smallest deployable unit |
| Deployment | Manages pod replicas |
| Service | Stable network endpoint |
| Ingress | External access/routing |
| ConfigMap | Configuration management |

**When to use:**
- Multiple services to manage
- Need auto-scaling
- High availability required
- Microservices architecture`
      },
      { 
        id: 30, 
        text: "Describe how you would handle long-running background jobs.", 
        difficulty: "Medium",
        answer: `**Background jobs** run outside the request-response cycle for async processing.

**Common Patterns:**

**1. Job Queue (Redis/RabbitMQ)**
\`\`\`javascript
// Producer - Add job
await queue.add('email', {
  to: 'user@example.com',
  template: 'welcome'
});

// Consumer - Process job
queue.process('email', async (job) => {
  await sendEmail(job.data);
});
\`\`\`

**2. Scheduled Jobs (Cron)**
\`\`\`javascript
// node-cron
cron.schedule('0 0 * * *', () => {
  // Run daily at midnight
  generateDailyReport();
});
\`\`\`

**3. Worker Processes**
\`\`\`
Web Server → Queue → Worker 1
                  → Worker 2
                  → Worker 3
\`\`\`

**Best Practices:**
\`\`\`javascript
// 1. Idempotent jobs (safe to retry)
async function processOrder(orderId) {
  const order = await getOrder(orderId);
  if (order.processed) return; // Already done
  // Process...
}

// 2. Progress tracking
job.progress(50);

// 3. Dead letter queue for failures
if (attempts >= maxAttempts) {
  await deadLetterQueue.add(job);
}

// 4. Timeout handling
const result = await Promise.race([
  processJob(),
  timeout(30000)
]);
\`\`\`

**Tools:**
- **Bull** (Node.js + Redis)
- **Celery** (Python)
- **Sidekiq** (Ruby)
- **AWS SQS + Lambda**`
      },
      { 
        id: 31, 
        text: "What is the purpose of feature flags and how do you implement them?", 
        difficulty: "Medium",
        answer: `**Feature flags** (feature toggles) enable/disable features without deploying code.

**Use Cases:**
- Gradual rollouts
- A/B testing
- Kill switches
- Beta features
- Trunk-based development

**Implementation:**
\`\`\`javascript
// Simple in-code flag
const features = {
  NEW_CHECKOUT: process.env.FEATURE_NEW_CHECKOUT === 'true',
  DARK_MODE: true,
};

if (features.NEW_CHECKOUT) {
  return <NewCheckout />;
} else {
  return <OldCheckout />;
}
\`\`\`

**Advanced with user targeting:**
\`\`\`javascript
// Using LaunchDarkly, Unleash, etc.
const showNewFeature = await featureFlags.isEnabled(
  'new-feature',
  { 
    userId: user.id,
    email: user.email,
    plan: user.plan
  }
);

// Rules:
// - 10% of users
// - All premium users
// - Users with @company.com email
\`\`\`

**Database-backed:**
\`\`\`sql
CREATE TABLE feature_flags (
  name VARCHAR(100) PRIMARY KEY,
  enabled BOOLEAN DEFAULT false,
  percentage INT DEFAULT 0,
  user_whitelist TEXT[]
);
\`\`\`

**Best Practices:**
- Clean up old flags
- Document flag purpose
- Set expiration dates
- Have kill switch for emergencies
- Log flag evaluations for debugging`
      },
      { 
        id: 32, 
        text: "Explain how HTTP/2 improves performance over HTTP/1.1.", 
        difficulty: "Medium",
        answer: `**HTTP/2** is a major revision that significantly improves performance.

**Key Improvements:**

**1. Multiplexing**
\`\`\`
HTTP/1.1:
Req1 → Resp1 → Req2 → Resp2 → Req3 → Resp3 (sequential)

HTTP/2:
Req1 ─┐     ┌─ Resp1
Req2 ─┼────►├─ Resp2  (parallel on single connection)
Req3 ─┘     └─ Resp3
\`\`\`

**2. Header Compression (HPACK)**
\`\`\`
HTTP/1.1: Headers sent in full each time (~500-800 bytes)
HTTP/2: Headers compressed + only differences sent
\`\`\`

**3. Server Push**
\`\`\`
Client requests: index.html
Server sends: index.html + style.css + app.js (proactively)
\`\`\`

**4. Binary Protocol**
- More efficient to parse
- Less error-prone than text

**5. Stream Prioritization**
- Critical resources first
- Dependent streams wait

**Comparison:**
| Feature | HTTP/1.1 | HTTP/2 |
|---------|----------|--------|
| Connections | Multiple (6 per domain) | Single |
| Format | Text | Binary |
| Headers | Repeated | Compressed |
| Streams | Sequential | Parallel |

**Migration:**
- No code changes needed
- Enable at server/load balancer level
- Works over TLS (HTTPS required in browsers)

**HTTP/3** (QUIC): Built on UDP, even faster handshakes`
      },
      { 
        id: 33, 
        text: "How do you implement graceful shutdown in backend services?", 
        difficulty: "Medium",
        answer: `**Graceful shutdown** allows in-flight requests to complete before stopping.

\`\`\`javascript
const server = app.listen(3000);

// Track active connections
let connections = new Set();
server.on('connection', (conn) => {
  connections.add(conn);
  conn.on('close', () => connections.delete(conn));
});

// Shutdown handler
async function gracefulShutdown(signal) {
  console.log(\`Received \${signal}, starting graceful shutdown\`);
  
  // 1. Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed');
    
    // 2. Close database connections
    await db.end();
    
    // 3. Close other resources
    await redis.quit();
    await messageQueue.close();
    
    console.log('Graceful shutdown complete');
    process.exit(0);
  });
  
  // 4. Force close after timeout
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    connections.forEach(conn => conn.destroy());
    process.exit(1);
  }, 30000);
}

// Register handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
\`\`\`

**Kubernetes Configuration:**
\`\`\`yaml
spec:
  terminationGracePeriodSeconds: 30
  containers:
  - lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 5"]
\`\`\`

**Checklist:**
- [ ] Stop accepting new connections
- [ ] Complete in-flight requests
- [ ] Close database pools
- [ ] Flush message queues
- [ ] Deregister from service discovery
- [ ] Force exit after timeout`
      },
      { 
        id: 34, 
        text: "Describe best practices for API versioning.", 
        difficulty: "Medium",
        answer: `**API versioning** manages breaking changes without disrupting clients.

**Strategies:**

**1. URL Path Versioning (Most Common)**
\`\`\`
GET /api/v1/users
GET /api/v2/users
\`\`\`
✓ Clear, easy to route
✗ Not truly RESTful

**2. Query Parameter**
\`\`\`
GET /api/users?version=1
GET /api/users?version=2
\`\`\`
✓ Optional versioning
✗ Easy to forget

**3. Header Versioning**
\`\`\`
GET /api/users
Accept: application/vnd.company.v1+json
\`\`\`
✓ Clean URLs
✗ Harder to test in browser

**4. Content Negotiation**
\`\`\`
Accept: application/json; version=1
\`\`\`

**Best Practices:**
\`\`\`javascript
// 1. Only version when breaking changes
// Breaking: Removing fields, changing types
// Non-breaking: Adding fields, new endpoints

// 2. Support multiple versions
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// 3. Deprecation headers
res.set('Deprecation', 'true');
res.set('Sunset', 'Sat, 31 Dec 2024 23:59:59 GMT');
res.set('Link', '</api/v2/users>; rel="successor-version"');

// 4. Version for at least 6-12 months
// 5. Communicate deprecation timeline
\`\`\`

**Semantic Versioning for APIs:**
- Major: Breaking changes (v1 → v2)
- Minor: New features (backwards compatible)
- Patch: Bug fixes`
      },
      { 
        id: 35, 
        text: "How do you optimize database query performance in high-traffic environments?", 
        difficulty: "Hard",
        answer: `**Query Optimization Strategies:**

**1. Indexing**
\`\`\`sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index (order matters!)
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- Partial index (for frequent filters)
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';
\`\`\`

**2. Query Analysis**
\`\`\`sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;
-- Check: Seq Scan vs Index Scan, rows estimated vs actual
\`\`\`

**3. Query Optimization**
\`\`\`sql
-- ❌ Bad: SELECT *
SELECT * FROM users;

-- ✓ Good: Select needed columns
SELECT id, name, email FROM users;

-- ❌ Bad: N+1 queries
users.forEach(u => getOrders(u.id));

-- ✓ Good: JOIN or IN
SELECT * FROM orders WHERE user_id IN (1, 2, 3);
\`\`\`

**4. Caching**
\`\`\`javascript
async function getUser(id) {
  const cached = await redis.get(\`user:\${id}\`);
  if (cached) return JSON.parse(cached);
  
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  await redis.set(\`user:\${id}\`, JSON.stringify(user), 'EX', 3600);
  return user;
}
\`\`\`

**5. Read Replicas**
\`\`\`javascript
const readDb = new Pool({ host: 'replica.db.com' });
const writeDb = new Pool({ host: 'primary.db.com' });
\`\`\`

**6. Connection Pooling**
**7. Query Pagination**
**8. Denormalization for read-heavy tables**`
      },
      { 
        id: 36, 
        text: "What strategies ensure secure authentication for backend services?", 
        difficulty: "Hard",
        answer: `**Authentication Security Best Practices:**

**1. Password Hashing**
\`\`\`javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 12); // Cost factor 12
const match = await bcrypt.compare(password, hash);
\`\`\`

**2. JWT Best Practices**
\`\`\`javascript
// Short-lived access tokens
const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });

// Long-lived refresh tokens (stored securely)
const refreshToken = jwt.sign({ userId }, refreshSecret, { expiresIn: '7d' });

// Rotate refresh tokens on use
\`\`\`

**3. Rate Limiting**
\`\`\`javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 min
  skipSuccessfulRequests: true
});
\`\`\`

**4. Multi-Factor Authentication (MFA)**
\`\`\`javascript
const speakeasy = require('speakeasy');
const verified = speakeasy.totp.verify({
  secret: user.totpSecret,
  encoding: 'base32',
  token: userProvidedCode
});
\`\`\`

**5. Session Management**
- HttpOnly, Secure, SameSite cookies
- Regenerate session on login
- Implement logout everywhere

**6. OAuth 2.0 / OpenID Connect**
- Use established providers
- Validate tokens properly

**Checklist:**
- [ ] HTTPS everywhere
- [ ] Strong password requirements
- [ ] Account lockout after failures
- [ ] Audit logging
- [ ] Secure password reset flow
- [ ] CSRF protection`
      },
      { 
        id: 37, 
        text: "Describe how you would design a logging and monitoring system.", 
        difficulty: "Hard",
        answer: `**Logging & Monitoring Architecture:**

**1. Structured Logging**
\`\`\`javascript
const logger = require('pino')();

logger.info({
  event: 'order_created',
  orderId: '123',
  userId: 'abc',
  amount: 99.99,
  duration: 150
});

// Output: {"level":30,"time":1234,"event":"order_created",...}
\`\`\`

**2. Log Aggregation**
\`\`\`
App 1 ─┐
App 2 ─┼──► Log Shipper ──► Elasticsearch ──► Kibana
App 3 ─┘    (Filebeat)         (Store)        (Visualize)
\`\`\`

**3. Metrics Collection**
\`\`\`javascript
// Prometheus metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status']
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});
\`\`\`

**4. Alerting**
\`\`\`yaml
# Prometheus alert rule
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 5m
  annotations:
    summary: "High error rate detected"
\`\`\`

**Stack Options:**
| Component | Options |
|-----------|---------|
| Logging | ELK, Loki, CloudWatch |
| Metrics | Prometheus, DataDog, New Relic |
| Tracing | Jaeger, Zipkin, X-Ray |
| Alerting | PagerDuty, Opsgenie |

**Key Metrics:**
- Request rate, error rate, latency (RED)
- Saturation, errors, latency, traffic (USE)
- Business metrics (orders/min, revenue)`
      },
      { 
        id: 39, 
        text: "What is CQRS and when would you use it?", 
        difficulty: "Hard",
        answer: `**CQRS (Command Query Responsibility Segregation)** separates read and write operations.

**Traditional:**
\`\`\`
┌─────────────────────┐
│    Single Model     │
│  Read & Write       │
│        ↕            │
│    Database         │
└─────────────────────┘
\`\`\`

**CQRS:**
\`\`\`
┌───────────┐     ┌───────────┐
│ Commands  │     │  Queries  │
│ (Write)   │     │  (Read)   │
│     ↓     │     │     ↓     │
│ Write DB  │ ──► │  Read DB  │
└───────────┘     └───────────┘
\`\`\`

**Implementation:**
\`\`\`javascript
// Commands (writes)
class CreateOrderCommand {
  constructor(userId, items) {
    this.userId = userId;
    this.items = items;
  }
}

async function handleCreateOrder(cmd) {
  const order = await writeDb.orders.create(cmd);
  await eventBus.publish('OrderCreated', order);
}

// Queries (reads)
async function getOrderSummary(userId) {
  return readDb.query(\`
    SELECT * FROM order_summaries WHERE user_id = $1
  \`, [userId]);
}
\`\`\`

**When to use:**
- High read/write ratio imbalance
- Complex read queries slowing writes
- Different scaling needs
- Event sourcing systems

**When NOT to use:**
- Simple CRUD applications
- Low traffic systems
- Teams unfamiliar with pattern

**Trade-offs:**
- ✓ Optimized read models
- ✓ Independent scaling
- ✗ Eventual consistency
- ✗ Increased complexity`
      },
      { 
        id: 40, 
        text: "What considerations are important when designing microservices?", 
        difficulty: "Hard",
        answer: `**Microservices Design Principles:**

**1. Single Responsibility**
\`\`\`
✓ Order Service: Order lifecycle only
✗ Order Service: Orders + Users + Payments
\`\`\`

**2. Data Ownership**
\`\`\`
Each service owns its data
No shared databases
Communicate via APIs/events
\`\`\`

**3. API Design**
\`\`\`javascript
// Versioned, consistent APIs
GET /api/v1/orders/{id}
POST /api/v1/orders

// Use events for async communication
OrderCreated, PaymentCompleted, ShipmentSent
\`\`\`

**4. Failure Handling**
\`\`\`javascript
// Circuit breaker
// Timeouts
// Retry with backoff
// Fallbacks
\`\`\`

**5. Observability**
- Distributed tracing (correlation IDs)
- Centralized logging
- Metrics per service

**6. Deployment Independence**
\`\`\`yaml
# Each service independently deployable
services:
  order-service:
    image: orders:v2.1
  user-service:
    image: users:v1.5
\`\`\`

**Key Considerations:**
| Aspect | Approach |
|--------|----------|
| Communication | Sync (REST/gRPC) vs Async (events) |
| Discovery | DNS, Consul, Kubernetes |
| Security | mTLS, service mesh |
| Testing | Contract tests, E2E |

**Anti-patterns:**
- Distributed monolith
- Shared databases
- Tight coupling via sync calls
- No monitoring`
      },
      { 
        id: 41, 
        text: "How would you secure communication between microservices?", 
        difficulty: "Hard",
        answer: `**Service-to-Service Security:**

**1. Mutual TLS (mTLS)**
\`\`\`
Service A ←──TLS Certificate──► Service B
Both verify each other's identity
\`\`\`

\`\`\`yaml
# Istio service mesh auto-mTLS
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
spec:
  mtls:
    mode: STRICT
\`\`\`

**2. Service Mesh**
\`\`\`
Sidecar Proxy ↔ Sidecar Proxy
(Envoy)          (Envoy)
Handles: TLS, Auth, Observability
\`\`\`

**3. JWT Token Propagation**
\`\`\`javascript
// Gateway validates user JWT
// Services pass service-to-service JWT
const serviceToken = jwt.sign(
  { service: 'order-service', permissions: ['user:read'] },
  serviceSecret
);

axios.get('http://user-service/users/123', {
  headers: { Authorization: \`Bearer \${serviceToken}\` }
});
\`\`\`

**4. API Keys / Secrets**
\`\`\`javascript
// Service-specific API keys
// Rotated regularly
// Stored in secret manager
\`\`\`

**5. Network Policies (Kubernetes)**
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
spec:
  podSelector:
    matchLabels:
      app: database
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend
\`\`\`

**Checklist:**
- [ ] Encrypt all traffic (TLS)
- [ ] Authenticate services
- [ ] Authorize by least privilege
- [ ] Audit all access
- [ ] Rotate credentials`
      },
      { 
        id: 42, 
        text: "What is database sharding and when would you use it?", 
        difficulty: "Hard",
        answer: `**Sharding** horizontally partitions data across multiple databases.

**How it works:**
\`\`\`
              ┌─► Shard 1 (Users A-H)
User Request ─┼─► Shard 2 (Users I-P)
              └─► Shard 3 (Users Q-Z)
\`\`\`

**Sharding Strategies:**

**1. Range-based**
\`\`\`
Users 1-1M → Shard 1
Users 1M-2M → Shard 2
\`\`\`

**2. Hash-based**
\`\`\`javascript
const shardId = hash(userId) % numShards;
\`\`\`

**3. Directory-based**
\`\`\`sql
-- Lookup table maps key to shard
SELECT shard_id FROM shard_directory WHERE user_id = 123;
\`\`\`

**Implementation:**
\`\`\`javascript
class ShardRouter {
  getShard(userId) {
    const shardId = userId % this.shards.length;
    return this.shards[shardId];
  }
  
  async getUser(userId) {
    const shard = this.getShard(userId);
    return shard.query('SELECT * FROM users WHERE id = $1', [userId]);
  }
}
\`\`\`

**Challenges:**
| Challenge | Solution |
|-----------|----------|
| Cross-shard queries | Avoid or aggregate layer |
| Rebalancing | Consistent hashing |
| Transactions | Saga pattern |
| Joins | Denormalization |

**When to shard:**
- Single database can't handle load
- Data size exceeds single server
- Geographic distribution needed

**Alternatives first:**
- Vertical scaling
- Read replicas
- Caching`
      },
      { 
        id: 43, 
        text: "How do you implement transactional workflows spanning multiple services?", 
        difficulty: "Hard",
        answer: `**Distributed transactions** across services use patterns like Saga.

**The Problem:**
\`\`\`
Order Service → Payment Service → Inventory Service
If Inventory fails, how to rollback Payment?
\`\`\`

**Saga Pattern:**

**1. Choreography (Event-driven)**
\`\`\`
Order Created → Payment Charged → Inventory Reserved
     ←── Payment Failed (compensate) ←──
\`\`\`

**2. Orchestration (Central coordinator)**
\`\`\`javascript
class OrderSaga {
  async execute(orderData) {
    try {
      // Step 1
      const payment = await paymentService.charge(orderData);
      
      // Step 2
      const reservation = await inventoryService.reserve(orderData);
      
      // Step 3
      await orderService.confirm(orderData);
      
    } catch (error) {
      // Compensating transactions
      await this.rollback(orderData);
    }
  }
  
  async rollback(orderData) {
    await paymentService.refund(orderData);
    await inventoryService.release(orderData);
    await orderService.cancel(orderData);
  }
}
\`\`\`

**Key Principles:**
- Each step is idempotent
- Each step has a compensating action
- Persist saga state for recovery

**Alternative: Outbox Pattern**
\`\`\`sql
-- Atomic: Update + Event in same transaction
BEGIN;
  UPDATE orders SET status = 'confirmed';
  INSERT INTO outbox (event_type, payload) VALUES ('OrderConfirmed', '{}');
COMMIT;

-- Separate process publishes outbox events
\`\`\`

**Tools:**
- Temporal, Camunda (workflow orchestration)
- Kafka (event-driven sagas)`
      },
      { 
        id: 44, 
        text: "How do you handle schema migrations in production databases?", 
        difficulty: "Hard",
        answer: `**Database Migration Best Practices:**

**1. Version Control Migrations**
\`\`\`
migrations/
├── 001_create_users.sql
├── 002_add_email_column.sql
├── 003_create_orders.sql
\`\`\`

**2. Idempotent Migrations**
\`\`\`sql
-- Good: Won't fail if run twice
CREATE TABLE IF NOT EXISTS users (...);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
\`\`\`

**3. Backwards-Compatible Changes**
\`\`\`sql
-- Phase 1: Add new column (nullable)
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);

-- Phase 2: Backfill data
UPDATE users SET full_name = first_name || ' ' || last_name;

-- Phase 3: (After code deploys) Make non-null
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;

-- Phase 4: (Later) Drop old columns
ALTER TABLE users DROP COLUMN first_name, DROP COLUMN last_name;
\`\`\`

**4. Use Migration Tools**
\`\`\`javascript
// Knex.js migration
exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id');
    table.string('email').unique();
    table.timestamps();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
\`\`\`

**5. Test Migrations**
- Run against production copy
- Test rollback
- Measure execution time

**Tools:**
- Flyway, Liquibase (Java)
- Knex, Prisma (Node.js)
- Alembic (Python)
- goose (Go)`
      },
      { 
        id: 45, 
        text: "How do you ensure database migrations are zero-downtime?", 
        difficulty: "Hard",
        answer: `**Zero-Downtime Migration Strategies:**

**1. Expand-Contract Pattern**
\`\`\`
Phase 1 (Expand): Add new structure
Phase 2: Dual-write to old + new
Phase 3: Migrate reads to new
Phase 4 (Contract): Remove old structure
\`\`\`

**2. Adding Columns**
\`\`\`sql
-- ✓ Safe: Add nullable column
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- ✗ Dangerous: Add with default (locks table)
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- ✓ Safe alternative
ALTER TABLE users ADD COLUMN status VARCHAR(20);
UPDATE users SET status = 'active' WHERE status IS NULL;  -- In batches
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';
\`\`\`

**3. Renaming Columns**
\`\`\`sql
-- Don't rename directly! Use expand-contract:
-- 1. Add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);

-- 2. Update code to write both columns
-- 3. Backfill
UPDATE users SET full_name = name WHERE full_name IS NULL;

-- 4. Update code to read from new column
-- 5. Drop old column
ALTER TABLE users DROP COLUMN name;
\`\`\`

**4. Batch Updates**
\`\`\`javascript
// Process in batches to avoid locks
let lastId = 0;
while (true) {
  const result = await db.query(\`
    UPDATE users SET migrated = true
    WHERE id > $1 AND migrated = false
    ORDER BY id LIMIT 1000
  \`, [lastId]);
  
  if (result.rowCount === 0) break;
  lastId = result.rows[result.rows.length - 1].id;
  await sleep(100); // Let other queries run
}
\`\`\`

**5. Use Online Schema Tools**
- gh-ost (GitHub)
- pt-online-schema-change (Percona)`
      },
      { 
        id: 46, 
        text: "What is event sourcing and how does it differ from CRUD?", 
        difficulty: "Hard",
        answer: `**Event Sourcing** stores state changes as a sequence of events instead of current state.

**CRUD Approach:**
\`\`\`sql
-- Current state only
UPDATE accounts SET balance = 150 WHERE id = 1;
-- History lost!
\`\`\`

**Event Sourcing:**
\`\`\`javascript
// Store all events
events = [
  { type: 'AccountCreated', balance: 0 },
  { type: 'MoneyDeposited', amount: 200 },
  { type: 'MoneyWithdrawn', amount: 50 },
]
// Current state: rebuild from events → balance: 150
\`\`\`

**Implementation:**
\`\`\`javascript
class Account {
  constructor(id) {
    this.id = id;
    this.balance = 0;
    this.events = [];
  }
  
  apply(event) {
    switch (event.type) {
      case 'MoneyDeposited':
        this.balance += event.amount;
        break;
      case 'MoneyWithdrawn':
        this.balance -= event.amount;
        break;
    }
  }
  
  deposit(amount) {
    const event = { type: 'MoneyDeposited', amount, timestamp: Date.now() };
    this.events.push(event);
    this.apply(event);
  }
  
  static fromEvents(events) {
    const account = new Account();
    events.forEach(e => account.apply(e));
    return account;
  }
}
\`\`\`

**Benefits:**
- Complete audit trail
- Time travel (rebuild state at any point)
- Debug by replaying events
- Easy analytics

**Challenges:**
- Event schema evolution
- Performance (snapshotting helps)
- Complexity

**When to use:**
- Audit requirements
- Complex domain logic
- Need to answer "how did we get here?"`
      },
      { 
        id: 47, 
        text: "Describe how OAuth2 authorization flows work.", 
        difficulty: "Hard",
        answer: `**OAuth2** is an authorization framework for delegated access.

**Roles:**
- **Resource Owner**: User
- **Client**: Your app
- **Authorization Server**: Issues tokens (Google, Auth0)
- **Resource Server**: API with protected data

**1. Authorization Code Flow (Most Secure)**
\`\`\`
User → App: "Login with Google"
App → Google: Redirect to authorize?client_id=X&redirect_uri=Y&scope=email
User → Google: Login & consent
Google → App: Redirect to Y?code=ABC
App → Google: POST /token (code=ABC, client_secret=Z)
Google → App: access_token, refresh_token
App → Google API: GET /userinfo (Authorization: Bearer access_token)
\`\`\`

**2. PKCE (for Public Clients)**
\`\`\`javascript
// Generate code verifier and challenge
const verifier = randomString(64);
const challenge = base64url(sha256(verifier));

// Send challenge in authorize request
// Send verifier in token request (no client_secret needed)
\`\`\`

**3. Client Credentials (Service-to-Service)**
\`\`\`bash
POST /token
grant_type=client_credentials
&client_id=X
&client_secret=Y
&scope=read:data
\`\`\`

**Token Types:**
| Token | Purpose | Lifetime |
|-------|---------|----------|
| Access Token | API access | Short (15min-1hr) |
| Refresh Token | Get new access tokens | Long (days-months) |
| ID Token | User identity (OIDC) | Short |

**Security:**
- Always use HTTPS
- Validate redirect URIs
- Use PKCE for mobile/SPA
- Store tokens securely`
      },
      { 
        id: 48, 
        text: "How do you implement database read replicas and sync strategies?", 
        difficulty: "Hard",
        answer: `**Read Replicas** distribute read load across multiple database copies.

**Architecture:**
\`\`\`
Writes → Primary DB ──sync──► Replica 1
                           ──► Replica 2
Reads  ────────────────────► Replica 1/2
\`\`\`

**Replication Strategies:**

**1. Synchronous Replication**
\`\`\`
Write to Primary → Wait for Replica ACK → Confirm to client
✓ Strong consistency
✗ Higher latency
\`\`\`

**2. Asynchronous Replication**
\`\`\`
Write to Primary → Confirm to client → Replicate later
✓ Lower latency
✗ Replica lag (eventual consistency)
\`\`\`

**Implementation:**
\`\`\`javascript
const primary = new Pool({ host: 'primary.db.com' });
const replica = new Pool({ host: 'replica.db.com' });

async function query(sql, params, options = {}) {
  const pool = options.write ? primary : replica;
  return pool.query(sql, params);
}

// Usage
await query('SELECT * FROM users WHERE id = $1', [id]); // Read from replica
await query('UPDATE users SET name = $1', [name], { write: true }); // Write to primary
\`\`\`

**Handling Replica Lag:**
\`\`\`javascript
// Read-your-writes: Use primary after write
async function updateAndRead(userId, newName) {
  await primary.query('UPDATE users SET name = $1 WHERE id = $2', [newName, userId]);
  // Read from primary to avoid stale data
  return primary.query('SELECT * FROM users WHERE id = $1', [userId]);
}
\`\`\`

**Managed Services:**
- AWS RDS Read Replicas
- Google Cloud SQL
- Azure SQL Database`
      },
      { 
        id: 49, 
        text: "How do you manage transactional integrity across NoSQL databases?", 
        difficulty: "Hard",
        answer: `**NoSQL Transaction Strategies:**

**1. Single Document Transactions**
\`\`\`javascript
// MongoDB: Atomic document operations
await db.orders.updateOne(
  { _id: orderId },
  { 
    $set: { status: 'paid' },
    $push: { payments: paymentData }
  }
);
// Entire operation is atomic
\`\`\`

**2. Multi-Document Transactions (MongoDB 4.0+)**
\`\`\`javascript
const session = client.startSession();
try {
  session.startTransaction();
  
  await orders.insertOne({ _id: orderId, ... }, { session });
  await inventory.updateOne({ _id: productId, qty: { $gte: 1 } }, 
    { $inc: { qty: -1 } }, { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
} finally {
  session.endSession();
}
\`\`\`

**3. Optimistic Concurrency**
\`\`\`javascript
// Version field prevents lost updates
const doc = await db.findOne({ _id: id });
const result = await db.updateOne(
  { _id: id, version: doc.version },
  { $set: { data: newData }, $inc: { version: 1 } }
);

if (result.modifiedCount === 0) {
  throw new Error('Conflict - document was modified');
}
\`\`\`

**4. Two-Phase Commit (Manual)**
\`\`\`javascript
// Phase 1: Prepare
await order.update({ status: 'pending' });
await payment.update({ status: 'pending' });

// Phase 2: Commit
await order.update({ status: 'confirmed' });
await payment.update({ status: 'confirmed' });

// Rollback on failure
\`\`\`

**5. Saga Pattern**
See previous answer on distributed transactions.

**Best Practices:**
- Design for single-document operations when possible
- Use idempotent operations
- Implement compensating transactions
- Accept eventual consistency where appropriate`
      },
      { 
        id: 50, 
        text: "What is service mesh and when would you use it?", 
        difficulty: "Hard",
        answer: `**Service Mesh** is a dedicated infrastructure layer for service-to-service communication.

**Architecture:**
\`\`\`
┌─────────────────┐   ┌─────────────────┐
│   Service A     │   │   Service B     │
│  ┌───────────┐  │   │  ┌───────────┐  │
│  │ App Code  │  │   │  │ App Code  │  │
│  └─────┬─────┘  │   │  └─────┬─────┘  │
│  ┌─────▼─────┐  │   │  ┌─────▼─────┐  │
│  │  Sidecar  │◄─┼───┼──►  Sidecar  │  │
│  │  (Envoy)  │  │   │  │  (Envoy)  │  │
│  └───────────┘  │   │  └───────────┘  │
└─────────────────┘   └─────────────────┘
         │                    │
         └────── Control Plane (Istio) ──────┘
\`\`\`

**Features:**

**1. Traffic Management**
\`\`\`yaml
# Canary deployment
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
spec:
  http:
  - route:
    - destination:
        host: reviews
        subset: v1
      weight: 90
    - destination:
        host: reviews
        subset: v2
      weight: 10
\`\`\`

**2. Security (mTLS)**
**3. Observability (Traces, Metrics)**
**4. Resilience (Retries, Timeouts, Circuit Breaking)**

**Popular Service Meshes:**
| Mesh | Notes |
|------|-------|
| Istio | Feature-rich, complex |
| Linkerd | Lightweight, simple |
| Consul Connect | HashiCorp ecosystem |

**When to use:**
- 10+ microservices
- Need consistent security policies
- Complex traffic routing
- Require detailed observability

**When NOT to use:**
- Few services
- Simple deployment needs
- Team lacks Kubernetes expertise
- Performance overhead concerns`
      },
    ],
    "dsa-questions": [
      { 
        id: 1, 
        text: "Implement a function to reverse a linked list.", 
        difficulty: "Easy",
        answer: `**Iterative Approach** (O(n) time, O(1) space):

\`\`\`javascript
function reverseList(head) {
  let prev = null;
  let current = head;
  
  while (current !== null) {
    const next = current.next; // Save next
    current.next = prev;       // Reverse pointer
    prev = current;            // Move prev forward
    current = next;            // Move current forward
  }
  
  return prev; // New head
}
\`\`\`

**Recursive Approach** (O(n) time, O(n) space):

\`\`\`javascript
function reverseListRecursive(head) {
  if (head === null || head.next === null) {
    return head;
  }
  
  const newHead = reverseListRecursive(head.next);
  head.next.next = head;
  head.next = null;
  
  return newHead;
}
\`\`\`

**Key insight**: At each step, we reverse the pointer direction and move forward.`
      },
      { 
        id: 2, 
        text: "Find the middle element of a linked list.", 
        difficulty: "Easy",
        answer: `Use the **slow and fast pointer** technique (Floyd's Tortoise and Hare).

\`\`\`javascript
function findMiddle(head) {
  let slow = head;
  let fast = head;
  
  while (fast !== null && fast.next !== null) {
    slow = slow.next;        // Move 1 step
    fast = fast.next.next;   // Move 2 steps
  }
  
  return slow; // Middle element
}
\`\`\`

**How it works:**
- Fast pointer moves 2x speed of slow
- When fast reaches end, slow is at middle
- Works for both odd and even length lists

**Time:** O(n) | **Space:** O(1)

**For even length lists:**
- Returns second middle element
- Modify condition for first middle if needed`
      },
      { 
        id: 3, 
        text: "Check if a string is a palindrome.", 
        difficulty: "Easy",
        answer: `**Two Pointer Approach** (O(n) time, O(1) space):

\`\`\`javascript
function isPalindrome(str) {
  // Clean string: lowercase, alphanumeric only
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let left = 0;
  let right = cleaned.length - 1;
  
  while (left < right) {
    if (cleaned[left] !== cleaned[right]) {
      return false;
    }
    left++;
    right--;
  }
  
  return true;
}
\`\`\`

**Examples:**
- \`"racecar"\` → true
- \`"A man, a plan, a canal: Panama"\` → true
- \`"hello"\` → false

**One-liner (less efficient):**
\`\`\`javascript
const isPalindrome = s => {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean === clean.split('').reverse().join('');
};
\`\`\``
      },
      { 
        id: 4, 
        text: "Implement binary search on a sorted array.", 
        difficulty: "Easy",
        answer: `Binary search halves the search space each iteration.

\`\`\`javascript
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
      return mid;        // Found!
    } else if (arr[mid] < target) {
      left = mid + 1;    // Search right half
    } else {
      right = mid - 1;   // Search left half
    }
  }
  
  return -1; // Not found
}
\`\`\`

**Recursive version:**
\`\`\`javascript
function binarySearchRecursive(arr, target, left = 0, right = arr.length - 1) {
  if (left > right) return -1;
  
  const mid = Math.floor((left + right) / 2);
  
  if (arr[mid] === target) return mid;
  if (arr[mid] < target) {
    return binarySearchRecursive(arr, target, mid + 1, right);
  }
  return binarySearchRecursive(arr, target, left, mid - 1);
}
\`\`\`

**Time:** O(log n) | **Space:** O(1) iterative, O(log n) recursive

**Common pitfall:** Integer overflow with \`(left + right) / 2\`
**Fix:** \`left + Math.floor((right - left) / 2)\``
      },
      { 
        id: 5, 
        text: "Find the maximum element in an array.", 
        difficulty: "Easy",
        answer: `**Find Maximum Element:**

**Iterative Approach (O(n)):**
\`\`\`javascript
function findMax(arr) {
  if (arr.length === 0) return undefined;
  
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}
\`\`\`

**Using Math.max:**
\`\`\`javascript
const max = Math.max(...arr);
// Caution: Can cause stack overflow for very large arrays
\`\`\`

**Using reduce:**
\`\`\`javascript
const max = arr.reduce((a, b) => a > b ? a : b);
\`\`\`

**Time:** O(n) | **Space:** O(1)

**Related:** Find min and max simultaneously:
\`\`\`javascript
function findMinMax(arr) {
  let min = arr[0], max = arr[0];
  for (const num of arr) {
    if (num < min) min = num;
    if (num > max) max = num;
  }
  return { min, max };
}
\`\`\``
      },
      { 
        id: 6, 
        text: "Implement a stack using arrays.", 
        difficulty: "Easy",
        answer: `**Stack** = LIFO (Last In, First Out) data structure.

\`\`\`javascript
class Stack {
  constructor() {
    this.items = [];
  }
  
  // Add to top - O(1)
  push(element) {
    this.items.push(element);
  }
  
  // Remove from top - O(1)
  pop() {
    if (this.isEmpty()) {
      throw new Error('Stack is empty');
    }
    return this.items.pop();
  }
  
  // View top element - O(1)
  peek() {
    if (this.isEmpty()) return undefined;
    return this.items[this.items.length - 1];
  }
  
  // Check if empty - O(1)
  isEmpty() {
    return this.items.length === 0;
  }
  
  // Get size - O(1)
  size() {
    return this.items.length;
  }
  
  // Clear stack - O(1)
  clear() {
    this.items = [];
  }
}

// Usage
const stack = new Stack();
stack.push(1);
stack.push(2);
stack.push(3);
console.log(stack.pop());  // 3
console.log(stack.peek()); // 2
\`\`\`

**Use Cases:**
- Undo/Redo operations
- Browser history
- Expression evaluation
- Function call stack`
      },
      { 
        id: 7, 
        text: "Check if parentheses are balanced.", 
        difficulty: "Easy",
        answer: `Use a stack to match opening and closing brackets.

\`\`\`javascript
function isBalanced(str) {
  const stack = [];
  const pairs = {
    ')': '(',
    '}': '{',
    ']': '['
  };
  
  for (const char of str) {
    if ('({['.includes(char)) {
      stack.push(char);
    } else if (')}]'.includes(char)) {
      if (stack.length === 0 || stack.pop() !== pairs[char]) {
        return false;
      }
    }
  }
  
  return stack.length === 0;
}
\`\`\`

**Examples:**
- \`"(){}[]"\` → true
- \`"([{}])"\` → true
- \`"([)]"\` → false
- \`"((("\` → false

**Time:** O(n) | **Space:** O(n)

**Key insight:** Every closing bracket must match the most recent opening bracket (LIFO = Stack).`
      },
      { 
        id: 8, 
        text: "Find the first non-repeating character in a string.", 
        difficulty: "Easy",
        answer: `**Using Hash Map (O(n)):**

\`\`\`javascript
function firstNonRepeating(str) {
  const count = new Map();
  
  // Count occurrences
  for (const char of str) {
    count.set(char, (count.get(char) || 0) + 1);
  }
  
  // Find first with count 1
  for (const char of str) {
    if (count.get(char) === 1) {
      return char;
    }
  }
  
  return null; // No non-repeating character
}

// Examples
firstNonRepeating("leetcode"); // "l"
firstNonRepeating("aabbcc");   // null
\`\`\`

**One-liner:**
\`\`\`javascript
const firstUnique = str => 
  [...str].find(c => str.indexOf(c) === str.lastIndexOf(c));
\`\`\`

**Time:** O(n) | **Space:** O(k) where k = unique characters`
      },
      { 
        id: 9, 
        text: "Merge two sorted arrays.", 
        difficulty: "Easy",
        answer: `**Two Pointer Approach (O(n+m)):**

\`\`\`javascript
function mergeSorted(arr1, arr2) {
  const result = [];
  let i = 0, j = 0;
  
  while (i < arr1.length && j < arr2.length) {
    if (arr1[i] <= arr2[j]) {
      result.push(arr1[i]);
      i++;
    } else {
      result.push(arr2[j]);
      j++;
    }
  }
  
  // Add remaining elements
  while (i < arr1.length) result.push(arr1[i++]);
  while (j < arr2.length) result.push(arr2[j++]);
  
  return result;
}

// Example
mergeSorted([1, 3, 5], [2, 4, 6]); // [1, 2, 3, 4, 5, 6]
\`\`\`

**In-place merge (for merge sort):**
\`\`\`javascript
function mergeInPlace(arr, left, mid, right) {
  const temp = [];
  let i = left, j = mid + 1;
  
  while (i <= mid && j <= right) {
    if (arr[i] <= arr[j]) temp.push(arr[i++]);
    else temp.push(arr[j++]);
  }
  
  while (i <= mid) temp.push(arr[i++]);
  while (j <= right) temp.push(arr[j++]);
  
  for (let k = 0; k < temp.length; k++) {
    arr[left + k] = temp[k];
  }
}
\`\`\`

**Time:** O(n+m) | **Space:** O(n+m)`
      },
      { 
        id: 10, 
        text: "Count occurrences of an element in an array.", 
        difficulty: "Easy",
        answer: `**Multiple Approaches:**

**1. Using reduce:**
\`\`\`javascript
const count = (arr, target) => 
  arr.reduce((acc, val) => val === target ? acc + 1 : acc, 0);
\`\`\`

**2. Using filter:**
\`\`\`javascript
const count = (arr, target) => 
  arr.filter(x => x === target).length;
\`\`\`

**3. Using loop:**
\`\`\`javascript
function count(arr, target) {
  let count = 0;
  for (const item of arr) {
    if (item === target) count++;
  }
  return count;
}
\`\`\`

**4. For sorted array (Binary Search):**
\`\`\`javascript
function countSorted(arr, target) {
  const firstIndex = findFirst(arr, target);
  if (firstIndex === -1) return 0;
  const lastIndex = findLast(arr, target);
  return lastIndex - firstIndex + 1;
}
\`\`\`

**Count all occurrences:**
\`\`\`javascript
function countAll(arr) {
  const counts = {};
  for (const item of arr) {
    counts[item] = (counts[item] || 0) + 1;
  }
  return counts;
}
// countAll([1,2,2,3]) → {1: 1, 2: 2, 3: 1}
\`\`\`

**Time:** O(n) for unsorted, O(log n) for sorted`
      },
      { 
        id: 11, 
        text: "Implement LRU Cache.", 
        difficulty: "Medium",
        answer: `LRU (Least Recently Used) Cache evicts the least recently accessed item when capacity is exceeded.

**Data Structures:**
- **HashMap**: O(1) lookup by key
- **Doubly Linked List**: O(1) removal and insertion for ordering

\`\`\`javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Maintains insertion order in JS
  }
  
  get(key) {
    if (!this.cache.has(key)) return -1;
    
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  
  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    this.cache.set(key, value);
    
    // Evict LRU if over capacity
    if (this.cache.size > this.capacity) {
      const lruKey = this.cache.keys().next().value;
      this.cache.delete(lruKey);
    }
  }
}
\`\`\`

**Time Complexity**: O(1) for both get and put operations.`
      },
      { 
        id: 12, 
        text: "Find the longest substring without repeating characters.", 
        difficulty: "Medium",
        answer: `Use **sliding window** with a set/map to track characters.

\`\`\`javascript
function lengthOfLongestSubstring(s) {
  const seen = new Map();
  let maxLen = 0;
  let start = 0;
  
  for (let end = 0; end < s.length; end++) {
    const char = s[end];
    
    if (seen.has(char) && seen.get(char) >= start) {
      // Move start past the duplicate
      start = seen.get(char) + 1;
    }
    
    seen.set(char, end);
    maxLen = Math.max(maxLen, end - start + 1);
  }
  
  return maxLen;
}
\`\`\`

**Example walkthrough for "abcabcbb":**
| end | char | start | window | maxLen |
|-----|------|-------|--------|--------|
| 0 | a | 0 | "a" | 1 |
| 1 | b | 0 | "ab" | 2 |
| 2 | c | 0 | "abc" | 3 |
| 3 | a | 1 | "bca" | 3 |
| 4 | b | 2 | "cab" | 3 |

**Time:** O(n) | **Space:** O(min(n, alphabet size))`
      },
      { 
        id: 13, 
        text: "Detect a cycle in a linked list.", 
        difficulty: "Medium",
        answer: `**Floyd's Cycle Detection** (Tortoise and Hare):

\`\`\`javascript
function hasCycle(head) {
  if (!head || !head.next) return false;
  
  let slow = head;
  let fast = head;
  
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    
    if (slow === fast) {
      return true; // Cycle detected!
    }
  }
  
  return false;
}
\`\`\`

**Find cycle start (follow-up):**
\`\`\`javascript
function detectCycleStart(head) {
  let slow = head, fast = head;
  
  // Find meeting point
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) break;
  }
  
  if (!fast || !fast.next) return null;
  
  // Find cycle start
  slow = head;
  while (slow !== fast) {
    slow = slow.next;
    fast = fast.next;
  }
  
  return slow; // Cycle start node
}
\`\`\`

**Why it works:** Mathematical proof shows they meet after the slow pointer enters the cycle.

**Time:** O(n) | **Space:** O(1)`
      },
      { 
        id: 14, 
        text: "Implement BFS and DFS for a graph.", 
        difficulty: "Medium",
        answer: `**Graph Traversal Algorithms:**

**BFS (Breadth-First Search):**
\`\`\`javascript
function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];
  const result = [];
  
  while (queue.length > 0) {
    const node = queue.shift();
    
    if (visited.has(node)) continue;
    visited.add(node);
    result.push(node);
    
    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }
  
  return result;
}
\`\`\`

**DFS (Depth-First Search):**
\`\`\`javascript
function dfs(graph, start) {
  const visited = new Set();
  const result = [];
  
  function explore(node) {
    if (visited.has(node)) return;
    visited.add(node);
    result.push(node);
    
    for (const neighbor of graph[node] || []) {
      explore(neighbor);
    }
  }
  
  explore(start);
  return result;
}

// Iterative DFS (using stack)
function dfsIterative(graph, start) {
  const visited = new Set();
  const stack = [start];
  const result = [];
  
  while (stack.length > 0) {
    const node = stack.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    result.push(node);
    
    for (const neighbor of graph[node] || []) {
      stack.push(neighbor);
    }
  }
  return result;
}
\`\`\`

**Use Cases:**
- BFS: Shortest path (unweighted), level-order
- DFS: Topological sort, cycle detection`
      },
      { 
        id: 15, 
        text: "Find the kth largest element in an array.", 
        difficulty: "Medium",
        answer: `**Multiple Approaches:**

**1. Sort (O(n log n)):**
\`\`\`javascript
function kthLargest(arr, k) {
  return arr.sort((a, b) => b - a)[k - 1];
}
\`\`\`

**2. Min Heap (O(n log k)):**
\`\`\`javascript
function kthLargest(arr, k) {
  const minHeap = new MinPriorityQueue();
  
  for (const num of arr) {
    minHeap.enqueue(num);
    if (minHeap.size() > k) {
      minHeap.dequeue();
    }
  }
  
  return minHeap.front().element;
}
\`\`\`

**3. QuickSelect (O(n) average):**
\`\`\`javascript
function quickSelect(arr, k) {
  const target = arr.length - k; // kth largest = (n-k)th smallest
  
  function partition(left, right) {
    const pivot = arr[right];
    let i = left;
    
    for (let j = left; j < right; j++) {
      if (arr[j] <= pivot) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        i++;
      }
    }
    [arr[i], arr[right]] = [arr[right], arr[i]];
    return i;
  }
  
  function select(left, right) {
    const pivotIndex = partition(left, right);
    
    if (pivotIndex === target) return arr[pivotIndex];
    if (pivotIndex < target) return select(pivotIndex + 1, right);
    return select(left, pivotIndex - 1);
  }
  
  return select(0, arr.length - 1);
}
\`\`\`

**Time Complexity:**
- Sort: O(n log n)
- Heap: O(n log k)
- QuickSelect: O(n) average, O(n²) worst`
      },
      { 
        id: 16, 
        text: "Implement a min heap.", 
        difficulty: "Medium",
        answer: `**Min Heap** = Complete binary tree where parent ≤ children.

\`\`\`javascript
class MinHeap {
  constructor() {
    this.heap = [];
  }
  
  parent(i) { return Math.floor((i - 1) / 2); }
  leftChild(i) { return 2 * i + 1; }
  rightChild(i) { return 2 * i + 2; }
  
  swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }
  
  // Add element - O(log n)
  insert(value) {
    this.heap.push(value);
    this.bubbleUp(this.heap.length - 1);
  }
  
  bubbleUp(index) {
    while (index > 0 && this.heap[this.parent(index)] > this.heap[index]) {
      this.swap(index, this.parent(index));
      index = this.parent(index);
    }
  }
  
  // Remove minimum - O(log n)
  extractMin() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();
    
    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown(0);
    return min;
  }
  
  bubbleDown(index) {
    let smallest = index;
    const left = this.leftChild(index);
    const right = this.rightChild(index);
    
    if (left < this.heap.length && this.heap[left] < this.heap[smallest]) {
      smallest = left;
    }
    if (right < this.heap.length && this.heap[right] < this.heap[smallest]) {
      smallest = right;
    }
    
    if (smallest !== index) {
      this.swap(index, smallest);
      this.bubbleDown(smallest);
    }
  }
  
  peek() { return this.heap[0]; }
  size() { return this.heap.length; }
}
\`\`\`

**Use Cases:** Priority queues, Dijkstra's, heap sort`
      },
      { 
        id: 17, 
        text: "Solve the two sum problem.", 
        difficulty: "Medium",
        answer: `Find two numbers that add up to target.

**Hash Map Approach** (O(n) time):
\`\`\`javascript
function twoSum(nums, target) {
  const seen = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    
    seen.set(nums[i], i);
  }
  
  return []; // No solution
}
\`\`\`

**Example:** \`twoSum([2, 7, 11, 15], 9)\` → \`[0, 1]\`

| i | nums[i] | complement | seen | result |
|---|---------|------------|------|--------|
| 0 | 2 | 7 | {2:0} | - |
| 1 | 7 | 2 | {2:0} | [0,1] ✓ |

**Two Pointer (if sorted):**
\`\`\`javascript
function twoSumSorted(nums, target) {
  let left = 0, right = nums.length - 1;
  
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
}
\`\`\`

**Time:** O(n) hash, O(n log n) two-pointer (with sort)`
      },
      { 
        id: 18, 
        text: "Find all permutations of a string.", 
        difficulty: "Medium",
        answer: `**Backtracking Approach:**

\`\`\`javascript
function permutations(str) {
  const result = [];
  const chars = str.split('');
  
  function backtrack(start) {
    if (start === chars.length) {
      result.push(chars.join(''));
      return;
    }
    
    for (let i = start; i < chars.length; i++) {
      // Swap
      [chars[start], chars[i]] = [chars[i], chars[start]];
      
      // Recurse
      backtrack(start + 1);
      
      // Backtrack (undo swap)
      [chars[start], chars[i]] = [chars[i], chars[start]];
    }
  }
  
  backtrack(0);
  return result;
}

// permutations("abc") → ["abc", "acb", "bac", "bca", "cab", "cba"]
\`\`\`

**With duplicates handling:**
\`\`\`javascript
function uniquePermutations(str) {
  const result = [];
  const chars = str.split('').sort();
  const used = new Array(chars.length).fill(false);
  
  function backtrack(current) {
    if (current.length === chars.length) {
      result.push(current);
      return;
    }
    
    for (let i = 0; i < chars.length; i++) {
      if (used[i]) continue;
      if (i > 0 && chars[i] === chars[i-1] && !used[i-1]) continue;
      
      used[i] = true;
      backtrack(current + chars[i]);
      used[i] = false;
    }
  }
  
  backtrack('');
  return result;
}
\`\`\`

**Time:** O(n! × n) | **Space:** O(n)`
      },
      { 
        id: 19, 
        text: "Implement quicksort algorithm.", 
        difficulty: "Medium",
        answer: `**QuickSort** - Divide and conquer sorting algorithm.

\`\`\`javascript
function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high]; // Choose last element as pivot
  let i = low - 1;
  
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}
\`\`\`

**With random pivot (better average case):**
\`\`\`javascript
function partitionRandom(arr, low, high) {
  const randomIndex = Math.floor(Math.random() * (high - low + 1)) + low;
  [arr[randomIndex], arr[high]] = [arr[high], arr[randomIndex]];
  return partition(arr, low, high);
}
\`\`\`

**Complexity:**
| Case | Time | Space |
|------|------|-------|
| Best | O(n log n) | O(log n) |
| Average | O(n log n) | O(log n) |
| Worst | O(n²) | O(n) |

**Worst case:** Already sorted array with bad pivot selection`
      },
      { 
        id: 20, 
        text: "Find the longest common subsequence.", 
        difficulty: "Medium",
        answer: `**LCS** - Classic dynamic programming problem.

\`\`\`javascript
function longestCommonSubsequence(text1, text2) {
  const m = text1.length;
  const n = text2.length;
  
  // Create DP table
  const dp = Array(m + 1).fill(null)
    .map(() => Array(n + 1).fill(0));
  
  // Fill table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

// Get the actual subsequence:
function getLCS(text1, text2) {
  // ... build dp table first ...
  
  let lcs = '';
  let i = m, j = n;
  
  while (i > 0 && j > 0) {
    if (text1[i - 1] === text2[j - 1]) {
      lcs = text1[i - 1] + lcs;
      i--; j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs;
}
\`\`\`

**Example:**
\`\`\`
text1 = "ABCDGH"
text2 = "AEDFHR"
LCS = "ADH" (length 3)
\`\`\`

**Time:** O(m × n) | **Space:** O(m × n)`
      },
      { 
        id: 21, 
        text: "Implement Dijkstra's shortest path algorithm.", 
        difficulty: "Hard",
        answer: `**Dijkstra's Algorithm** finds shortest paths in weighted graphs.

\`\`\`javascript
function dijkstra(graph, start) {
  const distances = {};
  const visited = new Set();
  const pq = new MinPriorityQueue({ priority: x => x.distance });
  
  // Initialize distances
  for (const node in graph) {
    distances[node] = Infinity;
  }
  distances[start] = 0;
  
  pq.enqueue({ node: start, distance: 0 });
  
  while (!pq.isEmpty()) {
    const { node } = pq.dequeue().element;
    
    if (visited.has(node)) continue;
    visited.add(node);
    
    for (const [neighbor, weight] of Object.entries(graph[node] || {})) {
      const newDist = distances[node] + weight;
      
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        pq.enqueue({ node: neighbor, distance: newDist });
      }
    }
  }
  
  return distances;
}

// Graph representation
const graph = {
  A: { B: 4, C: 2 },
  B: { C: 1, D: 5 },
  C: { B: 1, D: 8 },
  D: {}
};

dijkstra(graph, 'A'); // { A: 0, B: 3, C: 2, D: 8 }
\`\`\`

**Limitations:**
- No negative weights (use Bellman-Ford)
- Single source shortest path

**Time:** O((V + E) log V) with min-heap`
      },
      { 
        id: 22, 
        text: "Solve the N-Queens problem.", 
        difficulty: "Hard",
        answer: `**N-Queens** - Place N queens on N×N board with no attacks.

\`\`\`javascript
function solveNQueens(n) {
  const result = [];
  const board = Array(n).fill(null).map(() => Array(n).fill('.'));
  
  function isValid(row, col) {
    // Check column
    for (let i = 0; i < row; i++) {
      if (board[i][col] === 'Q') return false;
    }
    
    // Check diagonal (upper-left)
    for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j] === 'Q') return false;
    }
    
    // Check anti-diagonal (upper-right)
    for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
      if (board[i][j] === 'Q') return false;
    }
    
    return true;
  }
  
  function backtrack(row) {
    if (row === n) {
      result.push(board.map(r => r.join('')));
      return;
    }
    
    for (let col = 0; col < n; col++) {
      if (isValid(row, col)) {
        board[row][col] = 'Q';
        backtrack(row + 1);
        board[row][col] = '.'; // Backtrack
      }
    }
  }
  
  backtrack(0);
  return result;
}
\`\`\`

**Optimized with sets:**
\`\`\`javascript
const cols = new Set();
const diag1 = new Set(); // row - col
const diag2 = new Set(); // row + col
\`\`\`

**Time:** O(N!) | **Space:** O(N²)`
      },
      { 
        id: 23, 
        text: "Implement a trie data structure.", 
        difficulty: "Hard",
        answer: `**Trie (Prefix Tree)** - Efficient string storage and lookup.

\`\`\`javascript
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }
  
  // Insert word - O(m)
  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
  }
  
  // Search exact word - O(m)
  search(word) {
    const node = this.traverse(word);
    return node !== null && node.isEndOfWord;
  }
  
  // Check prefix exists - O(m)
  startsWith(prefix) {
    return this.traverse(prefix) !== null;
  }
  
  traverse(str) {
    let node = this.root;
    for (const char of str) {
      if (!node.children[char]) return null;
      node = node.children[char];
    }
    return node;
  }
  
  // Get all words with prefix
  autocomplete(prefix) {
    const results = [];
    const node = this.traverse(prefix);
    if (!node) return results;
    
    function dfs(node, path) {
      if (node.isEndOfWord) results.push(path);
      for (const [char, child] of Object.entries(node.children)) {
        dfs(child, path + char);
      }
    }
    
    dfs(node, prefix);
    return results;
  }
}
\`\`\`

**Use Cases:** Autocomplete, spell checker, IP routing`
      },
      { 
        id: 24, 
        text: "Find the longest palindromic substring.", 
        difficulty: "Hard",
        answer: `**Expand Around Center Approach (O(n²)):**

\`\`\`javascript
function longestPalindrome(s) {
  if (s.length < 2) return s;
  
  let start = 0, maxLen = 1;
  
  function expandAroundCenter(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    return right - left - 1; // Length of palindrome
  }
  
  for (let i = 0; i < s.length; i++) {
    // Odd length palindrome
    const len1 = expandAroundCenter(i, i);
    // Even length palindrome
    const len2 = expandAroundCenter(i, i + 1);
    
    const len = Math.max(len1, len2);
    if (len > maxLen) {
      maxLen = len;
      start = i - Math.floor((len - 1) / 2);
    }
  }
  
  return s.substring(start, start + maxLen);
}
\`\`\`

**DP Approach:**
\`\`\`javascript
function longestPalindromeDP(s) {
  const n = s.length;
  const dp = Array(n).fill(null).map(() => Array(n).fill(false));
  let start = 0, maxLen = 1;
  
  // All single chars are palindromes
  for (let i = 0; i < n; i++) dp[i][i] = true;
  
  // Check substrings of length 2 to n
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      
      if (s[i] === s[j] && (len === 2 || dp[i+1][j-1])) {
        dp[i][j] = true;
        if (len > maxLen) {
          start = i;
          maxLen = len;
        }
      }
    }
  }
  
  return s.substring(start, start + maxLen);
}
\`\`\``
      },
      { 
        id: 25, 
        text: "Solve the coin change problem using dynamic programming.", 
        difficulty: "Hard",
        answer: `**Coin Change** - Find minimum coins to make amount.

\`\`\`javascript
function coinChange(coins, amount) {
  // dp[i] = min coins needed for amount i
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] !== Infinity) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }
  
  return dp[amount] === Infinity ? -1 : dp[amount];
}

// Example
coinChange([1, 2, 5], 11); // 3 (5 + 5 + 1)
coinChange([2], 3);        // -1 (impossible)
\`\`\`

**Count ways to make change:**
\`\`\`javascript
function countWays(coins, amount) {
  const dp = new Array(amount + 1).fill(0);
  dp[0] = 1;
  
  for (const coin of coins) {
    for (let i = coin; i <= amount; i++) {
      dp[i] += dp[i - coin];
    }
  }
  
  return dp[amount];
}

countWays([1, 2, 5], 5); // 4 ways: [5], [2,2,1], [2,1,1,1], [1,1,1,1,1]
\`\`\`

**Time:** O(amount × coins) | **Space:** O(amount)`
      },
    ],
    "aptitude-questions": [
      { id: 1, text: "A train 150m long crosses a pole in 15 seconds. Find its speed.", difficulty: "Easy" },
      { id: 2, text: "If 6 men can do a work in 12 days, how many days will 9 men take?", difficulty: "Easy" },
      { id: 3, text: "Find the average of first 50 natural numbers.", difficulty: "Easy" },
      { id: 4, text: "What is 15% of 200?", difficulty: "Easy" },
      { id: 5, text: "A car travels 300km in 5 hours. Find its average speed.", difficulty: "Easy" },
      { id: 6, text: "Find the simple interest on Rs. 5000 at 10% per annum for 2 years.", difficulty: "Easy" },
      { id: 7, text: "If A:B = 2:3 and B:C = 4:5, find A:C.", difficulty: "Medium" },
      { id: 8, text: "A pipe can fill a tank in 6 hours. What part of the tank is filled in 2 hours?", difficulty: "Medium" },
      { id: 9, text: "Find the compound interest on Rs. 10000 at 5% for 2 years.", difficulty: "Medium" },
      { id: 10, text: "Two trains running at 60 km/hr and 40 km/hr cross each other in 12 seconds. Find their total length.", difficulty: "Medium" },
      { id: 11, text: "A boat goes 30km upstream in 6 hours and 40km downstream in 5 hours. Find speed of stream.", difficulty: "Hard" },
      { id: 12, text: "Find the probability of getting at least one head in 3 coin tosses.", difficulty: "Hard" },
      { id: 13, text: "In how many ways can 5 people be arranged in a row?", difficulty: "Hard" },
    ],
    "sql-questions": [
      { 
        id: 1, 
        text: "Write a query to select all columns from a table.", 
        difficulty: "Easy",
        answer: `**Basic SELECT syntax:**
\`\`\`sql
-- Select all columns
SELECT * FROM users;

-- Select specific columns (recommended)
SELECT id, name, email, created_at FROM users;

-- With table alias
SELECT u.id, u.name FROM users u;
\`\`\`

**Best Practice:** Avoid \`SELECT *\` in production:
- Fetches unnecessary data
- Breaks if columns change
- Harder to optimize

**With conditions:**
\`\`\`sql
SELECT id, name, email 
FROM users 
WHERE status = 'active'
LIMIT 100;
\`\`\``
      },
      { id: 2, text: "How do you filter rows using WHERE clause?", difficulty: "Easy" },
      { id: 3, text: "Explain the difference between WHERE and HAVING.", difficulty: "Easy" },
      { id: 4, text: "Write a query to count total rows in a table.", difficulty: "Easy" },
      { id: 5, text: "How do you sort results in ascending and descending order?", difficulty: "Easy" },
      { 
        id: 6, 
        text: "Explain different types of JOINs.", 
        difficulty: "Medium",
        answer: `**JOIN Types Visualized:**

\`\`\`sql
-- Sample tables
-- users: id, name
-- orders: id, user_id, amount
\`\`\`

**INNER JOIN** - Only matching rows from both tables
\`\`\`sql
SELECT u.name, o.amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id;
\`\`\`

**LEFT JOIN** - All from left + matching from right (NULL if no match)
\`\`\`sql
SELECT u.name, o.amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
-- Shows users even without orders
\`\`\`

**RIGHT JOIN** - All from right + matching from left
\`\`\`sql
SELECT u.name, o.amount
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;
\`\`\`

**FULL OUTER JOIN** - All rows from both tables
\`\`\`sql
SELECT u.name, o.amount
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;
\`\`\`

**CROSS JOIN** - Cartesian product (every combination)
\`\`\`sql
SELECT u.name, p.product_name
FROM users u
CROSS JOIN products p;
-- M users × N products = M×N rows
\`\`\`

**Self JOIN** - Table joined to itself
\`\`\`sql
SELECT e.name AS employee, m.name AS manager
FROM employees e
JOIN employees m ON e.manager_id = m.id;
\`\`\``
      },
      { 
        id: 7, 
        text: "Write a query to find duplicate records.", 
        difficulty: "Medium",
        answer: `**Find duplicates by column(s):**

\`\`\`sql
-- Find duplicate emails
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
\`\`\`

**Get the actual duplicate rows:**
\`\`\`sql
SELECT *
FROM users
WHERE email IN (
  SELECT email
  FROM users
  GROUP BY email
  HAVING COUNT(*) > 1
);
\`\`\`

**Using window functions (keeps all columns):**
\`\`\`sql
SELECT *
FROM (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) as rn
  FROM users
) t
WHERE rn > 1;  -- Only duplicates (not first occurrence)
\`\`\`

**Delete duplicates keeping first:**
\`\`\`sql
DELETE FROM users
WHERE id NOT IN (
  SELECT MIN(id)
  FROM users
  GROUP BY email
);
\`\`\`

**Multi-column duplicates:**
\`\`\`sql
SELECT first_name, last_name, COUNT(*)
FROM users
GROUP BY first_name, last_name
HAVING COUNT(*) > 1;
\`\`\``
      },
      { id: 8, text: "How do you use GROUP BY with aggregate functions?", difficulty: "Medium" },
      { id: 9, text: "Write a subquery to find employees earning above average.", difficulty: "Medium" },
      { id: 10, text: "Explain the difference between UNION and UNION ALL.", difficulty: "Medium" },
      { 
        id: 11, 
        text: "Write a query using window functions (ROW_NUMBER, RANK).", 
        difficulty: "Hard",
        answer: `Window functions perform calculations across rows related to current row.

**ROW_NUMBER** - Unique sequential number
\`\`\`sql
SELECT 
  name,
  department,
  salary,
  ROW_NUMBER() OVER (
    PARTITION BY department 
    ORDER BY salary DESC
  ) as rank_in_dept
FROM employees;
\`\`\`

**RANK vs DENSE_RANK**
\`\`\`sql
-- Salary: 100, 100, 80
-- RANK():       1, 1, 3  (skips 2)
-- DENSE_RANK(): 1, 1, 2  (no gaps)

SELECT 
  name,
  salary,
  RANK() OVER (ORDER BY salary DESC) as rank,
  DENSE_RANK() OVER (ORDER BY salary DESC) as dense_rank
FROM employees;
\`\`\`

**Running totals:**
\`\`\`sql
SELECT 
  date,
  amount,
  SUM(amount) OVER (ORDER BY date) as running_total,
  AVG(amount) OVER (ORDER BY date ROWS 6 PRECEDING) as moving_avg_7d
FROM sales;
\`\`\`

**Top N per group:**
\`\`\`sql
-- Top 3 salaries per department
SELECT * FROM (
  SELECT 
    *,
    ROW_NUMBER() OVER (
      PARTITION BY department 
      ORDER BY salary DESC
    ) as rn
  FROM employees
) t
WHERE rn <= 3;
\`\`\`

**LAG/LEAD - Previous/Next row:**
\`\`\`sql
SELECT 
  date,
  revenue,
  LAG(revenue, 1) OVER (ORDER BY date) as prev_day,
  revenue - LAG(revenue, 1) OVER (ORDER BY date) as daily_change
FROM sales;
\`\`\``
      },
      { id: 12, text: "How do you optimize a slow-running query?", difficulty: "Hard" },
      { id: 13, text: "Write a recursive CTE to traverse hierarchical data.", difficulty: "Hard" },
      { id: 14, text: "Explain transaction isolation levels.", difficulty: "Hard" },
      { id: 15, text: "How do you implement pagination efficiently for large datasets?", difficulty: "Hard" },
    ],
    "core-cs-questions": [
      { 
        id: 1, 
        text: "What is the difference between process and thread?", 
        difficulty: "Easy",
        answer: `**Process** = Independent program in execution with its own memory space.
**Thread** = Lightweight unit of execution within a process, sharing memory.

| Aspect | Process | Thread |
|--------|---------|--------|
| Memory | Separate address space | Shared within process |
| Creation | Expensive (fork) | Lightweight |
| Communication | IPC (pipes, sockets) | Shared memory |
| Crash impact | Isolated | Can crash entire process |
| Context switch | Slow | Fast |

**Example:**
\`\`\`
Chrome Browser (Process)
├── Tab 1 (Process) 
│   ├── Render Thread
│   ├── JavaScript Thread
│   └── Network Thread
└── Tab 2 (Process)
\`\`\`

**When to use:**
- **Processes:** Isolation needed, crash protection
- **Threads:** Shared state, performance-critical`
      },
      { 
        id: 2, 
        text: "Explain the OSI model layers.", 
        difficulty: "Easy",
        answer: `**7 Layers of OSI Model:**

| Layer | Name | Function | Protocols |
|-------|------|----------|-----------|
| 7 | Application | User interface | HTTP, FTP, SMTP |
| 6 | Presentation | Encryption, compression | SSL, JPEG |
| 5 | Session | Session management | NetBIOS |
| 4 | Transport | Reliable delivery | TCP, UDP |
| 3 | Network | Routing | IP, ICMP |
| 2 | Data Link | MAC addressing | Ethernet |
| 1 | Physical | Bits on wire | Cables, hubs |

**Memory trick:** "All People Seem To Need Data Processing" (top-down)

**TCP/IP Model (simpler, more practical):**
\`\`\`
Application  (OSI 5-7)
Transport    (OSI 4)
Internet     (OSI 3)
Network      (OSI 1-2)
\`\`\``
      },
      { 
        id: 3, 
        text: "What is virtual memory?", 
        difficulty: "Easy",
        answer: `**Virtual memory** allows programs to use more memory than physically available by using disk space.

**How it works:**
\`\`\`
Program sees: Continuous virtual address space
OS manages:   Maps virtual → physical pages
              Swaps unused pages to disk
\`\`\`

**Key concepts:**
- **Page:** Fixed-size memory block (4KB typical)
- **Page table:** Maps virtual to physical addresses
- **Page fault:** Access to page not in RAM → load from disk
- **Swap space:** Disk area for storing inactive pages

**Benefits:**
- Programs larger than RAM can run
- Memory isolation between processes
- Efficient memory utilization

**Trade-off:** Page faults cause disk I/O → performance hit (thrashing if excessive)`
      },
      { 
        id: 4, 
        text: "Explain TCP vs UDP.", 
        difficulty: "Easy",
        answer: `**TCP (Transmission Control Protocol)**
- Connection-oriented
- Reliable, ordered delivery
- Flow control, congestion control
- Higher overhead

**UDP (User Datagram Protocol)**
- Connectionless
- No reliability guarantees
- Faster, lower overhead
- "Fire and forget"

| Feature | TCP | UDP |
|---------|-----|-----|
| Connection | Required (3-way handshake) | None |
| Reliability | Guaranteed | Best effort |
| Ordering | Maintained | Not guaranteed |
| Speed | Slower | Faster |
| Header size | 20-60 bytes | 8 bytes |

**When to use:**
- **TCP:** Web, email, file transfer, APIs
- **UDP:** Gaming, video streaming, DNS, VoIP

**Real example:**
- Netflix uses TCP for control, UDP for video
- Online games: UDP for position updates, TCP for chat`
      },
      { 
        id: 5, 
        text: "What is a deadlock?", 
        difficulty: "Easy",
        answer: `**Deadlock** = Two or more processes waiting for each other indefinitely.

**Example:**
\`\`\`
Process A: Holds Lock 1, waiting for Lock 2
Process B: Holds Lock 2, waiting for Lock 1
→ Neither can proceed!
\`\`\`

**Four conditions (all required):**
1. **Mutual exclusion:** Resources can't be shared
2. **Hold and wait:** Holding one, waiting for another
3. **No preemption:** Can't force release
4. **Circular wait:** Circular chain of waiting

**Prevention strategies:**
- Request all locks at once
- Lock ordering (always acquire in same order)
- Timeouts with retry
- Deadlock detection + recovery

\`\`\`javascript
// Prevention: Lock ordering
function transfer(from, to, amount) {
  const [first, second] = from.id < to.id 
    ? [from, to] : [to, from];
  
  lock(first);
  lock(second);
  // Transfer...
  unlock(second);
  unlock(first);
}
\`\`\``
      },
      { 
        id: 6, 
        text: "Explain CPU scheduling algorithms.", 
        difficulty: "Medium",
        answer: `**CPU Schedulers** decide which process runs next.

**Algorithms:**

**1. FCFS (First Come First Served)**
- Simple queue
- Problem: Convoy effect (long job blocks short ones)

**2. SJF (Shortest Job First)**
- Optimal average wait time
- Problem: Starvation of long jobs

**3. Round Robin**
- Time slice (quantum) per process
- Fair, good for interactive systems
\`\`\`
Process A [2ms] → B [2ms] → C [2ms] → A [2ms] → ...
\`\`\`

**4. Priority Scheduling**
- Higher priority first
- Problem: Starvation (solved by aging)

**5. Multilevel Feedback Queue**
- Multiple queues with different priorities
- Processes move between queues based on behavior

**Metrics:**
- **Turnaround time:** Submission to completion
- **Wait time:** Time in ready queue
- **Response time:** First response`
      },
      { 
        id: 7, 
        text: "How does DNS resolution work?", 
        difficulty: "Medium",
        answer: `**DNS** translates domain names to IP addresses.

**Resolution flow:**
\`\`\`
Browser: "google.com" → IP?

1. Check browser cache
2. Check OS cache
3. Query local DNS resolver
4. Resolver → Root DNS server
5. Root → TLD server (.com)
6. TLD → Authoritative server (google.com)
7. Get IP address: 142.250.80.46
8. Cache result, return to browser
\`\`\`

**Record types:**
| Type | Purpose | Example |
|------|---------|---------|
| A | IPv4 address | 142.250.80.46 |
| AAAA | IPv6 address | 2607:f8b0:... |
| CNAME | Alias | www → example.com |
| MX | Mail server | mail.example.com |
| TXT | Text data | SPF, DKIM records |

**TTL (Time To Live):** How long to cache the result

\`\`\`bash
# Check DNS records
nslookup google.com
dig google.com
\`\`\``
      },
      { 
        id: 8, 
        text: "What is paging and segmentation?", 
        difficulty: "Medium",
        answer: `Memory management techniques for virtual memory.

**Paging:**
- Fixed-size blocks (pages, typically 4KB)
- Simple allocation, no external fragmentation
- May have internal fragmentation

\`\`\`
Virtual Page 0 → Physical Frame 5
Virtual Page 1 → Physical Frame 2
Virtual Page 2 → Disk (swapped out)
\`\`\`

**Segmentation:**
- Variable-size blocks based on logical units
- Code segment, data segment, stack segment
- More meaningful to programmer
- Can have external fragmentation

\`\`\`
Segment 0 (Code):    0x1000 - 0x2FFF
Segment 1 (Data):    0x3000 - 0x4FFF
Segment 2 (Stack):   0x5000 - 0x5FFF
\`\`\`

**Modern systems:** Combine both (segmented paging)
- Segments divided into pages
- Benefits of both approaches`
      },
      { 
        id: 9, 
        text: "Explain the TCP three-way handshake.", 
        difficulty: "Medium",
        answer: `**Three-way handshake** establishes TCP connection.

\`\`\`
Client                    Server
  |                          |
  |------- SYN seq=x ------->|
  |                          |
  |<-- SYN-ACK seq=y,ack=x+1-|
  |                          |
  |------ ACK ack=y+1 ------>|
  |                          |
  |====== Connected =========|
\`\`\`

**Steps:**
1. **SYN:** Client sends sequence number x
2. **SYN-ACK:** Server acknowledges x+1, sends its seq y
3. **ACK:** Client acknowledges y+1

**Why 3 steps?**
- Both sides confirm send/receive capability
- Exchange initial sequence numbers
- Prevent old duplicate connections

**Connection teardown (4-way):**
\`\`\`
FIN → ACK → FIN → ACK
\`\`\`

**Common issues:**
- SYN flood attack (DDoS)
- Half-open connections`
      },
      { 
        id: 10, 
        text: "What are the SOLID principles?", 
        difficulty: "Medium",
        answer: `**SOLID** = Five principles for maintainable OOP code.

**S - Single Responsibility**
\`\`\`javascript
// Bad: One class does everything
// Good: Separate classes for each concern
class UserRepository { /* data access only */ }
class EmailService { /* email only */ }
\`\`\`

**O - Open/Closed**
Open for extension, closed for modification.
\`\`\`javascript
// Use inheritance/composition instead of modifying
class Shape { area() {} }
class Circle extends Shape { area() { return π * r² } }
\`\`\`

**L - Liskov Substitution**
Subtypes must be substitutable for base types.
\`\`\`javascript
// Rectangle/Square problem
// If Square extends Rectangle, setWidth/setHeight breaks
\`\`\`

**I - Interface Segregation**
Many specific interfaces > one general interface.
\`\`\`javascript
// Bad: interface Worker { work(), eat() }
// Good: interface Workable { work() }
//       interface Eatable { eat() }
\`\`\`

**D - Dependency Inversion**
Depend on abstractions, not concretions.
\`\`\`javascript
class Service {
  constructor(repository) { // Inject dependency
    this.repo = repository;
  }
}
\`\`\``
      },
      { 
        id: 11, 
        text: "Explain different types of database indexes.", 
        difficulty: "Hard",
        answer: `**Database indexes** speed up queries at the cost of write performance.

**1. B-Tree Index (Default)**
\`\`\`sql
CREATE INDEX idx_email ON users(email);
-- Good for: =, <, >, BETWEEN, ORDER BY
\`\`\`

**2. Hash Index**
\`\`\`sql
CREATE INDEX idx_hash ON users USING HASH(email);
-- Good for: = only (exact match)
-- Faster than B-tree for equality
\`\`\`

**3. Composite Index**
\`\`\`sql
CREATE INDEX idx_name ON users(last_name, first_name);
-- Uses leftmost prefix
-- Works: WHERE last_name = 'Smith'
-- Works: WHERE last_name = 'Smith' AND first_name = 'John'
-- Doesn't work: WHERE first_name = 'John'
\`\`\`

**4. Partial Index**
\`\`\`sql
CREATE INDEX idx_active ON users(email) WHERE active = true;
-- Smaller index, faster for filtered queries
\`\`\`

**5. GIN/GiST (PostgreSQL)**
\`\`\`sql
CREATE INDEX idx_tags ON posts USING GIN(tags);
-- Good for: Arrays, full-text search, JSONB
\`\`\`

**When NOT to index:**
- Small tables
- Frequently updated columns
- Low cardinality columns`
      },
      { 
        id: 12, 
        text: "How does garbage collection work in different languages?", 
        difficulty: "Hard",
        answer: `**Garbage Collection** automatically frees unused memory.

**1. Reference Counting (Python, Swift)**
\`\`\`
object.ref_count++  // when referenced
object.ref_count--  // when dereferenced
if (ref_count == 0) free(object)
\`\`\`
Problem: Circular references

**2. Mark and Sweep (JavaScript)**
\`\`\`
1. Mark: Start from roots, mark reachable objects
2. Sweep: Free unmarked objects
\`\`\`

**3. Generational GC (Java, .NET)**
\`\`\`
Young Generation: Frequent, fast collection (minor GC)
Old Generation: Infrequent, slower (major GC)

Most objects die young → optimize for that
\`\`\`

**4. Concurrent/Incremental**
- Run GC alongside application
- Reduce pause times

**Manual Memory (C, C++, Rust)**
\`\`\`c
int* p = malloc(sizeof(int));
free(p);  // Must free manually
\`\`\`

**Rust:** Ownership model, no GC
\`\`\`rust
let s = String::from("hello");
// s dropped automatically when out of scope
\`\`\``
      },
      { 
        id: 13, 
        text: "Explain the CAP theorem in distributed systems.", 
        difficulty: "Hard",
        answer: `**CAP Theorem:** A distributed system can only provide 2 of 3 guarantees:

**C - Consistency:** Every read receives the most recent write
**A - Availability:** Every request receives a response
**P - Partition Tolerance:** System continues despite network failures

**Why only 2?**
During a network partition:
- Choose **Consistency:** Reject requests until partition heals
- Choose **Availability:** Serve potentially stale data

**Classifications:**
| System | Type | Trade-off |
|--------|------|-----------|
| Traditional SQL | CA | Not partition tolerant |
| MongoDB, HBase | CP | May be unavailable |
| Cassandra, DynamoDB | AP | Eventually consistent |

**Real-world:**
- Network partitions are unavoidable
- Most choose between CP and AP
- Many systems are configurable per-operation

**PACELC extension:**
\`\`\`
If Partition: Availability vs Consistency
Else: Latency vs Consistency
\`\`\``
      },
    ],
  },
  "ai-engineer": {
    "interview-questions": [
      { 
        id: 1, 
        text: "What is the difference between supervised and unsupervised learning?", 
        difficulty: "Easy",
        answer: `**Supervised Learning**
- Uses labeled data (input → known output)
- Goal: Learn mapping function f(x) → y
- Examples: Classification, Regression

\`\`\`python
# Supervised: Predict house prices
X = [[1500, 3], [2000, 4]]  # [sqft, bedrooms]
y = [300000, 450000]         # prices (labels)
model.fit(X, y)
\`\`\`

**Unsupervised Learning**
- Uses unlabeled data (no known outputs)
- Goal: Find hidden patterns/structure
- Examples: Clustering, Dimensionality Reduction

\`\`\`python
# Unsupervised: Group customers
X = [[25, 50000], [45, 80000], [22, 45000]]
clusters = model.fit_predict(X)  # No labels!
\`\`\`

| Aspect | Supervised | Unsupervised |
|--------|------------|--------------|
| Data | Labeled | Unlabeled |
| Goal | Predict outcomes | Find patterns |
| Validation | Compare with labels | Domain expertise |
| Examples | Spam detection, Price prediction | Customer segmentation, Anomaly detection |

**Semi-supervised:** Uses both labeled and unlabeled data`
      },
      { 
        id: 2, 
        text: "Explain the bias-variance tradeoff.", 
        difficulty: "Easy",
        answer: `The bias-variance tradeoff is the balance between two sources of error:

**Bias (Underfitting)**
- Error from oversimplified assumptions
- Model misses relevant patterns
- High training AND test error

**Variance (Overfitting)**
- Error from sensitivity to training data fluctuations
- Model memorizes noise
- Low training error, HIGH test error

**Total Error = Bias² + Variance + Irreducible Error**

\`\`\`
Complexity →
         ↑
Error    |  \\  Total Error  /
         |   \\            /
         |    \\__      __/
         |       \\    /
         |   Bias \\  / Variance
         |         \\/
         +-------------------→
              Sweet Spot
\`\`\`

**Solutions:**
| High Bias | High Variance |
|-----------|---------------|
| More features | More training data |
| Complex model | Regularization (L1/L2) |
| Less regularization | Simpler model |
| Longer training | Dropout, Early stopping |

**Key insight:** Find the optimal model complexity that minimizes total error.`
      },
      { 
        id: 3, 
        text: "What is overfitting and how do you prevent it?", 
        difficulty: "Easy",
        answer: `**Overfitting** = Model performs well on training data but poorly on new data (memorizes rather than learns).

**Signs of Overfitting:**
- Training accuracy >> Validation accuracy
- Complex decision boundaries
- Model captures noise as patterns

**Prevention Techniques:**

**1. More Training Data**
\`\`\`python
# Data augmentation for images
augmented = ImageDataGenerator(
    rotation_range=20,
    horizontal_flip=True
)
\`\`\`

**2. Regularization**
\`\`\`python
# L1 (Lasso) - Feature selection
# L2 (Ridge) - Weight decay
model = Ridge(alpha=1.0)
\`\`\`

**3. Dropout (Neural Networks)**
\`\`\`python
model.add(Dropout(0.5))  # 50% neurons dropped
\`\`\`

**4. Early Stopping**
\`\`\`python
early_stop = EarlyStopping(
    monitor='val_loss',
    patience=10
)
\`\`\`

**5. Cross-Validation**
\`\`\`python
scores = cross_val_score(model, X, y, cv=5)
\`\`\`

**6. Simpler Model**
- Fewer layers/neurons
- Fewer features
- Lower polynomial degree`
      },
      { 
        id: 4, 
        text: "Explain the concept of gradient descent.", 
        difficulty: "Easy",
        answer: `**Gradient Descent** is an optimization algorithm to minimize a loss function by iteratively moving toward the steepest descent.

**Formula:**
\`θ_new = θ_old - α * ∇L(θ)\`

Where:
- \`θ\` = model parameters (weights)
- \`α\` = learning rate
- \`∇L(θ)\` = gradient of loss function

**Intuition:** Imagine rolling a ball downhill - it follows the steepest path to the bottom.

\`\`\`python
def gradient_descent(X, y, lr=0.01, epochs=1000):
    weights = np.zeros(X.shape[1])
    
    for _ in range(epochs):
        predictions = X @ weights
        error = predictions - y
        gradient = (2/len(X)) * X.T @ error
        weights = weights - lr * gradient
    
    return weights
\`\`\`

**Variants:**

| Type | Batch Size | Speed | Stability |
|------|------------|-------|-----------|
| Batch GD | All data | Slow | Stable |
| Stochastic GD | 1 sample | Fast | Noisy |
| Mini-batch GD | 32-256 | Balanced | Balanced |

**Advanced Optimizers:**
- **Adam**: Adaptive learning rate + momentum
- **RMSprop**: Adaptive learning rate
- **SGD + Momentum**: Accelerates convergence`
      },
      { id: 5, text: "What are activation functions and why are they needed?", difficulty: "Easy" },
      { id: 6, text: "What is cross-validation?", difficulty: "Easy" },
      { 
        id: 7, 
        text: "Explain precision, recall, and F1 score.", 
        difficulty: "Easy",
        answer: `These metrics evaluate classification model performance, especially with imbalanced data.

**Confusion Matrix:**
\`\`\`
              Predicted
            |  Pos  |  Neg  |
Actual Pos  |  TP   |  FN   |
Actual Neg  |  FP   |  TN   |
\`\`\`

**Precision** = TP / (TP + FP)
- "Of all predicted positives, how many are actually positive?"
- High precision = Few false alarms
- Use when: False positives are costly (spam detection)

**Recall (Sensitivity)** = TP / (TP + FN)
- "Of all actual positives, how many did we catch?"
- High recall = Few missed positives
- Use when: False negatives are costly (cancer detection)

**F1 Score** = 2 × (Precision × Recall) / (Precision + Recall)
- Harmonic mean of precision and recall
- Balances both metrics
- Use when: Both FP and FN matter equally

\`\`\`python
from sklearn.metrics import precision_recall_fscore_support

precision, recall, f1, _ = precision_recall_fscore_support(
    y_true, y_pred, average='binary'
)
\`\`\`

**Example:** Fraud Detection
- 1000 transactions, 10 frauds
- Model predicts 15 as fraud, 8 are correct

Precision = 8/15 = 53% (many false alarms)
Recall = 8/10 = 80% (caught most frauds)
F1 = 2×(0.53×0.80)/(0.53+0.80) = 64%`
      },
      { id: 8, text: "What is regularization in machine learning?", difficulty: "Easy" },
      { id: 9, text: "Explain the difference between bagging and boosting.", difficulty: "Medium" },
      { 
        id: 10, 
        text: "How do transformers work in NLP?", 
        difficulty: "Medium",
        answer: `Transformers are neural network architecture that revolutionized NLP using **self-attention** mechanism.

**Key Innovation:** Process all tokens in parallel (unlike RNNs)

**Architecture:**

\`\`\`
Input → Embedding + Positional Encoding
      ↓
   [Encoder] × N
   - Multi-Head Self-Attention
   - Feed-Forward Network
   - Add & Norm (residual connections)
      ↓
   [Decoder] × N  
   - Masked Self-Attention
   - Cross-Attention (to encoder)
   - Feed-Forward Network
      ↓
   Output Probabilities
\`\`\`

**Self-Attention Mechanism:**
\`\`\`python
# For each token, compute attention to all others
Q = X @ W_q  # Query
K = X @ W_k  # Key  
V = X @ W_v  # Value

attention = softmax(Q @ K.T / sqrt(d_k)) @ V
\`\`\`

**Multi-Head Attention:**
- Multiple attention "heads" capture different relationships
- Concatenate and project outputs

**Why Transformers Work:**
1. **Parallelization**: Process entire sequence at once
2. **Long-range dependencies**: Direct attention between any tokens
3. **Scalability**: Efficient for large models (GPT, BERT)

**Applications:**
- BERT: Bidirectional encoding for understanding
- GPT: Autoregressive decoding for generation
- T5: Encoder-decoder for seq2seq tasks`
      },
      { 
        id: 11, 
        text: "What is attention mechanism?", 
        difficulty: "Medium",
        answer: `**Attention** allows models to focus on relevant parts of input when producing output.

**Intuition:** When translating "The cat sat on the mat", to generate "sat" the model should focus on "sat" in input, not "mat".

**Basic Formula:**
\`\`\`
Attention(Q, K, V) = softmax(QK^T / √d_k) × V
\`\`\`

**Components:**
- **Query (Q)**: "What am I looking for?"
- **Key (K)**: "What do I contain?"
- **Value (V)**: "What information do I provide?"

\`\`\`python
def attention(query, key, value):
    d_k = query.shape[-1]
    scores = query @ key.transpose(-2, -1) / math.sqrt(d_k)
    weights = F.softmax(scores, dim=-1)
    return weights @ value
\`\`\`

**Types of Attention:**

| Type | Description | Use Case |
|------|-------------|----------|
| Self-Attention | Attend to same sequence | Transformers |
| Cross-Attention | Attend to different sequence | Encoder-Decoder |
| Causal/Masked | Only attend to past tokens | GPT (generation) |
| Multi-Head | Multiple parallel attentions | Capture different patterns |

**Benefits:**
- Captures long-range dependencies
- Interpretable (attention weights show focus)
- Parallelizable computation`
      },
      { id: 12, text: "Explain LSTM and GRU architectures.", difficulty: "Medium" },
      { id: 13, text: "How do you handle imbalanced datasets?", difficulty: "Medium" },
      { 
        id: 14, 
        text: "What is transfer learning?", 
        difficulty: "Medium",
        answer: `**Transfer Learning** = Using knowledge from one task to improve performance on a related task.

**Why it works:**
- Early layers learn general features (edges, shapes)
- Later layers learn task-specific features
- Reuse general features, fine-tune specific ones

**Approaches:**

**1. Feature Extraction (Freeze base)**
\`\`\`python
base_model = VGG16(weights='imagenet', include_top=False)
base_model.trainable = False  # Freeze!

model = Sequential([
    base_model,
    Flatten(),
    Dense(256, activation='relu'),
    Dense(num_classes, activation='softmax')
])
\`\`\`

**2. Fine-Tuning (Unfreeze some layers)**
\`\`\`python
# Unfreeze last few layers
for layer in base_model.layers[-4:]:
    layer.trainable = True

# Train with low learning rate
model.compile(optimizer=Adam(1e-5), ...)
\`\`\`

**Common Pretrained Models:**

| Domain | Models |
|--------|--------|
| Vision | ResNet, VGG, EfficientNet |
| NLP | BERT, GPT, RoBERTa |
| Audio | Wav2Vec, Whisper |

**When to use:**
- Limited training data
- Similar source and target domains
- Expensive to train from scratch

**Best Practice:** Start frozen, gradually unfreeze if more data available.`
      },
      { id: 15, text: "Explain the architecture of a convolutional neural network.", difficulty: "Medium" },
      { id: 16, text: "What is batch normalization?", difficulty: "Medium" },
      { id: 17, text: "How do you deploy ML models in production?", difficulty: "Medium" },
      { id: 18, text: "What is MLOps?", difficulty: "Medium" },
      { id: 19, text: "Explain reinforcement learning concepts.", difficulty: "Hard" },
      { id: 20, text: "How do GANs work?", difficulty: "Hard" },
      { 
        id: 21, 
        text: "What is RLHF in large language models?", 
        difficulty: "Hard",
        answer: `**RLHF (Reinforcement Learning from Human Feedback)** aligns LLMs with human preferences.

**Problem:** LLMs trained on internet text may generate harmful, biased, or unhelpful content.

**Solution:** Use human feedback to guide the model toward desired behavior.

**Three-Stage Process:**

**1. Supervised Fine-Tuning (SFT)**
\`\`\`
Base Model → Train on human-written examples → SFT Model
\`\`\`

**2. Reward Model Training**
\`\`\`
- Show humans pairs of responses
- Humans rank: Response A > Response B
- Train reward model to predict human preferences

reward_model.predict(prompt, response) → score
\`\`\`

**3. RL Optimization (PPO)**
\`\`\`python
for prompt in dataset:
    response = policy_model.generate(prompt)
    reward = reward_model.score(response)
    
    # Update policy to maximize reward
    # while staying close to original model (KL penalty)
    loss = -reward + β * KL(policy || reference)
\`\`\`

**Key Components:**
- **Policy Model**: The LLM being optimized
- **Reward Model**: Predicts human preference scores
- **Reference Model**: Original SFT model (prevents drift)
- **PPO**: Proximal Policy Optimization algorithm

**Challenges:**
- Expensive human annotation
- Reward hacking (gaming the reward model)
- Maintaining diversity in outputs

**Used in:** ChatGPT, Claude, Gemini`
      },
      { id: 22, text: "Explain the architecture of GPT models.", difficulty: "Hard" },
      { id: 23, text: "How do you fine-tune large language models?", difficulty: "Hard" },
      { id: 24, text: "What are embeddings and how are they created?", difficulty: "Hard" },
      { id: 25, text: "Explain the concept of prompt engineering.", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Implement matrix multiplication.", difficulty: "Easy" },
      { id: 2, text: "Implement a function to calculate cosine similarity.", difficulty: "Easy" },
      { id: 3, text: "Find the dot product of two vectors.", difficulty: "Easy" },
      { id: 4, text: "Implement softmax function.", difficulty: "Easy" },
      { id: 5, text: "Calculate the mean and standard deviation of an array.", difficulty: "Easy" },
      { id: 6, text: "Implement k-nearest neighbors algorithm.", difficulty: "Medium" },
      { id: 7, text: "Build a decision tree from scratch.", difficulty: "Medium" },
      { id: 8, text: "Implement gradient descent optimization.", difficulty: "Medium" },
      { id: 9, text: "Create a simple neural network forward pass.", difficulty: "Medium" },
      { id: 10, text: "Implement backpropagation algorithm.", difficulty: "Hard" },
      { id: 11, text: "Build a transformer attention mechanism.", difficulty: "Hard" },
      { id: 12, text: "Implement beam search for sequence generation.", difficulty: "Hard" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate probability of drawing a red ball from a bag.", difficulty: "Easy" },
      { id: 2, text: "Find the mean, median, and mode of a dataset.", difficulty: "Easy" },
      { id: 3, text: "What is the expected value of a dice roll?", difficulty: "Easy" },
      { id: 4, text: "Calculate conditional probability P(A|B).", difficulty: "Medium" },
      { id: 5, text: "Explain Bayes' theorem with an example.", difficulty: "Medium" },
      { id: 6, text: "Calculate the correlation coefficient.", difficulty: "Medium" },
      { id: 7, text: "What is the central limit theorem?", difficulty: "Hard" },
      { id: 8, text: "Perform hypothesis testing.", difficulty: "Hard" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to calculate average of a column.", difficulty: "Easy" },
      { id: 2, text: "How do you handle NULL values in aggregations?", difficulty: "Easy" },
      { id: 3, text: "Write a query to pivot data.", difficulty: "Medium" },
      { id: 4, text: "How do you create feature columns using SQL?", difficulty: "Medium" },
      { id: 5, text: "Write a query to calculate moving averages.", difficulty: "Hard" },
      { id: 6, text: "How do you sample data randomly using SQL?", difficulty: "Hard" },
    ],
    "core-cs-questions": [
      { id: 1, text: "What is GPU computing and why is it important for AI?", difficulty: "Easy" },
      { id: 2, text: "Explain the concept of parallel processing.", difficulty: "Easy" },
      { id: 3, text: "What is CUDA?", difficulty: "Medium" },
      { id: 4, text: "How does distributed training work?", difficulty: "Medium" },
      { id: 5, text: "Explain model parallelism vs data parallelism.", difficulty: "Hard" },
      { id: 6, text: "What are tensor cores?", difficulty: "Hard" },
    ],
  },
  "frontend-developer": {
    "interview-questions": [
      { 
        id: 1, 
        text: "What is the virtual DOM and how does it work?", 
        difficulty: "Easy",
        answer: `The **Virtual DOM** is a lightweight JavaScript representation of the actual DOM.

**How it works:**

1. **Initial Render**: Create virtual DOM tree from components
2. **State Change**: Create new virtual DOM tree
3. **Diffing**: Compare old vs new virtual DOM
4. **Patching**: Apply only the changes to real DOM

\`\`\`javascript
// Virtual DOM representation
const vNode = {
  type: 'div',
  props: { className: 'container' },
  children: [
    { type: 'h1', props: {}, children: ['Hello'] },
    { type: 'p', props: {}, children: ['World'] }
  ]
};
\`\`\`

**Why use Virtual DOM?**

| Real DOM | Virtual DOM |
|----------|-------------|
| Slow updates | Fast diffing |
| Reflows/repaints | Batch updates |
| Direct manipulation | Declarative |

**Reconciliation Process:**
\`\`\`
State Change → New VDOM → Diff with Old VDOM → Minimal DOM Updates
\`\`\`

**Key optimizations:**
- **Keys**: Help identify which items changed in lists
- **Batching**: Multiple state changes = single re-render
- **Fiber**: Interruptible rendering (React 16+)

**Note:** Virtual DOM isn't always faster than direct DOM—it's an abstraction that makes declarative programming efficient.`
      },
      { 
        id: 2, 
        text: "Explain the difference between let, const, and var.", 
        difficulty: "Easy",
        answer: `**var** (ES5 - avoid in modern JS)
- Function-scoped
- Hoisted to top (initialized as undefined)
- Can be redeclared

\`\`\`javascript
console.log(x); // undefined (hoisted)
var x = 5;
var x = 10; // OK - redeclaration allowed

function test() {
  var y = 1;
}
console.log(y); // ReferenceError (function scoped)
\`\`\`

**let** (ES6 - use for reassignable values)
- Block-scoped
- Hoisted but NOT initialized (TDZ)
- Cannot be redeclared

\`\`\`javascript
console.log(x); // ReferenceError (TDZ)
let x = 5;
let x = 10; // SyntaxError

if (true) {
  let y = 1;
}
console.log(y); // ReferenceError (block scoped)
\`\`\`

**const** (ES6 - use by default)
- Block-scoped
- Must be initialized at declaration
- Cannot be reassigned (but objects are mutable!)

\`\`\`javascript
const x = 5;
x = 10; // TypeError

const obj = { a: 1 };
obj.a = 2; // OK - object properties can change
obj = {};  // TypeError - can't reassign
\`\`\`

**Best Practice:**
1. Use \`const\` by default
2. Use \`let\` when reassignment needed
3. Never use \`var\``
      },
      { 
        id: 3, 
        text: "What are React hooks?", 
        difficulty: "Easy",
        answer: `**Hooks** are functions that let you use state and lifecycle features in functional components.

**Core Hooks:**

\`\`\`javascript
// useState - Component state
const [count, setCount] = useState(0);

// useEffect - Side effects (data fetching, subscriptions)
useEffect(() => {
  document.title = \`Count: \${count}\`;
  return () => cleanup(); // Optional cleanup
}, [count]); // Dependency array

// useContext - Access context without nesting
const theme = useContext(ThemeContext);

// useRef - Mutable reference (persists across renders)
const inputRef = useRef(null);
inputRef.current.focus();

// useMemo - Memoize expensive calculations
const sorted = useMemo(() => 
  items.sort((a, b) => a - b), 
  [items]
);

// useCallback - Memoize functions
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
\`\`\`

**Rules of Hooks:**
1. Only call at top level (not in loops/conditions)
2. Only call from React functions

**Custom Hooks:**
\`\`\`javascript
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return size;
}
\`\`\``
      },
      { id: 4, text: "Explain CSS specificity.", difficulty: "Easy" },
      { id: 5, text: "What is the box model in CSS?", difficulty: "Easy" },
      { 
        id: 6, 
        text: "How does event bubbling work?", 
        difficulty: "Easy",
        answer: `**Event Bubbling** = Events propagate from target element UP through ancestors.

**Event Phases:**
1. **Capture Phase**: Window → Target (top-down)
2. **Target Phase**: Event at target
3. **Bubble Phase**: Target → Window (bottom-up)

\`\`\`html
<div id="grandparent">
  <div id="parent">
    <button id="child">Click</button>
  </div>
</div>
\`\`\`

\`\`\`javascript
// Default: Bubbling (3rd param false or omitted)
child.addEventListener('click', () => console.log('Child'));
parent.addEventListener('click', () => console.log('Parent'));
grandparent.addEventListener('click', () => console.log('Grandparent'));

// Click button → Child → Parent → Grandparent

// Capture phase (3rd param true)
grandparent.addEventListener('click', () => console.log('GP Capture'), true);
// Now: GP Capture → Child → Parent → Grandparent
\`\`\`

**Stop Propagation:**
\`\`\`javascript
child.addEventListener('click', (e) => {
  e.stopPropagation(); // Stops bubbling
  console.log('Only child fires');
});
\`\`\`

**Event Delegation (leveraging bubbling):**
\`\`\`javascript
// Instead of adding listener to each item
document.querySelector('ul').addEventListener('click', (e) => {
  if (e.target.matches('li')) {
    console.log('List item clicked:', e.target.textContent);
  }
});
\`\`\`

**Benefits of delegation:**
- Fewer event listeners
- Works for dynamically added elements`
      },
      { 
        id: 7, 
        text: "What is closure in JavaScript?", 
        difficulty: "Easy",
        answer: `A **closure** is a function that remembers variables from its outer scope even after the outer function has returned.

\`\`\`javascript
function createCounter() {
  let count = 0; // Enclosed variable
  
  return function() {
    count++; // Accesses outer scope
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
\`\`\`

**How it works:**
- Inner function "closes over" outer variables
- Variables persist in memory as long as closure exists

**Common Use Cases:**

**1. Data Privacy:**
\`\`\`javascript
function createBankAccount(initial) {
  let balance = initial; // Private!
  
  return {
    deposit: (amount) => balance += amount,
    getBalance: () => balance
  };
}
\`\`\`

**2. Function Factories:**
\`\`\`javascript
function multiply(x) {
  return (y) => x * y;
}
const double = multiply(2);
console.log(double(5)); // 10
\`\`\`

**3. Event Handlers (common pitfall):**
\`\`\`javascript
// Bug: All buttons log 3
for (var i = 0; i < 3; i++) {
  buttons[i].onclick = () => console.log(i);
}

// Fix: Use let (block scope) or closure
for (let i = 0; i < 3; i++) {
  buttons[i].onclick = () => console.log(i);
}
\`\`\`

**Memory:** Closures keep references alive—be mindful of memory leaks!`
      },
      { id: 8, text: "Explain the difference between == and ===.", difficulty: "Easy" },
      { 
        id: 9, 
        text: "What is the purpose of useEffect hook?", 
        difficulty: "Medium",
        answer: `**useEffect** handles side effects in functional components—things that happen outside React's rendering.

**Syntax:**
\`\`\`javascript
useEffect(() => {
  // Effect code
  return () => cleanup(); // Optional cleanup
}, [dependencies]); // Dependency array
\`\`\`

**Dependency Array Behavior:**

\`\`\`javascript
// 1. No array = Run after EVERY render
useEffect(() => {
  console.log('Runs every render');
});

// 2. Empty array = Run ONCE on mount
useEffect(() => {
  fetchData();
}, []);

// 3. With deps = Run when deps change
useEffect(() => {
  fetchUser(userId);
}, [userId]);
\`\`\`

**Common Use Cases:**

\`\`\`javascript
// Data fetching
useEffect(() => {
  const loadData = async () => {
    const data = await fetchData();
    setData(data);
  };
  loadData();
}, []);

// Event listeners
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// Document title
useEffect(() => {
  document.title = \`\${unreadCount} messages\`;
}, [unreadCount]);
\`\`\`

**Cleanup Function:**
Runs before effect re-runs AND on unmount.

\`\`\`javascript
useEffect(() => {
  const subscription = source.subscribe();
  return () => subscription.unsubscribe(); // Cleanup!
}, [source]);
\`\`\`

**Common Pitfalls:**
- Missing dependencies → stale closures
- Object/array deps → infinite loops (use useMemo)
- Async in effect → use IIFE or separate function`
      },
      { 
        id: 10, 
        text: "How do you optimize React performance?", 
        difficulty: "Medium",
        answer: `**Key Optimization Strategies:**

**1. Memoization:**
\`\`\`javascript
// React.memo - Prevent re-renders if props unchanged
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* complex UI */}</div>;
});

// useMemo - Memoize expensive calculations
const sortedItems = useMemo(() => 
  items.sort((a, b) => a.price - b.price),
  [items]
);

// useCallback - Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
\`\`\`

**2. Code Splitting:**
\`\`\`javascript
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
\`\`\`

**3. Virtualization (large lists):**
\`\`\`javascript
import { FixedSizeList } from 'react-window';

<FixedSizeList height={400} itemCount={10000} itemSize={35}>
  {({ index, style }) => <Row style={style}>{items[index]}</Row>}
</FixedSizeList>
\`\`\`

**4. Avoid Common Mistakes:**
\`\`\`javascript
// ❌ Creates new object every render
<Component style={{ color: 'red' }} />

// ✅ Define outside or useMemo
const style = useMemo(() => ({ color: 'red' }), []);

// ❌ Inline function in render
<Button onClick={() => handleClick(id)} />

// ✅ useCallback
const onClick = useCallback(() => handleClick(id), [id]);
\`\`\`

**5. State Management:**
- Lift state only when necessary
- Colocate state near where it's used
- Use context sparingly (causes re-renders)

**Debugging:** React DevTools Profiler identifies slow components.`
      },
      { id: 11, text: "Explain state management in React.", difficulty: "Medium" },
      { id: 12, text: "What is server-side rendering?", difficulty: "Medium" },
      { id: 13, text: "How do you handle async operations in JavaScript?", difficulty: "Medium" },
      { id: 14, text: "What are Web Workers?", difficulty: "Medium" },
      { id: 15, text: "Explain the concept of code splitting.", difficulty: "Medium" },
      { id: 16, text: "How does the browser rendering pipeline work?", difficulty: "Medium" },
      { id: 17, text: "What is tree shaking?", difficulty: "Medium" },
      { id: 18, text: "Explain CSS-in-JS approaches.", difficulty: "Medium" },
      { id: 19, text: "What is React Fiber?", difficulty: "Hard" },
      { id: 20, text: "How does React concurrent mode work?", difficulty: "Hard" },
      { 
        id: 21, 
        text: "Explain the event loop in JavaScript.", 
        difficulty: "Hard",
        answer: `The **Event Loop** enables JavaScript's non-blocking async behavior despite being single-threaded.

**Components:**

1. **Call Stack**: Executes synchronous code (LIFO)
2. **Web APIs**: Handle async operations (setTimeout, fetch, DOM events)
3. **Callback Queue (Task Queue)**: Holds callbacks from Web APIs
4. **Microtask Queue**: Holds Promises, MutationObserver (higher priority)

**How it works:**
\`\`\`
1. Execute code in Call Stack
2. Async operations go to Web APIs
3. Callbacks move to appropriate queue when ready
4. Event Loop: If Stack empty, move tasks from queues to stack
5. Microtasks first, then Tasks
\`\`\`

\`\`\`javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');

// Output: 1, 4, 3, 2
// Why? Microtask (Promise) runs before Task (setTimeout)
\`\`\`

**Execution Order:**
\`\`\`javascript
console.log('script start');

setTimeout(() => console.log('timeout'), 0);

Promise.resolve()
  .then(() => console.log('promise1'))
  .then(() => console.log('promise2'));

console.log('script end');

// Output:
// script start
// script end
// promise1
// promise2
// timeout
\`\`\`

**Key Insight:** 
- Microtasks (Promises) execute between each task
- Long-running code blocks the event loop
- \`requestAnimationFrame\` runs before next repaint`
      },
      { id: 22, text: "How do you implement micro-frontends?", difficulty: "Hard" },
      { id: 23, text: "What are service workers and PWAs?", difficulty: "Hard" },
      { id: 24, text: "Explain WebAssembly and its use cases.", difficulty: "Hard" },
      { id: 25, text: "How do you implement accessible components?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { 
        id: 1, 
        text: "Implement debounce function.", 
        difficulty: "Easy",
        answer: `**Debounce** delays function execution until after a pause in calls.

Use case: Search input (wait for user to stop typing)

\`\`\`javascript
function debounce(fn, delay) {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// Usage
const searchInput = document.querySelector('input');
const handleSearch = debounce((e) => {
  console.log('Searching:', e.target.value);
}, 300);

searchInput.addEventListener('input', handleSearch);
\`\`\`

**With immediate option:**
\`\`\`javascript
function debounce(fn, delay, immediate = false) {
  let timeoutId;
  
  return function(...args) {
    const callNow = immediate && !timeoutId;
    
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) fn.apply(this, args);
    }, delay);
    
    if (callNow) fn.apply(this, args);
  };
}
\`\`\`

**Visual:**
\`\`\`
Calls:    ─●─●─●─●─────●─●─────
Executes: ──────────●───────●──
          (after 300ms pause)
\`\`\``
      },
      { 
        id: 2, 
        text: "Implement throttle function.", 
        difficulty: "Easy",
        answer: `**Throttle** limits function execution to at most once per interval.

Use case: Scroll events, resize events

\`\`\`javascript
function throttle(fn, limit) {
  let inThrottle = false;
  
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Usage
const handleScroll = throttle(() => {
  console.log('Scroll position:', window.scrollY);
}, 100);

window.addEventListener('scroll', handleScroll);
\`\`\`

**With trailing call:**
\`\`\`javascript
function throttle(fn, limit) {
  let lastCall = 0;
  let lastArgs;
  let timeoutId;
  
  return function(...args) {
    const now = Date.now();
    
    if (now - lastCall >= limit) {
      fn.apply(this, args);
      lastCall = now;
    } else {
      lastArgs = args;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn.apply(this, lastArgs);
        lastCall = Date.now();
      }, limit - (now - lastCall));
    }
  };
}
\`\`\`

**Visual:**
\`\`\`
Calls:    ─●●●●●●●●●●●●●──
Executes: ─●───●───●───●──
          (every 100ms max)
\`\`\`

**Debounce vs Throttle:**
- Debounce: Wait for pause → search input
- Throttle: Max rate → scroll/resize`
      },
      { id: 3, text: "Flatten a nested array.", difficulty: "Easy" },
      { id: 4, text: "Deep clone an object.", difficulty: "Easy" },
      { id: 5, text: "Implement array map from scratch.", difficulty: "Easy" },
      { id: 6, text: "Implement array reduce from scratch.", difficulty: "Medium" },
      { id: 7, text: "Create a deep comparison function.", difficulty: "Medium" },
      { id: 8, text: "Implement a pub-sub pattern.", difficulty: "Medium" },
      { id: 9, text: "Build a virtual DOM diff algorithm.", difficulty: "Hard" },
      { 
        id: 10, 
        text: "Implement a promise from scratch.", 
        difficulty: "Hard",
        answer: `A simplified Promise implementation following Promises/A+ spec:

\`\`\`javascript
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.handlers = [];
    
    const resolve = (value) => {
      if (this.state !== 'pending') return;
      this.state = 'fulfilled';
      this.value = value;
      this.handlers.forEach(h => h.onFulfilled(value));
    };
    
    const reject = (reason) => {
      if (this.state !== 'pending') return;
      this.state = 'rejected';
      this.value = reason;
      this.handlers.forEach(h => h.onRejected(reason));
    };
    
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }
  
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const handle = (handler, resolver) => {
        return (value) => {
          try {
            const result = handler ? handler(value) : value;
            if (result instanceof MyPromise) {
              result.then(resolve, reject);
            } else {
              resolver(result);
            }
          } catch (error) {
            reject(error);
          }
        };
      };
      
      if (this.state === 'pending') {
        this.handlers.push({
          onFulfilled: handle(onFulfilled, resolve),
          onRejected: handle(onRejected, reject)
        });
      } else if (this.state === 'fulfilled') {
        queueMicrotask(() => handle(onFulfilled, resolve)(this.value));
      } else {
        queueMicrotask(() => handle(onRejected, reject)(this.value));
      }
    });
  }
  
  catch(onRejected) {
    return this.then(null, onRejected);
  }
  
  static resolve(value) {
    return new MyPromise(res => res(value));
  }
  
  static reject(reason) {
    return new MyPromise((_, rej) => rej(reason));
  }
}
\`\`\`

**Key concepts:**
- State machine: pending → fulfilled/rejected
- Handlers queue for async resolution
- Chaining returns new Promise
- \`queueMicrotask\` for async execution`
      },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate the time complexity of nested loops.", difficulty: "Easy" },
      { id: 2, text: "If a webpage loads in 2 seconds and you optimize it by 50%, what is the new load time?", difficulty: "Easy" },
      { id: 3, text: "Calculate memory usage for storing 1000 objects with 5 properties each.", difficulty: "Medium" },
      { id: 4, text: "Estimate the number of DOM nodes on a typical e-commerce page.", difficulty: "Medium" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to fetch user data for a profile page.", difficulty: "Easy" },
      { id: 2, text: "How do you paginate results for a list view?", difficulty: "Easy" },
      { id: 3, text: "Write a query to search across multiple columns.", difficulty: "Medium" },
      { id: 4, text: "How do you implement autocomplete suggestions?", difficulty: "Medium" },
    ],
    "core-cs-questions": [
      { id: 1, text: "How do browsers render web pages?", difficulty: "Easy" },
      { id: 2, text: "What is the critical rendering path?", difficulty: "Easy" },
      { id: 3, text: "Explain HTTP/2 and its benefits.", difficulty: "Medium" },
      { id: 4, text: "What is CORS and how does it work?", difficulty: "Medium" },
      { id: 5, text: "How does browser caching work?", difficulty: "Hard" },
      { id: 6, text: "Explain Content Security Policy.", difficulty: "Hard" },
    ],
  },
  "data-science-ml": {
    "interview-questions": [
      { id: 1, text: "What is the difference between classification and regression?", difficulty: "Easy" },
      { id: 2, text: "Explain the concept of feature engineering.", difficulty: "Easy" },
      { id: 3, text: "What is exploratory data analysis?", difficulty: "Easy" },
      { id: 4, text: "How do you handle missing values?", difficulty: "Easy" },
      { id: 5, text: "What is normalization vs standardization?", difficulty: "Easy" },
      { id: 6, text: "Explain different types of sampling methods.", difficulty: "Medium" },
      { id: 7, text: "How do you select features for a model?", difficulty: "Medium" },
      { id: 8, text: "What is dimensionality reduction?", difficulty: "Medium" },
      { id: 9, text: "Explain A/B testing methodology.", difficulty: "Medium" },
      { id: 10, text: "How do you validate ML models?", difficulty: "Hard" },
      { id: 11, text: "Explain time series forecasting approaches.", difficulty: "Hard" },
      { id: 12, text: "What is causal inference?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Implement k-means clustering algorithm.", difficulty: "Medium" },
      { id: 2, text: "Build a linear regression model from scratch.", difficulty: "Medium" },
      { id: 3, text: "Implement PCA for dimensionality reduction.", difficulty: "Hard" },
      { id: 4, text: "Create a random forest classifier.", difficulty: "Hard" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate the confidence interval for a sample mean.", difficulty: "Medium" },
      { id: 2, text: "Perform chi-square test.", difficulty: "Medium" },
      { id: 3, text: "Calculate p-value for a hypothesis test.", difficulty: "Hard" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to calculate customer lifetime value.", difficulty: "Medium" },
      { id: 2, text: "How do you create cohort analysis using SQL?", difficulty: "Medium" },
      { id: 3, text: "Write a query for funnel analysis.", difficulty: "Hard" },
    ],
    "core-cs-questions": [
      { id: 1, text: "How do you store and process large datasets?", difficulty: "Medium" },
      { id: 2, text: "Explain the MapReduce paradigm.", difficulty: "Medium" },
      { id: 3, text: "What is data warehousing?", difficulty: "Hard" },
    ],
  },
  "system-design": {
    "interview-questions": [
      { id: 1, text: "Design a URL shortener.", difficulty: "Easy" },
      { id: 2, text: "Design a rate limiter.", difficulty: "Medium" },
      { id: 3, text: "Design Twitter's feed system.", difficulty: "Medium" },
      { id: 4, text: "Design a chat application.", difficulty: "Medium" },
      { id: 5, text: "Design a notification system.", difficulty: "Medium" },
      { id: 6, text: "Design YouTube.", difficulty: "Hard" },
      { id: 7, text: "Design a distributed cache.", difficulty: "Hard" },
      { id: 8, text: "Design Google Search.", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Implement consistent hashing.", difficulty: "Hard" },
      { id: 2, text: "Design a bloom filter.", difficulty: "Hard" },
      { id: 3, text: "Implement a load balancer algorithm.", difficulty: "Medium" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate the storage needed for 1 billion users.", difficulty: "Medium" },
      { id: 2, text: "Estimate QPS for a social media platform.", difficulty: "Medium" },
    ],
    "sql-questions": [
      { id: 1, text: "Design a schema for a social network.", difficulty: "Medium" },
      { id: 2, text: "How do you partition a large table?", difficulty: "Hard" },
    ],
    "core-cs-questions": [
      { id: 1, text: "Explain CAP theorem.", difficulty: "Medium" },
      { id: 2, text: "What is consensus in distributed systems?", difficulty: "Hard" },
      { id: 3, text: "Explain Paxos and Raft algorithms.", difficulty: "Hard" },
    ],
  },
  "devops-cloud": {
    "interview-questions": [
      { id: 1, text: "What is CI/CD?", difficulty: "Easy" },
      { id: 2, text: "Explain Docker and containerization.", difficulty: "Easy" },
      { id: 3, text: "What is Infrastructure as Code?", difficulty: "Easy" },
      { id: 4, text: "How do you implement blue-green deployments?", difficulty: "Medium" },
      { id: 5, text: "Explain Kubernetes architecture.", difficulty: "Medium" },
      { id: 6, text: "What is service mesh?", difficulty: "Hard" },
      { id: 7, text: "How do you implement GitOps?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Write a script to monitor server health.", difficulty: "Easy" },
      { id: 2, text: "Implement a simple load balancer.", difficulty: "Medium" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate uptime percentage from downtime hours.", difficulty: "Easy" },
      { id: 2, text: "Estimate cloud costs for a given architecture.", difficulty: "Medium" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to analyze deployment frequency.", difficulty: "Medium" },
    ],
    "core-cs-questions": [
      { id: 1, text: "Explain container networking.", difficulty: "Medium" },
      { id: 2, text: "How does Kubernetes scheduling work?", difficulty: "Hard" },
    ],
  },
  "java-developer": {
    "interview-questions": [
      { id: 1, text: "Explain the difference between JDK, JRE, and JVM.", difficulty: "Easy" },
      { id: 2, text: "What is the difference between == and equals()?", difficulty: "Easy" },
      { id: 3, text: "What are primitive data types in Java?", difficulty: "Easy" },
      { id: 4, text: "Explain method overloading vs overriding.", difficulty: "Easy" },
      { id: 5, text: "What is the purpose of the final keyword?", difficulty: "Easy" },
      { id: 6, text: "What are access modifiers in Java?", difficulty: "Easy" },
      { id: 7, text: "Explain the static keyword and its uses.", difficulty: "Easy" },
      { id: 8, text: "What is autoboxing and unboxing?", difficulty: "Easy" },
      { id: 9, text: "Explain Java memory model.", difficulty: "Medium" },
      { id: 10, text: "What is the purpose of garbage collection?", difficulty: "Medium" },
      { id: 11, text: "Explain the difference between ArrayList and LinkedList.", difficulty: "Medium" },
      { id: 12, text: "What are generics and why are they used?", difficulty: "Medium" },
      { id: 13, text: "Explain exception handling in Java.", difficulty: "Medium" },
      { id: 14, text: "What is the difference between checked and unchecked exceptions?", difficulty: "Medium" },
      { id: 15, text: "How does HashMap work internally?", difficulty: "Medium" },
      { id: 16, text: "Explain the concept of immutability.", difficulty: "Medium" },
      { id: 17, text: "What are functional interfaces?", difficulty: "Medium" },
      { id: 18, text: "Explain Stream API and its operations.", difficulty: "Medium" },
      { id: 19, text: "What is the difference between Comparable and Comparator?", difficulty: "Medium" },
      { id: 20, text: "Explain the volatile keyword.", difficulty: "Medium" },
      { id: 21, text: "Explain multithreading in Java.", difficulty: "Hard" },
      { id: 22, text: "What are Java design patterns?", difficulty: "Hard" },
      { id: 23, text: "Explain the Java Memory Model and happens-before relationship.", difficulty: "Hard" },
      { id: 24, text: "What is the Fork/Join framework?", difficulty: "Hard" },
      { id: 25, text: "Explain CompletableFuture and async programming.", difficulty: "Hard" },
      { id: 26, text: "What are memory leaks in Java and how to prevent them?", difficulty: "Hard" },
      { id: 27, text: "Explain the internals of synchronized keyword.", difficulty: "Hard" },
      { id: 28, text: "What is reflection and when should you use it?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Implement a HashMap in Java.", difficulty: "Medium" },
      { id: 2, text: "Create a thread-safe singleton.", difficulty: "Medium" },
      { id: 3, text: "Implement a LRU cache using LinkedHashMap.", difficulty: "Medium" },
      { id: 4, text: "Implement binary search tree operations.", difficulty: "Medium" },
      { id: 5, text: "Create a custom ArrayList implementation.", difficulty: "Medium" },
      { id: 6, text: "Implement a concurrent queue.", difficulty: "Hard" },
      { id: 7, text: "Create a thread-safe producer-consumer implementation.", difficulty: "Hard" },
      { id: 8, text: "Implement a blocking queue from scratch.", difficulty: "Hard" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate memory usage for Java objects.", difficulty: "Medium" },
      { id: 2, text: "Estimate heap size needed for N objects.", difficulty: "Medium" },
      { id: 3, text: "Calculate thread pool size for optimal performance.", difficulty: "Hard" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query using JDBC.", difficulty: "Easy" },
      { id: 2, text: "Explain JPA and Hibernate.", difficulty: "Medium" },
      { id: 3, text: "What is the N+1 query problem?", difficulty: "Medium" },
      { id: 4, text: "How do you implement pagination with JPA?", difficulty: "Medium" },
      { id: 5, text: "Explain entity relationships in Hibernate.", difficulty: "Hard" },
    ],
    "core-cs-questions": [
      { id: 1, text: "Explain JVM internals.", difficulty: "Hard" },
      { id: 2, text: "What is class loading in Java?", difficulty: "Medium" },
      { id: 3, text: "How does JIT compilation work?", difficulty: "Hard" },
      { id: 4, text: "Explain different garbage collection algorithms.", difficulty: "Hard" },
      { id: 5, text: "What is bytecode and how is it executed?", difficulty: "Medium" },
    ],
  },
  "data-analyst": {
    "interview-questions": [
      { 
        id: 1, 
        text: "What is data visualization?", 
        difficulty: "Easy",
        answer: `**Data Visualization** transforms raw data into visual formats (charts, graphs, maps) to communicate insights effectively.

**Why it matters:**
- Humans process visuals 60,000x faster than text
- Reveals patterns, trends, and outliers
- Enables data-driven decision making

**Key Principles:**
1. **Choose the right chart type:**

| Data Type | Chart |
|-----------|-------|
| Comparison | Bar, Column |
| Trend over time | Line, Area |
| Part of whole | Pie, Treemap |
| Distribution | Histogram, Box plot |
| Relationship | Scatter plot |
| Geographic | Map, Choropleth |

2. **Design best practices:**
- Start Y-axis at 0 (usually)
- Use consistent colors
- Remove chart junk (unnecessary elements)
- Label clearly
- Tell a story

**Tools:**
- **Beginner:** Excel, Google Sheets
- **Intermediate:** Tableau, Power BI, Looker
- **Advanced:** D3.js, Python (Matplotlib, Seaborn, Plotly)

**Example insight:**
\`\`\`
Before: "Sales increased 23% in Q2"
After: [Line chart showing monthly growth with Q2 highlighted]
\`\`\``
      },
      { 
        id: 2, 
        text: "How do you clean dirty data?", 
        difficulty: "Easy",
        answer: `**Data Cleaning** prepares raw data for analysis by fixing errors and inconsistencies.

**Common Issues & Solutions:**

**1. Missing Values**
\`\`\`python
# Drop rows with missing values
df.dropna()

# Fill with mean/median/mode
df['column'].fillna(df['column'].mean(), inplace=True)

# Forward/backward fill
df.fillna(method='ffill')
\`\`\`

**2. Duplicates**
\`\`\`python
# Find duplicates
df.duplicated().sum()

# Remove duplicates
df.drop_duplicates(subset=['email'], keep='first')
\`\`\`

**3. Inconsistent Formatting**
\`\`\`python
# Standardize text
df['name'] = df['name'].str.strip().str.title()

# Fix dates
df['date'] = pd.to_datetime(df['date'], format='%m/%d/%Y')
\`\`\`

**4. Outliers**
\`\`\`python
# IQR method
Q1, Q3 = df['value'].quantile([0.25, 0.75])
IQR = Q3 - Q1
df = df[(df['value'] >= Q1 - 1.5*IQR) & 
        (df['value'] <= Q3 + 1.5*IQR)]
\`\`\`

**5. Data Type Issues**
\`\`\`python
df['price'] = df['price'].str.replace('$', '').astype(float)
\`\`\`

**Best Practice:** Document all cleaning steps for reproducibility!`
      },
      { id: 3, text: "What tools do you use for data analysis?", difficulty: "Easy" },
      { id: 4, text: "Explain the difference between qualitative and quantitative data.", difficulty: "Easy" },
      { 
        id: 5, 
        text: "What is a pivot table and how do you use it?", 
        difficulty: "Easy",
        answer: `A **Pivot Table** summarizes large datasets by grouping, aggregating, and reorganizing data interactively.

**Key Components:**
- **Rows**: Categories to group by
- **Columns**: Secondary grouping
- **Values**: Metrics to aggregate (sum, count, avg)
- **Filters**: Slice data by criteria

**Example:** Sales data analysis

| Date | Region | Product | Revenue |
|------|--------|---------|---------|
| Jan | East | A | 100 |
| Jan | West | B | 200 |
| Feb | East | A | 150 |

**Pivot Table Output:**
| Region | Product A | Product B | Total |
|--------|-----------|-----------|-------|
| East | 250 | 0 | 250 |
| West | 0 | 200 | 200 |

**SQL Equivalent:**
\`\`\`sql
SELECT 
  region,
  SUM(CASE WHEN product = 'A' THEN revenue ELSE 0 END) AS product_a,
  SUM(CASE WHEN product = 'B' THEN revenue ELSE 0 END) AS product_b,
  SUM(revenue) AS total
FROM sales
GROUP BY region;
\`\`\`

**Python (pandas):**
\`\`\`python
pd.pivot_table(df, 
               values='revenue',
               index='region',
               columns='product',
               aggfunc='sum',
               fill_value=0)
\`\`\`

**When to use:**
- Summarize sales by region/time
- Compare categories
- Find patterns in large datasets`
      },
      { id: 6, text: "How do you handle missing data?", difficulty: "Easy" },
      { 
        id: 7, 
        text: "Explain different chart types and their use cases.", 
        difficulty: "Medium",
        answer: `Choose charts based on what you're trying to show:

**COMPARISON**
| Chart | Use When | Example |
|-------|----------|---------|
| Bar | Compare categories | Sales by region |
| Grouped Bar | Compare subcategories | Sales by region & product |
| Column | Compare over time periods | Monthly revenue |

**TREND**
| Chart | Use When | Example |
|-------|----------|---------|
| Line | Show change over time | Stock prices |
| Area | Show volume over time | Website traffic |
| Sparkline | Compact trend in cell | KPI dashboard |

**COMPOSITION**
| Chart | Use When | Example |
|-------|----------|---------|
| Pie | Parts of whole (< 6 slices) | Market share |
| Stacked Bar | Composition + comparison | Revenue by source per quarter |
| Treemap | Hierarchical composition | Budget breakdown |

**DISTRIBUTION**
| Chart | Use When | Example |
|-------|----------|---------|
| Histogram | Frequency distribution | Age distribution |
| Box Plot | Compare distributions | Salary by department |
| Scatter | Relationship between 2 variables | Price vs Sales |

**GEOSPATIAL**
| Chart | Use When | Example |
|-------|----------|---------|
| Choropleth | Regional data | COVID cases by state |
| Bubble Map | Location + magnitude | Store sales by city |

**❌ Avoid:**
- 3D charts (distort perception)
- Pie with many slices
- Dual Y-axis (confusing scales)`
      },
      { 
        id: 8, 
        text: "How do you present findings to stakeholders?", 
        difficulty: "Medium",
        answer: `**Structure your presentation:**

**1. Start with the "So What?"**
- Lead with insights, not methodology
- "Sales dropped 15% because..." not "I ran a regression..."

**2. Know Your Audience**

| Audience | Focus On |
|----------|----------|
| Executives | Key metrics, recommendations, impact |
| Managers | Trends, actionable insights |
| Technical team | Methodology, data quality |

**3. Use the Pyramid Principle**
\`\`\`
       [Recommendation]
      /        |        \\
[Insight 1] [Insight 2] [Insight 3]
    |            |            |
 [Data]       [Data]       [Data]
\`\`\`

**4. Visualization Best Practices**
- One insight per slide
- Use annotations to guide attention
- Compare to benchmarks (vs. last year, vs. target)

**5. Template Structure:**
1. **Executive Summary** (1 slide)
2. **Key Findings** (3-5 slides)
3. **Recommendations** (1-2 slides)
4. **Appendix** (methodology, detailed data)

**Communication Tips:**
- Avoid jargon ("correlation" → "relationship")
- Quantify impact ("saves $50K/month")
- Anticipate questions
- End with clear next steps

**Tools:** PowerPoint, Google Slides, Tableau dashboards`
      },
      { id: 9, text: "What is data normalization?", difficulty: "Medium" },
      { id: 10, text: "How do you validate data quality?", difficulty: "Medium" },
      { id: 11, text: "Explain the concept of data granularity.", difficulty: "Medium" },
      { id: 12, text: "How do you approach exploratory data analysis?", difficulty: "Medium" },
      { 
        id: 13, 
        text: "What is the difference between correlation and causation?", 
        difficulty: "Medium",
        answer: `**Correlation** = Two variables move together
**Causation** = One variable directly causes changes in another

**Key Difference:**
\`\`\`
Correlation: Ice cream sales ↔ Drowning deaths (both ↑ in summer)
Causation: Smoking → Lung cancer (direct cause-effect)
\`\`\`

**Correlation Examples:**
- Height and weight (correlated, not causal)
- Study hours and test scores (correlated, likely causal)
- Shoe size and reading ability in children (correlated via age, not causal)

**How to Test for Causation:**

**1. Randomized Controlled Trial (RCT)**
\`\`\`
Group A: Gets treatment → Measure outcome
Group B: No treatment → Measure outcome
Compare results
\`\`\`

**2. Natural Experiments**
- Find situations where one variable changed naturally
- Compare before/after or similar groups

**3. Koch's Postulates (for causal claims):**
1. Temporal precedence (cause before effect)
2. Correlation (variables related)
3. No alternative explanations

**Correlation Strength:**
\`\`\`
r = +1.0  Perfect positive
r = +0.7  Strong positive
r = +0.3  Weak positive
r = 0     No correlation
r = -0.7  Strong negative
\`\`\`

**Famous fallacy:** "Correlation ≠ Causation"
More pirates → Lower global temperatures 🏴‍☠️❄️`
      },
      { id: 14, text: "How do you create effective dashboards?", difficulty: "Medium" },
      { id: 15, text: "Explain time series analysis basics.", difficulty: "Hard" },
      { id: 16, text: "How do you handle large datasets efficiently?", difficulty: "Hard" },
      { id: 17, text: "What is statistical significance and how do you test for it?", difficulty: "Hard" },
      { id: 18, text: "How do you build predictive models using Excel or BI tools?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Write a function to detect outliers.", difficulty: "Medium" },
      { 
        id: 2, 
        text: "Implement a moving average calculation.", 
        difficulty: "Easy",
        answer: `**Moving Average** smooths data by averaging nearby points.

**Simple Moving Average (SMA):**
\`\`\`python
def simple_moving_average(data, window):
    result = []
    for i in range(len(data)):
        if i < window - 1:
            result.append(None)  # Not enough data
        else:
            avg = sum(data[i - window + 1:i + 1]) / window
            result.append(avg)
    return result

# Example
prices = [10, 12, 11, 13, 15, 14, 16]
sma_3 = simple_moving_average(prices, 3)
# [None, None, 11.0, 12.0, 13.0, 14.0, 15.0]
\`\`\`

**Pandas Implementation:**
\`\`\`python
import pandas as pd

df['SMA_7'] = df['price'].rolling(window=7).mean()
df['SMA_30'] = df['price'].rolling(window=30).mean()
\`\`\`

**Exponential Moving Average (EMA):**
More weight to recent values.
\`\`\`python
def ema(data, span):
    alpha = 2 / (span + 1)
    result = [data[0]]
    for i in range(1, len(data)):
        result.append(alpha * data[i] + (1 - alpha) * result[-1])
    return result

# Pandas
df['EMA_7'] = df['price'].ewm(span=7).mean()
\`\`\`

**SQL:**
\`\`\`sql
SELECT 
  date,
  value,
  AVG(value) OVER (
    ORDER BY date 
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS moving_avg_7
FROM metrics;
\`\`\`

**Use Cases:**
- Stock price trends
- Sales forecasting
- Noise reduction in sensor data`
      },
      { id: 3, text: "Create a function to calculate percentiles.", difficulty: "Medium" },
      { id: 4, text: "Write a data deduplication algorithm.", difficulty: "Medium" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate percentage growth year over year.", difficulty: "Easy" },
      { id: 2, text: "Interpret a correlation coefficient.", difficulty: "Medium" },
      { id: 3, text: "Calculate compound annual growth rate (CAGR).", difficulty: "Medium" },
      { id: 4, text: "Explain and calculate standard deviation.", difficulty: "Medium" },
      { id: 5, text: "Perform a break-even analysis.", difficulty: "Hard" },
    ],
    "sql-questions": [
      { 
        id: 1, 
        text: "Write complex aggregation queries.", 
        difficulty: "Medium",
        answer: `Complex aggregations combine multiple aggregate functions, groupings, and conditions.

**Multi-level Aggregation:**
\`\`\`sql
SELECT 
  region,
  product_category,
  COUNT(*) as order_count,
  SUM(revenue) as total_revenue,
  AVG(revenue) as avg_order_value,
  MIN(order_date) as first_order,
  MAX(order_date) as last_order
FROM orders
GROUP BY region, product_category
HAVING SUM(revenue) > 10000
ORDER BY total_revenue DESC;
\`\`\`

**Aggregation with CASE:**
\`\`\`sql
SELECT 
  month,
  SUM(CASE WHEN channel = 'online' THEN revenue ELSE 0 END) as online_rev,
  SUM(CASE WHEN channel = 'store' THEN revenue ELSE 0 END) as store_rev,
  SUM(revenue) as total_rev,
  ROUND(SUM(CASE WHEN channel = 'online' THEN revenue ELSE 0 END) * 100.0 / 
        SUM(revenue), 2) as online_pct
FROM sales
GROUP BY month;
\`\`\`

**Rollup for Subtotals:**
\`\`\`sql
SELECT 
  COALESCE(region, 'TOTAL') as region,
  COALESCE(category, 'ALL CATEGORIES') as category,
  SUM(sales) as total_sales
FROM orders
GROUP BY ROLLUP(region, category);
\`\`\`

**Window + Aggregate:**
\`\`\`sql
SELECT 
  date,
  daily_sales,
  SUM(daily_sales) OVER (ORDER BY date) as running_total,
  AVG(daily_sales) OVER (ORDER BY date ROWS 6 PRECEDING) as weekly_avg
FROM daily_metrics;
\`\`\``
      },
      { id: 2, text: "Create a dashboard-ready query.", difficulty: "Medium" },
      { id: 3, text: "Write a query to calculate running totals.", difficulty: "Medium" },
      { id: 4, text: "How do you pivot data using SQL?", difficulty: "Medium" },
      { id: 5, text: "Write a query for cohort analysis.", difficulty: "Hard" },
      { id: 6, text: "Create a query to identify trends over time.", difficulty: "Hard" },
    ],
    "core-cs-questions": [
      { 
        id: 1, 
        text: "What are ETL processes?", 
        difficulty: "Medium",
        answer: `**ETL = Extract, Transform, Load**

The process of moving data from source systems to a data warehouse.

**1. Extract**
Pull data from various sources:
- Databases (MySQL, PostgreSQL)
- APIs (REST, SOAP)
- Files (CSV, JSON, Excel)
- SaaS applications (Salesforce, HubSpot)

\`\`\`python
# Extract from database
df = pd.read_sql("SELECT * FROM orders", connection)

# Extract from API
response = requests.get("https://api.example.com/data")
data = response.json()
\`\`\`

**2. Transform**
Clean and reshape data:
- Remove duplicates
- Handle missing values
- Convert data types
- Apply business rules
- Join datasets

\`\`\`python
# Transform
df['date'] = pd.to_datetime(df['date_string'])
df = df.dropna(subset=['customer_id'])
df['revenue'] = df['quantity'] * df['unit_price']
\`\`\`

**3. Load**
Write to destination:
- Data warehouse (Snowflake, BigQuery)
- Data lake (S3, Azure Blob)
- Database

\`\`\`python
# Load to database
df.to_sql('orders_clean', engine, if_exists='replace')
\`\`\`

**ETL Tools:**
- **Code-based:** Python, Apache Spark
- **GUI-based:** Talend, Informatica, SSIS
- **Cloud-native:** AWS Glue, Azure Data Factory
- **Modern:** dbt, Fivetran, Airbyte

**ELT vs ETL:**
- ETL: Transform before loading (traditional)
- ELT: Load raw, transform in warehouse (modern, scalable)`
      },
      { id: 2, text: "Explain data warehousing concepts.", difficulty: "Medium" },
      { id: 3, text: "What is the difference between OLTP and OLAP?", difficulty: "Hard" },
    ],
  },
  "product-management": {
    "interview-questions": [
      { id: 1, text: "How do you prioritize features?", difficulty: "Easy" },
      { id: 2, text: "What is a product roadmap?", difficulty: "Easy" },
      { id: 3, text: "How do you define success for a product?", difficulty: "Easy" },
      { id: 4, text: "What is a user persona?", difficulty: "Easy" },
      { id: 5, text: "Explain the product lifecycle.", difficulty: "Easy" },
      { id: 6, text: "What is an MVP and why is it important?", difficulty: "Easy" },
      { id: 7, text: "How do you gather customer feedback?", difficulty: "Easy" },
      { id: 8, text: "Explain the RICE framework.", difficulty: "Medium" },
      { id: 9, text: "How do you measure product success?", difficulty: "Medium" },
      { id: 10, text: "What is product-market fit and how do you measure it?", difficulty: "Medium" },
      { id: 11, text: "How do you work with engineering teams?", difficulty: "Medium" },
      { id: 12, text: "Explain the difference between output and outcome.", difficulty: "Medium" },
      { id: 13, text: "What is a north star metric?", difficulty: "Medium" },
      { id: 14, text: "How do you conduct competitive analysis?", difficulty: "Medium" },
      { id: 15, text: "What is the jobs-to-be-done framework?", difficulty: "Medium" },
      { id: 16, text: "How do you handle conflicting stakeholder priorities?", difficulty: "Medium" },
      { id: 17, text: "Explain the Kano model.", difficulty: "Medium" },
      { id: 18, text: "How do you decide when to pivot?", difficulty: "Hard" },
      { id: 19, text: "Design a product for a specific user problem.", difficulty: "Hard" },
      { id: 20, text: "How do you balance technical debt vs new features?", difficulty: "Hard" },
      { id: 21, text: "Explain how you would launch a product internationally.", difficulty: "Hard" },
      { id: 22, text: "How do you build a product strategy?", difficulty: "Hard" },
      { id: 23, text: "What is your approach to pricing strategy?", difficulty: "Hard" },
      { id: 24, text: "How do you manage a product through a crisis?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "How would you structure a decision tree for feature prioritization?", difficulty: "Medium" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate market size for a new product.", difficulty: "Medium" },
      { id: 2, text: "Estimate user acquisition costs.", difficulty: "Medium" },
      { id: 3, text: "Calculate customer lifetime value (CLV).", difficulty: "Medium" },
      { id: 4, text: "Estimate the impact of a feature on revenue.", difficulty: "Hard" },
      { id: 5, text: "Calculate churn rate and its impact.", difficulty: "Medium" },
      { id: 6, text: "Perform a cost-benefit analysis for a feature.", difficulty: "Hard" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to calculate retention rate.", difficulty: "Medium" },
      { id: 2, text: "How do you measure feature adoption using SQL?", difficulty: "Medium" },
      { id: 3, text: "Write a query for funnel analysis.", difficulty: "Hard" },
      { id: 4, text: "Calculate daily/weekly/monthly active users.", difficulty: "Medium" },
    ],
    "core-cs-questions": [
      { id: 1, text: "What is an API and why does it matter for products?", difficulty: "Easy" },
      { id: 2, text: "Explain the concept of technical debt.", difficulty: "Medium" },
      { id: 3, text: "What is scalability and why should PMs care?", difficulty: "Medium" },
    ],
  },
  "ux-ui-design": {
    "interview-questions": [
      { id: 1, text: "What is the design thinking process?", difficulty: "Easy" },
      { id: 2, text: "Explain the difference between UX and UI.", difficulty: "Easy" },
      { id: 3, text: "What is user-centered design?", difficulty: "Easy" },
      { id: 4, text: "Explain the importance of accessibility in design.", difficulty: "Easy" },
      { id: 5, text: "What are the principles of visual hierarchy?", difficulty: "Easy" },
      { id: 6, text: "How do you create a wireframe?", difficulty: "Easy" },
      { id: 7, text: "What is a user journey map?", difficulty: "Easy" },
      { id: 8, text: "How do you conduct user research?", difficulty: "Medium" },
      { id: 9, text: "What are design systems?", difficulty: "Medium" },
      { id: 10, text: "Explain the concept of affordances.", difficulty: "Medium" },
      { id: 11, text: "How do you conduct usability testing?", difficulty: "Medium" },
      { id: 12, text: "What is information architecture?", difficulty: "Medium" },
      { id: 13, text: "How do you design for mobile vs desktop?", difficulty: "Medium" },
      { id: 14, text: "Explain Gestalt principles in design.", difficulty: "Medium" },
      { id: 15, text: "How do you handle design critiques?", difficulty: "Medium" },
      { id: 16, text: "What is a design sprint?", difficulty: "Medium" },
      { id: 17, text: "How do you create and maintain a style guide?", difficulty: "Medium" },
      { id: 18, text: "Explain the concept of micro-interactions.", difficulty: "Medium" },
      { id: 19, text: "How do you measure design success?", difficulty: "Hard" },
      { id: 20, text: "How do you balance user needs with business goals?", difficulty: "Hard" },
      { id: 21, text: "Design a feature for users with disabilities.", difficulty: "Hard" },
      { id: 22, text: "How do you design for international audiences?", difficulty: "Hard" },
      { id: 23, text: "What is your process for redesigning an existing product?", difficulty: "Hard" },
      { id: 24, text: "How do you advocate for design decisions to stakeholders?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "How would you structure a design token system?", difficulty: "Medium" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate conversion rate improvements.", difficulty: "Easy" },
      { id: 2, text: "Interpret A/B test results for design changes.", difficulty: "Medium" },
      { id: 3, text: "Estimate the time to complete a design project.", difficulty: "Medium" },
      { id: 4, text: "Calculate the impact of reduced user friction.", difficulty: "Hard" },
    ],
    "sql-questions": [
      { id: 1, text: "Query user behavior data to inform design decisions.", difficulty: "Medium" },
      { id: 2, text: "Analyze click patterns using SQL.", difficulty: "Medium" },
    ],
    "core-cs-questions": [
      { id: 1, text: "How do animations affect performance?", difficulty: "Medium" },
      { id: 2, text: "What is responsive design and how is it implemented?", difficulty: "Easy" },
      { id: 3, text: "How do CSS and design systems work together?", difficulty: "Medium" },
      { id: 4, text: "What are web accessibility standards (WCAG)?", difficulty: "Medium" },
    ],
  },
  "marketing": {
    "interview-questions": [
      { id: 1, text: "What is digital marketing?", difficulty: "Easy" },
      { id: 2, text: "Explain SEO fundamentals.", difficulty: "Easy" },
      { id: 3, text: "What is the marketing funnel?", difficulty: "Easy" },
      { id: 4, text: "Explain the difference between B2B and B2C marketing.", difficulty: "Easy" },
      { id: 5, text: "What is content marketing?", difficulty: "Easy" },
      { id: 6, text: "How do social media algorithms work?", difficulty: "Easy" },
      { id: 7, text: "What is email marketing best practices?", difficulty: "Easy" },
      { id: 8, text: "How do you measure campaign effectiveness?", difficulty: "Medium" },
      { id: 9, text: "What is marketing automation?", difficulty: "Medium" },
      { id: 10, text: "Explain PPC advertising.", difficulty: "Medium" },
      { id: 11, text: "How do you create a marketing strategy?", difficulty: "Medium" },
      { id: 12, text: "What is conversion rate optimization?", difficulty: "Medium" },
      { id: 13, text: "How do you segment your audience?", difficulty: "Medium" },
      { id: 14, text: "Explain the concept of brand positioning.", difficulty: "Medium" },
      { id: 15, text: "What is influencer marketing?", difficulty: "Medium" },
      { id: 16, text: "How do you create a go-to-market strategy?", difficulty: "Hard" },
      { id: 17, text: "Explain marketing attribution models.", difficulty: "Hard" },
      { id: 18, text: "How do you build a brand from scratch?", difficulty: "Hard" },
      { id: 19, text: "What is growth hacking?", difficulty: "Hard" },
      { id: 20, text: "How do you manage a marketing budget?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Create an algorithm to segment customers.", difficulty: "Medium" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate ROI for a marketing campaign.", difficulty: "Easy" },
      { id: 2, text: "Estimate customer acquisition cost.", difficulty: "Medium" },
      { id: 3, text: "Calculate click-through rate (CTR).", difficulty: "Easy" },
      { id: 4, text: "Determine cost per acquisition (CPA).", difficulty: "Medium" },
      { id: 5, text: "Calculate marketing qualified lead (MQL) conversion.", difficulty: "Medium" },
      { id: 6, text: "Estimate the lifetime value to CAC ratio.", difficulty: "Hard" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to analyze campaign performance.", difficulty: "Medium" },
      { id: 2, text: "Calculate conversion rates across channels.", difficulty: "Medium" },
      { id: 3, text: "Analyze customer journey touchpoints.", difficulty: "Hard" },
    ],
    "core-cs-questions": [
      { id: 1, text: "What are tracking pixels and how do they work?", difficulty: "Medium" },
      { id: 2, text: "Explain cookies and their role in marketing.", difficulty: "Medium" },
    ],
  },
  "sales": {
    "interview-questions": [
      { id: 1, text: "What is the sales funnel?", difficulty: "Easy" },
      { id: 2, text: "How do you handle objections?", difficulty: "Easy" },
      { id: 3, text: "What is the difference between inbound and outbound sales?", difficulty: "Easy" },
      { id: 4, text: "How do you qualify a lead?", difficulty: "Easy" },
      { id: 5, text: "What is cold calling and how do you approach it?", difficulty: "Easy" },
      { id: 6, text: "Explain the importance of CRM systems.", difficulty: "Easy" },
      { id: 7, text: "Explain solution selling.", difficulty: "Medium" },
      { id: 8, text: "How do you forecast sales?", difficulty: "Medium" },
      { id: 9, text: "What is BANT qualification?", difficulty: "Medium" },
      { id: 10, text: "How do you build rapport with prospects?", difficulty: "Medium" },
      { id: 11, text: "Explain the SPIN selling technique.", difficulty: "Medium" },
      { id: 12, text: "How do you handle price negotiations?", difficulty: "Medium" },
      { id: 13, text: "What is account-based selling?", difficulty: "Medium" },
      { id: 14, text: "How do you shorten the sales cycle?", difficulty: "Medium" },
      { id: 15, text: "What is your approach to enterprise sales?", difficulty: "Hard" },
      { id: 16, text: "How do you sell to C-level executives?", difficulty: "Hard" },
      { id: 17, text: "Explain consultative selling.", difficulty: "Hard" },
      { id: 18, text: "How do you manage a complex multi-stakeholder deal?", difficulty: "Hard" },
      { id: 19, text: "What is your strategy for upselling and cross-selling?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Design a lead scoring algorithm.", difficulty: "Medium" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate sales growth rate.", difficulty: "Easy" },
      { id: 2, text: "Estimate quota attainment.", difficulty: "Medium" },
      { id: 3, text: "Calculate win rate.", difficulty: "Easy" },
      { id: 4, text: "Determine average deal size.", difficulty: "Easy" },
      { id: 5, text: "Calculate sales velocity.", difficulty: "Medium" },
      { id: 6, text: "Forecast revenue based on pipeline.", difficulty: "Hard" },
    ],
    "sql-questions": [
      { id: 1, text: "Write a query to analyze sales pipeline.", difficulty: "Medium" },
      { id: 2, text: "Calculate win/loss ratios by segment.", difficulty: "Medium" },
      { id: 3, text: "Analyze sales rep performance.", difficulty: "Medium" },
    ],
    "core-cs-questions": [
      { id: 1, text: "How do CRM systems work?", difficulty: "Easy" },
      { id: 2, text: "What is sales automation?", difficulty: "Medium" },
    ],
  },
  "founders-office": {
    "interview-questions": [
      { id: 1, text: "How do you prioritize multiple projects?", difficulty: "Easy" },
      { id: 2, text: "What is stakeholder management?", difficulty: "Medium" },
      { id: 3, text: "How do you handle ambiguity?", difficulty: "Easy" },
      { id: 4, text: "What does it mean to be resourceful?", difficulty: "Easy" },
      { id: 5, text: "How do you manage up effectively?", difficulty: "Medium" },
      { id: 6, text: "How do you drive cross-functional initiatives?", difficulty: "Medium" },
      { id: 7, text: "What is strategic planning?", difficulty: "Hard" },
      { id: 8, text: "How do you handle confidential information?", difficulty: "Medium" },
      { id: 9, text: "What is your approach to problem-solving?", difficulty: "Medium" },
      { id: 10, text: "How do you build relationships across the organization?", difficulty: "Medium" },
      { id: 11, text: "How do you prepare board meeting materials?", difficulty: "Hard" },
      { id: 12, text: "What is your approach to M&A due diligence?", difficulty: "Hard" },
      { id: 13, text: "How do you support fundraising efforts?", difficulty: "Hard" },
      { id: 14, text: "How do you build company culture as it scales?", difficulty: "Hard" },
      { id: 15, text: "What is your approach to OKR planning?", difficulty: "Medium" },
    ],
    "dsa-questions": [
      { id: 1, text: "Create a framework for project prioritization.", difficulty: "Medium" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate burn rate.", difficulty: "Easy" },
      { id: 2, text: "Estimate runway based on funding.", difficulty: "Medium" },
      { id: 3, text: "Calculate employee headcount cost.", difficulty: "Medium" },
      { id: 4, text: "Model different growth scenarios.", difficulty: "Hard" },
      { id: 5, text: "Calculate unit economics.", difficulty: "Hard" },
    ],
    "sql-questions": [
      { id: 1, text: "Create a company-wide metrics dashboard query.", difficulty: "Medium" },
      { id: 2, text: "Analyze cross-functional project progress.", difficulty: "Medium" },
    ],
    "core-cs-questions": [
      { id: 1, text: "What is a cap table?", difficulty: "Medium" },
      { id: 2, text: "How do stock options work?", difficulty: "Medium" },
    ],
  },
  "blockchain": {
    "interview-questions": [
      { id: 1, text: "What is blockchain?", difficulty: "Easy" },
      { id: 2, text: "Explain the difference between public and private blockchains.", difficulty: "Easy" },
      { id: 3, text: "What is a cryptocurrency wallet?", difficulty: "Easy" },
      { id: 4, text: "Explain the concept of decentralization.", difficulty: "Easy" },
      { id: 5, text: "What is a hash function?", difficulty: "Easy" },
      { id: 6, text: "Explain consensus mechanisms.", difficulty: "Medium" },
      { id: 7, text: "What are smart contracts?", difficulty: "Medium" },
      { id: 8, text: "Explain the difference between Bitcoin and Ethereum.", difficulty: "Medium" },
      { id: 9, text: "What is gas in Ethereum?", difficulty: "Medium" },
      { id: 10, text: "Explain the concept of mining.", difficulty: "Medium" },
      { id: 11, text: "What are Layer 2 solutions?", difficulty: "Medium" },
      { id: 12, text: "How do oracles work?", difficulty: "Medium" },
      { id: 13, text: "Explain the concept of tokenomics.", difficulty: "Medium" },
      { id: 14, text: "How do you secure a blockchain application?", difficulty: "Hard" },
      { id: 15, text: "What are common smart contract vulnerabilities?", difficulty: "Hard" },
      { id: 16, text: "Explain sharding in blockchain.", difficulty: "Hard" },
      { id: 17, text: "What is a 51% attack?", difficulty: "Hard" },
      { id: 18, text: "How do you audit a smart contract?", difficulty: "Hard" },
    ],
    "dsa-questions": [
      { id: 1, text: "Implement a Merkle tree.", difficulty: "Hard" },
      { id: 2, text: "Create a simple blockchain.", difficulty: "Hard" },
      { id: 3, text: "Implement a basic proof-of-work algorithm.", difficulty: "Medium" },
      { id: 4, text: "Create a digital signature verification.", difficulty: "Medium" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate gas fees for transactions.", difficulty: "Medium" },
      { id: 2, text: "Estimate block confirmation times.", difficulty: "Medium" },
      { id: 3, text: "Calculate APY for staking.", difficulty: "Hard" },
    ],
    "sql-questions": [
      { id: 1, text: "Query blockchain data from an explorer API.", difficulty: "Medium" },
      { id: 2, text: "Analyze transaction patterns.", difficulty: "Hard" },
    ],
    "core-cs-questions": [
      { id: 1, text: "Explain cryptographic hashing.", difficulty: "Medium" },
      { id: 2, text: "What is proof of work vs proof of stake?", difficulty: "Hard" },
      { id: 3, text: "Explain elliptic curve cryptography.", difficulty: "Hard" },
      { id: 4, text: "How does Byzantine fault tolerance work?", difficulty: "Hard" },
    ],
  },
  "web3": {
    "interview-questions": [
      { id: 1, text: "What is Web3?", difficulty: "Easy" },
      { id: 2, text: "Explain decentralized applications.", difficulty: "Easy" },
      { id: 3, text: "What are NFTs?", difficulty: "Easy" },
      { id: 4, text: "What is a decentralized identity?", difficulty: "Easy" },
      { id: 5, text: "Explain the concept of self-custody.", difficulty: "Easy" },
      { id: 6, text: "What is MetaMask?", difficulty: "Easy" },
      { id: 7, text: "How do DAOs work?", difficulty: "Medium" },
      { id: 8, text: "Explain DeFi protocols.", difficulty: "Hard" },
      { id: 9, text: "What is yield farming?", difficulty: "Medium" },
      { id: 10, text: "Explain liquidity pools.", difficulty: "Medium" },
      { id: 11, text: "What is an AMM (Automated Market Maker)?", difficulty: "Medium" },
      { id: 12, text: "How do lending protocols work?", difficulty: "Medium" },
      { id: 13, text: "What is a flash loan?", difficulty: "Hard" },
      { id: 14, text: "Explain cross-chain bridges.", difficulty: "Hard" },
      { id: 15, text: "What are the security risks in DeFi?", difficulty: "Hard" },
      { id: 16, text: "How do NFT marketplaces work?", difficulty: "Medium" },
      { id: 17, text: "What is the metaverse?", difficulty: "Medium" },
      { id: 18, text: "Explain token standards (ERC-20, ERC-721, ERC-1155).", difficulty: "Medium" },
    ],
    "dsa-questions": [
      { id: 1, text: "Implement ERC-20 token.", difficulty: "Medium" },
      { id: 2, text: "Create a simple DEX.", difficulty: "Hard" },
      { id: 3, text: "Implement an NFT minting contract.", difficulty: "Medium" },
      { id: 4, text: "Create a basic DAO voting mechanism.", difficulty: "Hard" },
    ],
    "aptitude-questions": [
      { id: 1, text: "Calculate impermanent loss.", difficulty: "Hard" },
      { id: 2, text: "Estimate gas costs for a transaction.", difficulty: "Medium" },
      { id: 3, text: "Calculate token swap rates.", difficulty: "Medium" },
    ],
    "sql-questions": [
      { id: 1, text: "Query NFT ownership data.", difficulty: "Medium" },
      { id: 2, text: "Analyze DeFi protocol usage.", difficulty: "Hard" },
    ],
    "core-cs-questions": [
      { id: 1, text: "How does IPFS work?", difficulty: "Medium" },
      { id: 2, text: "Explain the EVM (Ethereum Virtual Machine).", difficulty: "Hard" },
      { id: 3, text: "What is Solidity?", difficulty: "Medium" },
      { id: 4, text: "How do state channels work?", difficulty: "Hard" },
    ],
  },
};

// Helper function to get questions for a role and category
export const getQuestions = (roleId: string, categoryId: string): Question[] => {
  return questionsData[roleId]?.[categoryId] || [];
};

// Helper function to get all questions for a role
export const getAllQuestionsForRole = (roleId: string): Question[] => {
  const roleData = questionsData[roleId];
  if (!roleData) return [];
  
  return Object.values(roleData).flat();
};

// Helper function to get question counts by difficulty
export const getQuestionCountsByDifficulty = (questions: Question[]) => {
  return {
    easy: questions.filter(q => q.difficulty === "Easy").length,
    medium: questions.filter(q => q.difficulty === "Medium").length,
    hard: questions.filter(q => q.difficulty === "Hard").length,
    total: questions.length,
  };
};
