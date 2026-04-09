import { Section } from "./dsaLevel1Types";

export const striverSDSections: Section[] = [
  {
    id: "sd-basics-of-system-design",
    title: "Basics of System Design",
    subSections: [
      {
        id: "sd-basics-of-system-design-topics",
        title: "Basics of System Design",
        topics: [
          { id: "sd-1", title: "What is System Design?", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=What+is+System+Design?+system+design", articleUrl: "", practiceUrl: "", note: "Concept | Very High | Understanding HLD vs LLD, why system design matters for interviews", isRevision: false, estTime: "45 min" },
          { id: "sd-2", title: "Client-Server Architecture", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Client-Server+Architecture+system+design", articleUrl: "", practiceUrl: "", note: "Concept | Very High | How clients communicate with servers, request-response model", isRevision: false, estTime: "45 min" },
          { id: "sd-3", title: "IP Addresses, Ports, and Protocols", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=IP+Addresses,+Ports,+and+Protocols+system+design", articleUrl: "", practiceUrl: "", note: "Concept | Very High | TCP/IP, UDP, HTTP, WebSockets fundamentals", isRevision: false, estTime: "45 min" },
          { id: "sd-4", title: "How the Internet Works (DNS, HTTP)", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=How+the+Internet+Works+(DNS,+HTTP)+system+design", articleUrl: "", practiceUrl: "", note: "Concept | Very High | DNS resolution, HTTP request lifecycle, browser to server flow", isRevision: false, estTime: "45 min" },
          { id: "sd-5", title: "Monolithic vs Microservices Architecture", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Monolithic+vs+Microservices+Architecture+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Trade-offs, when to use what, migration strategies", isRevision: false, estTime: "45 min" },
          { id: "sd-6", title: "Vertical Scaling vs Horizontal Scaling", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Vertical+Scaling+vs+Horizontal+Scaling+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Scale-up vs scale-out, pros and cons of each", isRevision: false, estTime: "45 min" },
        ],
      },
    ],
  },
  {
    id: "sd-networking--communication",
    title: "Networking & Communication",
    subSections: [
      {
        id: "sd-networking--communication-topics",
        title: "Networking & Communication",
        topics: [
          { id: "sd-7", title: "HTTP / HTTPS", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=HTTP+/+HTTPS+system+design", articleUrl: "", practiceUrl: "", note: "Concept | Very High | Methods, status codes, headers, SSL/TLS, REST", isRevision: false, estTime: "45 min" },
          { id: "sd-8", title: "REST vs GraphQL vs gRPC", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=REST+vs+GraphQL+vs+gRPC+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Comparison, when to use which, trade-offs", isRevision: false, estTime: "30 min" },
          { id: "sd-9", title: "WebSockets", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=WebSockets+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Full-duplex communication, real-time apps, connection lifecycle", isRevision: false, estTime: "30 min" },
          { id: "sd-10", title: "Long Polling vs WebSockets vs SSE", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Long+Polling+vs+WebSockets+vs+SSE+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Comparison for real-time communication patterns", isRevision: false, estTime: "30 min" },
          { id: "sd-11", title: "API Gateway", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=API+Gateway+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Request routing, rate limiting, auth, aggregation", isRevision: false, estTime: "45 min" },
          { id: "sd-12", title: "API Design Best Practices", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=API+Design+Best+Practices+system+design", articleUrl: "", practiceUrl: "", note: "Both | High | Versioning, pagination, idempotency, error handling", isRevision: false, estTime: "30 min" },
        ],
      },
    ],
  },
  {
    id: "sd-databases",
    title: "Databases",
    subSections: [
      {
        id: "sd-databases-topics",
        title: "Databases",
        topics: [
          { id: "sd-13", title: "SQL vs NoSQL", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=SQL+vs+NoSQL+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Relational vs non-relational, ACID vs BASE, when to use which", isRevision: false, estTime: "45 min" },
          { id: "sd-14", title: "Database Indexing", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Database+Indexing+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | B-Tree, B+ Tree, Hash Index, composite indexes, trade-offs", isRevision: false, estTime: "45 min" },
          { id: "sd-15", title: "Database Sharding", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Database+Sharding+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Horizontal partitioning, shard keys, consistent hashing", isRevision: false, estTime: "45 min" },
          { id: "sd-16", title: "Database Replication", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Database+Replication+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Master-slave, master-master, sync vs async replication", isRevision: false, estTime: "45 min" },
          { id: "sd-17", title: "CAP Theorem", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=CAP+Theorem+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Consistency, Availability, Partition Tolerance trade-offs", isRevision: false, estTime: "45 min" },
          { id: "sd-18", title: "ACID Properties", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=ACID+Properties+system+design", articleUrl: "", practiceUrl: "", note: "Concept | Very High | Atomicity, Consistency, Isolation, Durability in transactions", isRevision: false, estTime: "45 min" },
          { id: "sd-19", title: "Normalization vs Denormalization", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Normalization+vs+Denormalization+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | When to normalize, when to denormalize for performance", isRevision: false, estTime: "30 min" },
          { id: "sd-20", title: "Database Types (Key-Value, Document, Column, Graph)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Database+Types+(Key-Value,+Document,+Column,+Graph)+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Redis, MongoDB, Cassandra, Neo4j — use cases", isRevision: false, estTime: "30 min" },
          { id: "sd-21", title: "Eventual Consistency", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Eventual+Consistency+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | How it works, use cases, trade-offs vs strong consistency", isRevision: false, estTime: "30 min" },
          { id: "sd-22", title: "Database Connection Pooling", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Database+Connection+Pooling+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Medium | Why it matters, configuration, performance impact", isRevision: false, estTime: "20 min" },
        ],
      },
    ],
  },
  {
    id: "sd-caching",
    title: "Caching",
    subSections: [
      {
        id: "sd-caching-topics",
        title: "Caching",
        topics: [
          { id: "sd-23", title: "Introduction to Caching", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Introduction+to+Caching+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Why cache, cache hit/miss, cache ratio", isRevision: false, estTime: "45 min" },
          { id: "sd-24", title: "Cache Eviction Policies", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Cache+Eviction+Policies+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | LRU, LFU, FIFO, TTL-based eviction", isRevision: false, estTime: "45 min" },
          { id: "sd-25", title: "Cache-Aside vs Write-Through vs Write-Behind", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Cache-Aside+vs+Write-Through+vs+Write-Behind+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Caching strategies comparison, when to use each", isRevision: false, estTime: "45 min" },
          { id: "sd-26", title: "Distributed Caching (Redis, Memcached)", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Distributed+Caching+(Redis,+Memcached)+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Architecture, replication, clustering, persistence", isRevision: false, estTime: "45 min" },
          { id: "sd-27", title: "CDN (Content Delivery Network)", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=CDN+(Content+Delivery+Network)+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Edge caching, pull vs push CDN, how it reduces latency", isRevision: false, estTime: "45 min" },
          { id: "sd-28", title: "Cache Invalidation Strategies", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Cache+Invalidation+Strategies+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Time-based, event-based, versioning, thundering herd problem", isRevision: false, estTime: "30 min" },
        ],
      },
    ],
  },
  {
    id: "sd-load-balancing",
    title: "Load Balancing",
    subSections: [
      {
        id: "sd-load-balancing-topics",
        title: "Load Balancing",
        topics: [
          { id: "sd-29", title: "What is a Load Balancer?", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=What+is+a+Load+Balancer?+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Layer 4 vs Layer 7, hardware vs software LB", isRevision: false, estTime: "45 min" },
          { id: "sd-30", title: "Load Balancing Algorithms", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Load+Balancing+Algorithms+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Round Robin, Weighted RR, Least Connections, IP Hash, Consistent Hashing", isRevision: false, estTime: "45 min" },
          { id: "sd-31", title: "Consistent Hashing", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Consistent+Hashing+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | How it works, virtual nodes, use in distributed systems", isRevision: false, estTime: "45 min" },
          { id: "sd-32", title: "Reverse Proxy vs Load Balancer", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Reverse+Proxy+vs+Load+Balancer+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Differences, when to use Nginx, HAProxy", isRevision: false, estTime: "30 min" },
          { id: "sd-33", title: "Health Checks and Failover", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Health+Checks+and+Failover+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Active/passive checks, circuit breakers, graceful degradation", isRevision: false, estTime: "30 min" },
        ],
      },
    ],
  },
  {
    id: "sd-message-queues",
    title: "Message Queues",
    subSections: [
      {
        id: "sd-message-queues-topics",
        title: "Message Queues",
        topics: [
          { id: "sd-34", title: "Introduction to Message Queues", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Introduction+to+Message+Queues+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Why async processing, decoupling producers and consumers", isRevision: false, estTime: "45 min" },
          { id: "sd-35", title: "Kafka vs RabbitMQ vs SQS", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Kafka+vs+RabbitMQ+vs+SQS+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Comparison, architecture differences, when to use which", isRevision: false, estTime: "45 min" },
          { id: "sd-36", title: "Pub/Sub Model", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Pub/Sub+Model+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Publisher-Subscriber pattern, topics, fanout", isRevision: false, estTime: "45 min" },
          { id: "sd-37", title: "Event-Driven Architecture", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Event-Driven+Architecture+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Events vs commands, event sourcing, CQRS", isRevision: false, estTime: "30 min" },
          { id: "sd-38", title: "Idempotency in Message Processing", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Idempotency+in+Message+Processing+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Exactly-once, at-least-once, at-most-once delivery semantics", isRevision: false, estTime: "30 min" },
          { id: "sd-39", title: "Dead Letter Queue (DLQ)", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Dead+Letter+Queue+(DLQ)+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Medium | Handling failed messages, retry strategies", isRevision: false, estTime: "20 min" },
        ],
      },
    ],
  },
  {
    id: "sd-core-concepts",
    title: "Core Concepts",
    subSections: [
      {
        id: "sd-core-concepts-topics",
        title: "Core Concepts",
        topics: [
          { id: "sd-40", title: "Rate Limiting", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Rate+Limiting+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Token bucket, leaky bucket, sliding window, fixed window algorithms", isRevision: false, estTime: "45 min" },
          { id: "sd-41", title: "Heartbeats & Health Monitoring", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Heartbeats+&+Health+Monitoring+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Medium | Liveness, readiness probes, monitoring strategies", isRevision: false, estTime: "20 min" },
          { id: "sd-42", title: "Logging, Monitoring, and Alerting", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Logging,+Monitoring,+and+Alerting+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | ELK stack, Prometheus, Grafana, distributed tracing", isRevision: false, estTime: "30 min" },
          { id: "sd-43", title: "Distributed Locking", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Distributed+Locking+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Redlock, Zookeeper, leader election", isRevision: false, estTime: "30 min" },
          { id: "sd-44", title: "Consensus Algorithms (Paxos, Raft)", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Consensus+Algorithms+(Paxos,+Raft)+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Medium | How distributed systems agree, leader election", isRevision: false, estTime: "20 min" },
          { id: "sd-45", title: "Bloom Filters", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Bloom+Filters+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Medium | Probabilistic data structure, false positives, use cases", isRevision: false, estTime: "20 min" },
          { id: "sd-46", title: "Service Discovery", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Service+Discovery+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Client-side vs server-side, Consul, Eureka, DNS-based", isRevision: false, estTime: "30 min" },
          { id: "sd-47", title: "Circuit Breaker Pattern", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Circuit+Breaker+Pattern+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Fault tolerance, Hystrix, states (open, half-open, closed)", isRevision: false, estTime: "30 min" },
          { id: "sd-48", title: "Data Partitioning Strategies", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Data+Partitioning+Strategies+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Range, Hash, List, Composite partitioning", isRevision: false, estTime: "30 min" },
          { id: "sd-49", title: "Proxy (Forward & Reverse)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Proxy+(Forward+&+Reverse)+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | How proxies work, use cases, Nginx as reverse proxy", isRevision: false, estTime: "30 min" },
          { id: "sd-50", title: "Checksums & Data Integrity", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Checksums+&+Data+Integrity+system+design", articleUrl: "", practiceUrl: "", note: "Concept | Medium | MD5, SHA, CRC for detecting corruption", isRevision: false, estTime: "20 min" },
          { id: "sd-51", title: "Leader Election", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Leader+Election+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Medium | Bully algorithm, Raft, Zookeeper-based election", isRevision: false, estTime: "20 min" },
        ],
      },
    ],
  },
  {
    id: "sd-hld-case-studies",
    title: "HLD Case Studies",
    subSections: [
      {
        id: "sd-hld-case-studies-topics",
        title: "HLD Case Studies",
        topics: [
          { id: "sd-52", title: "Design URL Shortener (TinyURL)", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+URL+Shortener+(TinyURL)+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Hashing, base62, collision handling, analytics, 301 vs 302", isRevision: false, estTime: "45 min" },
          { id: "sd-53", title: "Design Instagram / Photo Sharing", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Instagram+/+Photo+Sharing+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Feed generation, CDN, object storage, news feed ranking", isRevision: false, estTime: "45 min" },
          { id: "sd-54", title: "Design Twitter", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Twitter+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Tweet ingestion, fan-out on write vs read, timeline, trending", isRevision: false, estTime: "45 min" },
          { id: "sd-55", title: "Design WhatsApp / Messaging System", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+WhatsApp+/+Messaging+System+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | 1:1 chat, group chat, delivery receipts, encryption, presence", isRevision: false, estTime: "45 min" },
          { id: "sd-56", title: "Design YouTube / Netflix (Video Streaming)", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+YouTube+/+Netflix+(Video+Streaming)+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Video upload, transcoding, adaptive streaming, CDN, recommendations", isRevision: false, estTime: "45 min" },
          { id: "sd-57", title: "Design Google Search", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Google+Search+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Web crawling, indexing, ranking (PageRank), serving", isRevision: false, estTime: "30 min" },
          { id: "sd-58", title: "Design Uber / Ride Sharing", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Uber+/+Ride+Sharing+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Location tracking, matching, ETA, pricing, geospatial indexing", isRevision: false, estTime: "45 min" },
          { id: "sd-59", title: "Design Dropbox / Google Drive", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Dropbox+/+Google+Drive+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | File storage, sync, chunking, deduplication, conflict resolution", isRevision: false, estTime: "45 min" },
          { id: "sd-60", title: "Design Notification System", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Notification+System+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Push, SMS, email, priority, rate limiting, templates", isRevision: false, estTime: "45 min" },
          { id: "sd-61", title: "Design Rate Limiter", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Rate+Limiter+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Token bucket, sliding window, distributed rate limiting", isRevision: false, estTime: "45 min" },
          { id: "sd-62", title: "Design Web Crawler", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Web+Crawler+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | BFS crawling, politeness, URL frontier, deduplication", isRevision: false, estTime: "30 min" },
          { id: "sd-63", title: "Design Chat Application (Slack)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Chat+Application+(Slack)+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Channels, threads, real-time, search, presence, file sharing", isRevision: false, estTime: "30 min" },
          { id: "sd-64", title: "Design Pastebin", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Pastebin+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Short links, expiry, storage, analytics", isRevision: false, estTime: "30 min" },
          { id: "sd-65", title: "Design Typeahead / Autocomplete", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Typeahead+/+Autocomplete+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Trie-based, pre-computed, ranking, personalization", isRevision: false, estTime: "30 min" },
          { id: "sd-66", title: "Design Distributed Cache", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Distributed+Cache+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Consistent hashing, replication, eviction, Redis cluster", isRevision: false, estTime: "30 min" },
          { id: "sd-67", title: "Design News Feed System", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+News+Feed+System+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Very High | Fan-out, ranking, caching, pagination, celebrity problem", isRevision: false, estTime: "45 min" },
          { id: "sd-68", title: "Design Booking System (BookMyShow)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Booking+System+(BookMyShow)+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Seat selection, concurrency, distributed locking, payments", isRevision: false, estTime: "30 min" },
          { id: "sd-69", title: "Design E-Commerce (Amazon)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+E-Commerce+(Amazon)+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Product catalog, cart, order, payment, inventory, search", isRevision: false, estTime: "30 min" },
          { id: "sd-70", title: "Design Yelp / Nearby Search", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Yelp+/+Nearby+Search+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Geospatial indexing, QuadTree, Geohash, proximity search", isRevision: false, estTime: "30 min" },
          { id: "sd-71", title: "Design Distributed Message Queue", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Distributed+Message+Queue+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Partitioning, replication, ordering, consumer groups", isRevision: false, estTime: "30 min" },
          { id: "sd-72", title: "Design Google Maps", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Google+Maps+system+design", articleUrl: "", practiceUrl: "", note: "HLD | Medium | Tile serving, routing (Dijkstra/A*), ETA, traffic", isRevision: false, estTime: "20 min" },
          { id: "sd-73", title: "Design Payment System", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Payment+System+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Idempotency, double-spend prevention, reconciliation", isRevision: false, estTime: "30 min" },
          { id: "sd-74", title: "Design Distributed ID Generator", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Distributed+ID+Generator+system+design", articleUrl: "", practiceUrl: "", note: "HLD | High | Snowflake, UUID, auto-increment, clock-based", isRevision: false, estTime: "30 min" },
        ],
      },
    ],
  },
  {
    id: "sd-lld--solid--oop",
    title: "LLD - SOLID & OOP",
    subSections: [
      {
        id: "sd-lld--solid--oop-topics",
        title: "LLD - SOLID & OOP",
        topics: [
          { id: "sd-75", title: "SOLID Principles", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=SOLID+Principles+system+design", articleUrl: "", practiceUrl: "", note: "LLD | Very High | Single Responsibility, Open-Closed, Liskov, Interface Segregation, Dependency Inversion", isRevision: false, estTime: "45 min" },
          { id: "sd-76", title: "OOP Concepts (Encapsulation, Abstraction, Inheritance, Polymorphism)", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=OOP+Concepts+(Encapsulation,+Abstraction,+Inheritance,+Polymorphism)+system+design", articleUrl: "", practiceUrl: "", note: "LLD | Very High | Core OOP for clean design", isRevision: false, estTime: "45 min" },
          { id: "sd-77", title: "Design Patterns - Creational", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Patterns+-+Creational+system+design", articleUrl: "", practiceUrl: "", note: "LLD | Very High | Singleton, Factory, Abstract Factory, Builder, Prototype", isRevision: false, estTime: "45 min" },
          { id: "sd-78", title: "Design Patterns - Structural", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Patterns+-+Structural+system+design", articleUrl: "", practiceUrl: "", note: "LLD | High | Adapter, Bridge, Composite, Decorator, Facade, Proxy", isRevision: false, estTime: "30 min" },
          { id: "sd-79", title: "Design Patterns - Behavioral", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Patterns+-+Behavioral+system+design", articleUrl: "", practiceUrl: "", note: "LLD | High | Observer, Strategy, Command, State, Iterator, Template Method", isRevision: false, estTime: "30 min" },
          { id: "sd-80", title: "UML Class Diagrams", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=UML+Class+Diagrams+system+design", articleUrl: "", practiceUrl: "", note: "LLD | High | How to draw and read class diagrams for LLD interviews", isRevision: false, estTime: "30 min" },
        ],
      },
    ],
  },
  {
    id: "sd-lld-case-studies",
    title: "LLD Case Studies",
    subSections: [
      {
        id: "sd-lld-case-studies-topics",
        title: "LLD Case Studies",
        topics: [
          { id: "sd-81", title: "Design Parking Lot System", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Parking+Lot+System+system+design", articleUrl: "", practiceUrl: "", note: "LLD | Very High | Vehicles, spots, floors, payment, entry/exit gates", isRevision: false, estTime: "45 min" },
          { id: "sd-82", title: "Design Elevator System", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Elevator+System+system+design", articleUrl: "", practiceUrl: "", note: "LLD | Very High | Scheduling algorithms (SCAN, LOOK), multiple elevators", isRevision: false, estTime: "45 min" },
          { id: "sd-83", title: "Design Tic-Tac-Toe", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Tic-Tac-Toe+system+design", articleUrl: "", practiceUrl: "", note: "LLD | High | Board, players, win detection, extensible grid size", isRevision: false, estTime: "30 min" },
          { id: "sd-84", title: "Design Snake and Ladder Game", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Snake+and+Ladder+Game+system+design", articleUrl: "", practiceUrl: "", note: "LLD | High | Board, dice, snakes, ladders, multiplayer", isRevision: false, estTime: "30 min" },
          { id: "sd-85", title: "Design BookMyShow (LLD)", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+BookMyShow+(LLD)+system+design", articleUrl: "", practiceUrl: "", note: "LLD | Very High | Movie, Theater, Seat, Show, Booking, Payment classes", isRevision: false, estTime: "45 min" },
          { id: "sd-86", title: "Design Library Management System", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Library+Management+System+system+design", articleUrl: "", practiceUrl: "", note: "LLD | High | Books, members, borrowing, fines, search, reservation", isRevision: false, estTime: "30 min" },
          { id: "sd-87", title: "Design Food Delivery App (Swiggy/Zomato LLD)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Food+Delivery+App+(Swiggy/Zomato+LLD)+system+design", articleUrl: "", practiceUrl: "", note: "LLD | High | Restaurant, Menu, Order, Delivery, Payment", isRevision: false, estTime: "30 min" },
          { id: "sd-88", title: "Design ATM Machine", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+ATM+Machine+system+design", articleUrl: "", practiceUrl: "", note: "LLD | High | Account, Card, Transaction, Cash Dispenser, states", isRevision: false, estTime: "30 min" },
          { id: "sd-89", title: "Design Chess Game", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Chess+Game+system+design", articleUrl: "", practiceUrl: "", note: "LLD | High | Board, Pieces (with polymorphism), Move validation, Check/Checkmate", isRevision: false, estTime: "30 min" },
          { id: "sd-90", title: "Design Hotel Booking System", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Hotel+Booking+System+system+design", articleUrl: "", practiceUrl: "", note: "LLD | High | Rooms, Booking, Guest, Payment, Availability", isRevision: false, estTime: "30 min" },
          { id: "sd-91", title: "Design Splitwise", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Splitwise+system+design", articleUrl: "", practiceUrl: "", note: "LLD | Very High | User, Group, Expense, Balance, Settlement", isRevision: false, estTime: "45 min" },
          { id: "sd-92", title: "Design Cab Booking (Uber LLD)", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Cab+Booking+(Uber+LLD)+system+design", articleUrl: "", practiceUrl: "", note: "LLD | High | Rider, Driver, Trip, Fare, Location, Matching", isRevision: false, estTime: "30 min" },
          { id: "sd-93", title: "Design Vending Machine", completed: false, difficulty: "Medium", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Vending+Machine+system+design", articleUrl: "", practiceUrl: "", note: "LLD | High | Product, Inventory, Payment, State Machine pattern", isRevision: false, estTime: "30 min" },
          { id: "sd-94", title: "Design Logger / Logging Framework", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Logger+/+Logging+Framework+system+design", articleUrl: "", practiceUrl: "", note: "LLD | Medium | Log levels, sinks, formatters, Singleton, Observer", isRevision: false, estTime: "20 min" },
          { id: "sd-95", title: "Design LRU Cache (LLD)", completed: false, difficulty: "Hard", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+LRU+Cache+(LLD)+system+design", articleUrl: "", practiceUrl: "", note: "LLD | Very High | Doubly Linked List + HashMap, O(1) get/put", isRevision: false, estTime: "45 min" },
          { id: "sd-96", title: "Design Cricbuzz / Scorecard", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Cricbuzz+/+Scorecard+system+design", articleUrl: "", practiceUrl: "", note: "LLD | Medium | Match, Team, Player, Innings, Over, Ball, Score", isRevision: false, estTime: "20 min" },
          { id: "sd-97", title: "Design Notification Service (LLD)", completed: false, difficulty: "Easy", resourceType: "youtube", resourceUrl: "https://www.youtube.com/results?search_query=Design+Notification+Service+(LLD)+system+design", articleUrl: "", practiceUrl: "", note: "LLD | Medium | Observer pattern, channels, priority, templates", isRevision: false, estTime: "20 min" },
        ],
      },
    ],
  },
];

export const striverSDMeta = {
  id: "striver-sd-sheet" as const,
  title: "Striver"s System Design Sheet",
  description: "97 topics covering HLD, LLD, and system design fundamentals for interviews",
  lastUpdated: "April 2026",
  totalProblems: 97,
  completed: 0,
  easy: 11,
  medium: 42,
  hard: 44,
};