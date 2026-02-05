// System Design Data - HLD and LLD topics, questions, and quiz content
import type { Difficulty } from "./positionResourcesData";

export interface SystemDesignQuestion {
  id: number;
  title: string;
  text: string;
  difficulty: Difficulty;
  categoryId: string;
  topicId: string;
  answer: string;
  options?: { text: string; isCorrect: boolean }[];
}

export interface SystemDesignTopic {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
}

export interface SystemDesignCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  type: "hld" | "lld";
}

// HLD Categories
export const hldCategories: SystemDesignCategory[] = [
  { id: "scalability", name: "Scalability", icon: "TrendingUp", color: "from-blue-500 to-cyan-500", description: "Horizontal & vertical scaling strategies", type: "hld" },
  { id: "load-balancing", name: "Load Balancing", icon: "Scale", color: "from-emerald-500 to-teal-500", description: "Traffic distribution techniques", type: "hld" },
  { id: "caching", name: "Caching Strategies", icon: "Database", color: "from-amber-500 to-orange-500", description: "In-memory and distributed caching", type: "hld" },
  { id: "databases", name: "Database Design", icon: "HardDrive", color: "from-purple-500 to-pink-500", description: "SQL, NoSQL, sharding, replication", type: "hld" },
  { id: "microservices", name: "Microservices", icon: "Boxes", color: "from-red-500 to-rose-500", description: "Service architecture and communication", type: "hld" },
  { id: "messaging", name: "Message Queues", icon: "MessageSquare", color: "from-indigo-500 to-blue-500", description: "Async communication patterns", type: "hld" },
];

// LLD Categories
export const lldCategories: SystemDesignCategory[] = [
  { id: "design-patterns", name: "Design Patterns", icon: "Puzzle", color: "from-violet-500 to-purple-500", description: "Creational, structural, behavioral patterns", type: "lld" },
  { id: "solid", name: "SOLID Principles", icon: "Shield", color: "from-green-500 to-emerald-500", description: "Object-oriented design principles", type: "lld" },
  { id: "uml", name: "UML Diagrams", icon: "FileText", color: "from-sky-500 to-blue-500", description: "Class, sequence, and other diagrams", type: "lld" },
  { id: "case-studies", name: "Case Studies", icon: "Building2", color: "from-orange-500 to-red-500", description: "Real-world system designs", type: "lld" },
];

// HLD Topics
export const hldTopics: SystemDesignTopic[] = [
  // Scalability
  { id: "horizontal-scaling", name: "Horizontal Scaling", categoryId: "scalability", description: "Adding more machines" },
  { id: "vertical-scaling", name: "Vertical Scaling", categoryId: "scalability", description: "Adding more resources" },
  { id: "database-scaling", name: "Database Scaling", categoryId: "scalability", description: "Scaling data layer" },
  
  // Load Balancing
  { id: "lb-algorithms", name: "LB Algorithms", categoryId: "load-balancing", description: "Round robin, least connections" },
  { id: "lb-types", name: "LB Types", categoryId: "load-balancing", description: "L4 vs L7 load balancers" },
  { id: "health-checks", name: "Health Checks", categoryId: "load-balancing", description: "Monitoring service health" },
  
  // Caching
  { id: "cache-strategies", name: "Cache Strategies", categoryId: "caching", description: "Write-through, write-back" },
  { id: "cache-eviction", name: "Cache Eviction", categoryId: "caching", description: "LRU, LFU, TTL policies" },
  { id: "distributed-cache", name: "Distributed Cache", categoryId: "caching", description: "Redis, Memcached" },
  
  // Databases
  { id: "sql-vs-nosql", name: "SQL vs NoSQL", categoryId: "databases", description: "Database type selection" },
  { id: "sharding", name: "Database Sharding", categoryId: "databases", description: "Horizontal partitioning" },
  { id: "replication", name: "Replication", categoryId: "databases", description: "Master-slave, multi-master" },
  { id: "distributed-consensus", name: "Distributed Consensus", categoryId: "databases", description: "Raft, Paxos, leader election" },
  { id: "cap-theorem", name: "CAP Theorem Deep Dive", categoryId: "databases", description: "Consistency, availability, partition tolerance" },
  
  // Microservices
  { id: "service-discovery", name: "Service Discovery", categoryId: "microservices", description: "Finding services dynamically" },
  { id: "api-gateway", name: "API Gateway", categoryId: "microservices", description: "Entry point for services" },
  { id: "circuit-breaker", name: "Circuit Breaker", categoryId: "microservices", description: "Fault tolerance pattern" },
  { id: "saga-pattern", name: "Saga Pattern", categoryId: "microservices", description: "Distributed transactions" },
  { id: "service-mesh", name: "Service Mesh", categoryId: "microservices", description: "Istio, Linkerd infrastructure" },
  
  // Messaging
  { id: "pub-sub", name: "Pub/Sub Pattern", categoryId: "messaging", description: "Publisher-subscriber model" },
  { id: "message-brokers", name: "Message Brokers", categoryId: "messaging", description: "Kafka, RabbitMQ, SQS" },
  { id: "event-driven", name: "Event-Driven Architecture", categoryId: "messaging", description: "Event sourcing, CQRS" },
  { id: "exactly-once", name: "Exactly-Once Delivery", categoryId: "messaging", description: "Message delivery guarantees" },
];

// LLD Topics
export const lldTopics: SystemDesignTopic[] = [
  // Design Patterns
  { id: "creational-patterns", name: "Creational Patterns", categoryId: "design-patterns", description: "Singleton, Factory, Builder" },
  { id: "structural-patterns", name: "Structural Patterns", categoryId: "design-patterns", description: "Adapter, Decorator, Facade" },
  { id: "behavioral-patterns", name: "Behavioral Patterns", categoryId: "design-patterns", description: "Observer, Strategy, Command" },
  
  // SOLID
  { id: "srp", name: "Single Responsibility", categoryId: "solid", description: "One reason to change" },
  { id: "ocp", name: "Open/Closed", categoryId: "solid", description: "Open for extension" },
  { id: "lsp", name: "Liskov Substitution", categoryId: "solid", description: "Substitutability" },
  { id: "isp", name: "Interface Segregation", categoryId: "solid", description: "Client-specific interfaces" },
  { id: "dip", name: "Dependency Inversion", categoryId: "solid", description: "Depend on abstractions" },
  
  // UML
  { id: "class-diagrams", name: "Class Diagrams", categoryId: "uml", description: "Class relationships" },
  { id: "sequence-diagrams", name: "Sequence Diagrams", categoryId: "uml", description: "Interaction flows" },
  { id: "use-case-diagrams", name: "Use Case Diagrams", categoryId: "uml", description: "User interactions" },
  
  // Case Studies
  { id: "parking-lot", name: "Parking Lot System", categoryId: "case-studies", description: "Vehicle management" },
  { id: "elevator", name: "Elevator System", categoryId: "case-studies", description: "Multi-elevator coordination" },
  { id: "library", name: "Library Management", categoryId: "case-studies", description: "Book and member management" },
  { id: "atm", name: "ATM System", categoryId: "case-studies", description: "Banking transactions" },
];

// HLD Questions
export const hldQuestions: SystemDesignQuestion[] = [
  // Scalability Questions
  {
    id: 1,
    title: "What is horizontal scaling?",
    text: "Explain horizontal scaling and when to use it.",
    difficulty: "Easy",
    categoryId: "scalability",
    topicId: "horizontal-scaling",
    answer: `## Horizontal Scaling (Scale Out)

Horizontal scaling means adding more machines to your resource pool to handle increased load.

### Key Characteristics
- Add more servers/instances
- Distribute load across multiple machines
- No single point of failure
- Better fault tolerance

### Example
\`\`\`
Before: 1 server handling 1000 requests/sec
After:  4 servers each handling 250 requests/sec
\`\`\`

### When to Use
- Web servers behind load balancer
- Stateless applications
- When vertical scaling reaches limits`,
    options: [
      { text: "Adding more machines to distribute load", isCorrect: true },
      { text: "Adding more RAM to a single server", isCorrect: false },
      { text: "Upgrading CPU of existing server", isCorrect: false },
      { text: "Reducing the number of servers", isCorrect: false },
    ],
  },
  {
    id: 2,
    title: "What is vertical scaling?",
    text: "Explain vertical scaling and its limitations.",
    difficulty: "Easy",
    categoryId: "scalability",
    topicId: "vertical-scaling",
    answer: `## Vertical Scaling (Scale Up)

Vertical scaling means adding more power (CPU, RAM, storage) to an existing machine.

### Advantages
- Simpler to implement
- No code changes needed
- No distributed system complexity

### Limitations
- Hardware limits (can't add infinite RAM)
- Single point of failure
- Downtime during upgrades
- Expensive high-end hardware

### When to Use
- Database servers (initially)
- Legacy applications
- Quick fixes for capacity`,
    options: [
      { text: "Adding more resources to an existing machine", isCorrect: true },
      { text: "Adding more machines to the cluster", isCorrect: false },
      { text: "Distributing data across servers", isCorrect: false },
      { text: "Using a CDN for content", isCorrect: false },
    ],
  },
  {
    id: 3,
    title: "What is a load balancer?",
    text: "Explain the purpose and function of a load balancer.",
    difficulty: "Easy",
    categoryId: "load-balancing",
    topicId: "lb-algorithms",
    answer: `## Load Balancer

A load balancer distributes incoming network traffic across multiple servers to ensure no single server is overwhelmed.

### Key Functions
- Distribute traffic evenly
- Health monitoring
- SSL termination
- Session persistence

### Common Algorithms
- **Round Robin**: Requests distributed sequentially
- **Least Connections**: Routes to server with fewest active connections
- **IP Hash**: Routes based on client IP
- **Weighted**: Servers get traffic proportional to their capacity`,
    options: [
      { text: "Distributes traffic across multiple servers", isCorrect: true },
      { text: "Stores frequently accessed data in memory", isCorrect: false },
      { text: "Encrypts data between client and server", isCorrect: false },
      { text: "Manages database connections", isCorrect: false },
    ],
  },
  {
    id: 4,
    title: "What is the difference between L4 and L7 load balancing?",
    text: "Compare Layer 4 and Layer 7 load balancers.",
    difficulty: "Medium",
    categoryId: "load-balancing",
    topicId: "lb-types",
    answer: `## L4 vs L7 Load Balancing

### Layer 4 (Transport Layer)
- Works with TCP/UDP
- Faster (less processing)
- Routes based on IP and port
- Cannot inspect packet content

### Layer 7 (Application Layer)
- Works with HTTP/HTTPS
- Can inspect request content
- Routes based on URL, headers, cookies
- More intelligent routing decisions

### Use Cases
- **L4**: High-performance, simple routing
- **L7**: Content-based routing, API gateway, microservices`,
    options: [
      { text: "L4 routes by IP/port, L7 routes by content/URL", isCorrect: true },
      { text: "L4 is slower but more intelligent than L7", isCorrect: false },
      { text: "L7 cannot handle HTTPS traffic", isCorrect: false },
      { text: "They are identical in functionality", isCorrect: false },
    ],
  },
  {
    id: 5,
    title: "What are cache eviction policies?",
    text: "Explain common cache eviction strategies.",
    difficulty: "Medium",
    categoryId: "caching",
    topicId: "cache-eviction",
    answer: `## Cache Eviction Policies

When cache is full, we need strategies to remove items.

### Common Policies
- **LRU (Least Recently Used)**: Removes least recently accessed items
- **LFU (Least Frequently Used)**: Removes least frequently accessed items
- **FIFO (First In First Out)**: Removes oldest items
- **TTL (Time To Live)**: Items expire after set time

### Comparison
| Policy | Best For |
|--------|----------|
| LRU | General purpose, web caching |
| LFU | Popular content caching |
| FIFO | Simple queue-like access |
| TTL | Time-sensitive data |`,
    options: [
      { text: "LRU removes least recently used, LFU removes least frequently used", isCorrect: true },
      { text: "All eviction policies work identically", isCorrect: false },
      { text: "TTL removes the most accessed items", isCorrect: false },
      { text: "FIFO removes the newest items first", isCorrect: false },
    ],
  },
  {
    id: 6,
    title: "What is database sharding?",
    text: "Explain database sharding and its benefits.",
    difficulty: "Medium",
    categoryId: "databases",
    topicId: "sharding",
    answer: `## Database Sharding

Sharding is horizontal partitioning of data across multiple database instances.

### How It Works
- Data is split based on a shard key
- Each shard holds a subset of total data
- Application routes queries to correct shard

### Sharding Strategies
- **Range-based**: Shard by value ranges (A-M, N-Z)
- **Hash-based**: Shard by hash of key
- **Directory-based**: Lookup table for routing

### Benefits
- Horizontal scalability
- Improved query performance
- Geographic distribution

### Challenges
- Cross-shard queries are complex
- Rebalancing shards
- Maintaining consistency`,
    options: [
      { text: "Horizontal partitioning of data across multiple databases", isCorrect: true },
      { text: "Copying all data to multiple servers", isCorrect: false },
      { text: "Compressing database to save space", isCorrect: false },
      { text: "Encrypting sensitive database fields", isCorrect: false },
    ],
  },
  {
    id: 7,
    title: "What is the CAP theorem?",
    text: "Explain the CAP theorem and its implications.",
    difficulty: "Hard",
    categoryId: "databases",
    topicId: "sql-vs-nosql",
    answer: `## CAP Theorem

In a distributed system, you can only guarantee 2 of 3 properties:

### The Three Properties
- **Consistency**: All nodes see the same data at the same time
- **Availability**: Every request receives a response
- **Partition Tolerance**: System works despite network failures

### Trade-offs
- **CP (Consistency + Partition Tolerance)**: MongoDB, Redis
- **AP (Availability + Partition Tolerance)**: Cassandra, DynamoDB
- **CA (Consistency + Availability)**: Traditional RDBMS (single node)

### In Practice
Network partitions are unavoidable, so choose between C and A.`,
    options: [
      { text: "You can only guarantee 2 of 3: Consistency, Availability, Partition Tolerance", isCorrect: true },
      { text: "All three properties can always be achieved", isCorrect: false },
      { text: "CAP stands for Cache, API, Persistence", isCorrect: false },
      { text: "It only applies to SQL databases", isCorrect: false },
    ],
  },
  {
    id: 8,
    title: "What is an API Gateway?",
    text: "Explain the role of an API Gateway in microservices.",
    difficulty: "Medium",
    categoryId: "microservices",
    topicId: "api-gateway",
    answer: `## API Gateway

An API Gateway is a single entry point for all client requests in a microservices architecture.

### Key Responsibilities
- **Request routing**: Routes to appropriate service
- **Authentication**: Validates tokens, API keys
- **Rate limiting**: Prevents abuse
- **Load balancing**: Distributes traffic
- **Caching**: Reduces backend load
- **Protocol translation**: REST to gRPC, etc.

### Popular Solutions
- Kong, AWS API Gateway, Nginx, Zuul

### Benefits
- Simplified client interface
- Centralized cross-cutting concerns
- Decouples clients from services`,
    options: [
      { text: "Single entry point that handles routing, auth, and rate limiting", isCorrect: true },
      { text: "A database for storing API configurations", isCorrect: false },
      { text: "A tool for generating API documentation", isCorrect: false },
      { text: "A type of message queue", isCorrect: false },
    ],
  },
  {
    id: 9,
    title: "What is the Circuit Breaker pattern?",
    text: "Explain the Circuit Breaker pattern and its states.",
    difficulty: "Hard",
    categoryId: "microservices",
    topicId: "circuit-breaker",
    answer: `## Circuit Breaker Pattern

Prevents cascading failures in distributed systems by failing fast when a service is unavailable.

### States
1. **Closed**: Normal operation, requests pass through
2. **Open**: Service failing, requests fail immediately
3. **Half-Open**: Testing if service recovered

### How It Works
\`\`\`
Closed → (failures exceed threshold) → Open
Open → (timeout expires) → Half-Open
Half-Open → (test succeeds) → Closed
Half-Open → (test fails) → Open
\`\`\`

### Benefits
- Prevents resource exhaustion
- Fast failure instead of timeout
- Allows service recovery time

### Implementations
- Hystrix (deprecated), Resilience4j, Polly`,
    options: [
      { text: "Prevents cascading failures by failing fast when services are down", isCorrect: true },
      { text: "Encrypts communication between services", isCorrect: false },
      { text: "Balances load across services", isCorrect: false },
      { text: "Caches responses from services", isCorrect: false },
    ],
  },
  {
    id: 10,
    title: "What is event-driven architecture?",
    text: "Explain event-driven architecture and its benefits.",
    difficulty: "Hard",
    categoryId: "messaging",
    topicId: "event-driven",
    answer: `## Event-Driven Architecture

A design pattern where services communicate through events rather than direct calls.

### Key Concepts
- **Event**: Something that happened (OrderPlaced, UserCreated)
- **Producer**: Emits events
- **Consumer**: Reacts to events
- **Event Bus**: Routes events (Kafka, RabbitMQ)

### Patterns
- **Event Notification**: Simple notification
- **Event-Carried State Transfer**: Event contains all needed data
- **Event Sourcing**: Store state as sequence of events
- **CQRS**: Separate read and write models

### Benefits
- Loose coupling
- Scalability
- Resilience
- Audit trail`,
    options: [
      { text: "Services communicate through events via a message broker", isCorrect: true },
      { text: "Direct synchronous calls between all services", isCorrect: false },
      { text: "A single database shared by all services", isCorrect: false },
      { text: "REST APIs with webhooks only", isCorrect: false },
    ],
  },
  {
    id: 11,
    title: "What is write-through vs write-back caching?",
    text: "Compare write-through and write-back cache strategies.",
    difficulty: "Medium",
    categoryId: "caching",
    topicId: "cache-strategies",
    answer: `## Write-Through vs Write-Back Caching

### Write-Through
- Data written to cache AND database simultaneously
- Higher latency on writes
- Strong consistency
- No data loss on cache failure

### Write-Back (Write-Behind)
- Data written to cache first, then async to database
- Lower write latency
- Risk of data loss on cache failure
- Eventual consistency

### Comparison
| Aspect | Write-Through | Write-Back |
|--------|---------------|------------|
| Latency | Higher | Lower |
| Consistency | Strong | Eventual |
| Data Safety | Safe | Risk of loss |
| Use Case | Critical data | High write volume |`,
    options: [
      { text: "Write-through writes to both immediately, write-back writes to cache first", isCorrect: true },
      { text: "They are identical in behavior", isCorrect: false },
      { text: "Write-back is always faster with no downsides", isCorrect: false },
      { text: "Write-through never writes to the database", isCorrect: false },
    ],
  },
  {
    id: 12,
    title: "What is database replication?",
    text: "Explain database replication strategies.",
    difficulty: "Medium",
    categoryId: "databases",
    topicId: "replication",
    answer: `## Database Replication

Copying and maintaining database objects in multiple databases.

### Master-Slave (Primary-Replica)
- One master handles writes
- Slaves replicate from master
- Slaves handle read queries
- Good for read-heavy workloads

### Multi-Master
- Multiple nodes can accept writes
- More complex conflict resolution
- Better write availability

### Synchronous vs Asynchronous
- **Sync**: Waits for all replicas, strong consistency
- **Async**: Returns immediately, eventual consistency

### Benefits
- High availability
- Read scalability
- Disaster recovery`,
    options: [
      { text: "Maintaining copies of data across multiple database instances", isCorrect: true },
      { text: "Splitting data into smaller pieces", isCorrect: false },
      { text: "Compressing database files", isCorrect: false },
      { text: "Encrypting database connections", isCorrect: false },
    ],
  },
];

// LLD Questions
export const lldQuestions: SystemDesignQuestion[] = [
  // Design Patterns
  {
    id: 101,
    title: "What is the Singleton pattern?",
    text: "Explain the Singleton design pattern and its use cases.",
    difficulty: "Easy",
    categoryId: "design-patterns",
    topicId: "creational-patterns",
    answer: `## Singleton Pattern

Ensures a class has only one instance and provides global access to it.

### Implementation
\`\`\`java
public class Singleton {
    private static Singleton instance;
    
    private Singleton() {} // Private constructor
    
    public static synchronized Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
\`\`\`

### Use Cases
- Database connections
- Configuration managers
- Logging
- Thread pools

### Considerations
- Thread safety
- Lazy vs eager initialization
- Can make testing harder`,
    options: [
      { text: "Ensures only one instance of a class exists globally", isCorrect: true },
      { text: "Creates multiple instances for load balancing", isCorrect: false },
      { text: "Converts one interface to another", isCorrect: false },
      { text: "Defines a family of algorithms", isCorrect: false },
    ],
  },
  {
    id: 102,
    title: "What is the Factory pattern?",
    text: "Explain the Factory design pattern.",
    difficulty: "Easy",
    categoryId: "design-patterns",
    topicId: "creational-patterns",
    answer: `## Factory Pattern

Creates objects without exposing creation logic to the client.

### Simple Factory
\`\`\`java
public class VehicleFactory {
    public Vehicle createVehicle(String type) {
        switch(type) {
            case "car": return new Car();
            case "bike": return new Bike();
            default: throw new IllegalArgumentException();
        }
    }
}
\`\`\`

### Factory Method
- Subclasses decide which class to instantiate
- Uses inheritance

### Abstract Factory
- Creates families of related objects
- More complex but more flexible

### Benefits
- Encapsulates object creation
- Loose coupling
- Easy to add new types`,
    options: [
      { text: "Creates objects without exposing instantiation logic", isCorrect: true },
      { text: "Ensures only one instance exists", isCorrect: false },
      { text: "Adds behavior to objects dynamically", isCorrect: false },
      { text: "Converts one interface to another", isCorrect: false },
    ],
  },
  {
    id: 103,
    title: "What is the Observer pattern?",
    text: "Explain the Observer design pattern.",
    difficulty: "Medium",
    categoryId: "design-patterns",
    topicId: "behavioral-patterns",
    answer: `## Observer Pattern

Defines a one-to-many dependency so that when one object changes state, all dependents are notified.

### Components
- **Subject**: Maintains list of observers, notifies them
- **Observer**: Interface for receiving updates
- **ConcreteObserver**: Implements update logic

### Example
\`\`\`java
interface Observer {
    void update(String message);
}

class Subject {
    private List<Observer> observers = new ArrayList<>();
    
    public void subscribe(Observer o) { observers.add(o); }
    public void unsubscribe(Observer o) { observers.remove(o); }
    
    public void notifyAll(String message) {
        observers.forEach(o -> o.update(message));
    }
}
\`\`\`

### Use Cases
- Event handling systems
- MVC architecture (Model notifies Views)
- Pub/Sub systems`,
    options: [
      { text: "One-to-many dependency where changes notify all dependents", isCorrect: true },
      { text: "Converts one interface to another", isCorrect: false },
      { text: "Creates objects in a factory", isCorrect: false },
      { text: "Wraps an object to add behavior", isCorrect: false },
    ],
  },
  {
    id: 104,
    title: "What is the Strategy pattern?",
    text: "Explain the Strategy design pattern.",
    difficulty: "Medium",
    categoryId: "design-patterns",
    topicId: "behavioral-patterns",
    answer: `## Strategy Pattern

Defines a family of algorithms, encapsulates each one, and makes them interchangeable.

### Structure
\`\`\`java
interface PaymentStrategy {
    void pay(int amount);
}

class CreditCardPayment implements PaymentStrategy {
    public void pay(int amount) { /* credit card logic */ }
}

class PayPalPayment implements PaymentStrategy {
    public void pay(int amount) { /* PayPal logic */ }
}

class ShoppingCart {
    private PaymentStrategy strategy;
    
    public void setPaymentStrategy(PaymentStrategy s) {
        this.strategy = s;
    }
    
    public void checkout(int amount) {
        strategy.pay(amount);
    }
}
\`\`\`

### Benefits
- Open/Closed principle
- Avoids conditionals
- Runtime algorithm switching`,
    options: [
      { text: "Defines interchangeable algorithms that can be selected at runtime", isCorrect: true },
      { text: "Notifies observers when state changes", isCorrect: false },
      { text: "Creates a single instance of a class", isCorrect: false },
      { text: "Builds complex objects step by step", isCorrect: false },
    ],
  },
  {
    id: 105,
    title: "What is the Decorator pattern?",
    text: "Explain the Decorator design pattern.",
    difficulty: "Medium",
    categoryId: "design-patterns",
    topicId: "structural-patterns",
    answer: `## Decorator Pattern

Attaches additional responsibilities to an object dynamically.

### Example
\`\`\`java
interface Coffee {
    double getCost();
    String getDescription();
}

class SimpleCoffee implements Coffee {
    public double getCost() { return 1.0; }
    public String getDescription() { return "Coffee"; }
}

class MilkDecorator implements Coffee {
    private Coffee coffee;
    
    public MilkDecorator(Coffee coffee) {
        this.coffee = coffee;
    }
    
    public double getCost() { return coffee.getCost() + 0.5; }
    public String getDescription() { 
        return coffee.getDescription() + " + Milk"; 
    }
}

// Usage
Coffee coffee = new MilkDecorator(new SimpleCoffee());
\`\`\`

### Benefits
- More flexible than inheritance
- Single Responsibility Principle
- Combine behaviors dynamically`,
    options: [
      { text: "Adds responsibilities to objects dynamically without subclassing", isCorrect: true },
      { text: "Creates families of related objects", isCorrect: false },
      { text: "Defines a skeleton algorithm", isCorrect: false },
      { text: "Provides a simplified interface to a complex system", isCorrect: false },
    ],
  },
  {
    id: 106,
    title: "What is the Adapter pattern?",
    text: "Explain the Adapter design pattern.",
    difficulty: "Easy",
    categoryId: "design-patterns",
    topicId: "structural-patterns",
    answer: `## Adapter Pattern

Converts the interface of a class into another interface clients expect.

### Example
\`\`\`java
// Target interface
interface MediaPlayer {
    void play(String filename);
}

// Adaptee (incompatible interface)
class VLCPlayer {
    void playVLC(String filename) { /* VLC logic */ }
}

// Adapter
class VLCAdapter implements MediaPlayer {
    private VLCPlayer vlc = new VLCPlayer();
    
    public void play(String filename) {
        vlc.playVLC(filename);
    }
}
\`\`\`

### Use Cases
- Legacy system integration
- Third-party library adaptation
- Interface standardization

### Types
- Object Adapter (composition)
- Class Adapter (inheritance)`,
    options: [
      { text: "Converts one interface to another that clients expect", isCorrect: true },
      { text: "Adds behavior to objects dynamically", isCorrect: false },
      { text: "Separates abstraction from implementation", isCorrect: false },
      { text: "Creates a single point of access", isCorrect: false },
    ],
  },
  {
    id: 107,
    title: "What is the Single Responsibility Principle?",
    text: "Explain SRP from SOLID principles.",
    difficulty: "Easy",
    categoryId: "solid",
    topicId: "srp",
    answer: `## Single Responsibility Principle (SRP)

A class should have only one reason to change.

### Bad Example
\`\`\`java
class Employee {
    void calculatePay() { } // Accounting responsibility
    void saveToDatabase() { } // Persistence responsibility
    void generateReport() { } // Reporting responsibility
}
\`\`\`

### Good Example
\`\`\`java
class Employee { /* Employee data */ }
class PayCalculator { void calculatePay(Employee e) { } }
class EmployeeRepository { void save(Employee e) { } }
class ReportGenerator { void generate(Employee e) { } }
\`\`\`

### Benefits
- Easier to maintain
- Easier to test
- Lower coupling
- Better organization`,
    options: [
      { text: "A class should have only one reason to change", isCorrect: true },
      { text: "A class should be open for extension", isCorrect: false },
      { text: "Derived classes must be substitutable", isCorrect: false },
      { text: "Depend on abstractions, not concretions", isCorrect: false },
    ],
  },
  {
    id: 108,
    title: "What is the Open/Closed Principle?",
    text: "Explain OCP from SOLID principles.",
    difficulty: "Medium",
    categoryId: "solid",
    topicId: "ocp",
    answer: `## Open/Closed Principle (OCP)

Software entities should be open for extension but closed for modification.

### Bad Example
\`\`\`java
class AreaCalculator {
    double calculate(Object shape) {
        if (shape instanceof Rectangle) {
            // rectangle logic
        } else if (shape instanceof Circle) {
            // circle logic
        }
        // Adding new shape requires modifying this class
    }
}
\`\`\`

### Good Example
\`\`\`java
interface Shape {
    double area();
}

class Rectangle implements Shape {
    public double area() { return width * height; }
}

class Circle implements Shape {
    public double area() { return Math.PI * radius * radius; }
}

// New shapes can be added without modifying existing code
\`\`\`

### Benefits
- Reduces risk of breaking existing code
- Promotes use of abstractions`,
    options: [
      { text: "Open for extension, closed for modification", isCorrect: true },
      { text: "Only one reason to change", isCorrect: false },
      { text: "Clients should not depend on unused methods", isCorrect: false },
      { text: "High-level modules should not depend on low-level modules", isCorrect: false },
    ],
  },
  {
    id: 109,
    title: "What is the Liskov Substitution Principle?",
    text: "Explain LSP from SOLID principles.",
    difficulty: "Medium",
    categoryId: "solid",
    topicId: "lsp",
    answer: `## Liskov Substitution Principle (LSP)

Objects of a superclass should be replaceable with objects of subclasses without affecting program correctness.

### Violation Example
\`\`\`java
class Rectangle {
    void setWidth(int w) { width = w; }
    void setHeight(int h) { height = h; }
}

class Square extends Rectangle {
    void setWidth(int w) { width = w; height = w; } // Breaks LSP!
    void setHeight(int h) { width = h; height = h; }
}
\`\`\`

### Why It Violates
\`\`\`java
void test(Rectangle r) {
    r.setWidth(5);
    r.setHeight(10);
    assert r.area() == 50; // Fails for Square!
}
\`\`\`

### Solution
- Don't use inheritance when behaviors differ
- Use composition or separate hierarchies`,
    options: [
      { text: "Subclasses must be substitutable for their base classes", isCorrect: true },
      { text: "Classes should have one responsibility", isCorrect: false },
      { text: "Interfaces should be client-specific", isCorrect: false },
      { text: "Depend on abstractions", isCorrect: false },
    ],
  },
  {
    id: 110,
    title: "What is the Dependency Inversion Principle?",
    text: "Explain DIP from SOLID principles.",
    difficulty: "Medium",
    categoryId: "solid",
    topicId: "dip",
    answer: `## Dependency Inversion Principle (DIP)

High-level modules should not depend on low-level modules. Both should depend on abstractions.

### Bad Example
\`\`\`java
class UserService {
    private MySQLDatabase db = new MySQLDatabase(); // Depends on concrete
    
    void saveUser(User u) {
        db.insert(u);
    }
}
\`\`\`

### Good Example
\`\`\`java
interface Database {
    void insert(Object o);
}

class UserService {
    private Database db; // Depends on abstraction
    
    UserService(Database db) {
        this.db = db;
    }
    
    void saveUser(User u) {
        db.insert(u);
    }
}
\`\`\`

### Benefits
- Loose coupling
- Easier testing (mock dependencies)
- Flexibility to change implementations`,
    options: [
      { text: "Depend on abstractions, not concrete implementations", isCorrect: true },
      { text: "Classes should be open for extension", isCorrect: false },
      { text: "One class, one responsibility", isCorrect: false },
      { text: "Subclasses must be substitutable", isCorrect: false },
    ],
  },
  {
    id: 111,
    title: "Design a Parking Lot System",
    text: "What are the key classes for a parking lot system?",
    difficulty: "Medium",
    categoryId: "case-studies",
    topicId: "parking-lot",
    answer: `## Parking Lot System Design

### Key Classes
\`\`\`
ParkingLot
├── levels: Level[]
├── entrances: Entrance[]
├── exits: Exit[]

Level
├── floor: int
├── spots: ParkingSpot[]

ParkingSpot
├── id: String
├── type: SpotType (Compact, Regular, Large)
├── vehicle: Vehicle
├── isAvailable(): boolean

Vehicle (abstract)
├── licensePlate: String
├── Motorcycle, Car, Bus extends Vehicle

Ticket
├── entryTime: DateTime
├── spot: ParkingSpot
├── vehicle: Vehicle
\`\`\`

### Key Methods
- parkVehicle(vehicle): Ticket
- unparkVehicle(ticket): Payment
- getAvailableSpots(vehicleType): int`,
    options: [
      { text: "ParkingLot, Level, ParkingSpot, Vehicle, Ticket classes", isCorrect: true },
      { text: "Only a single ParkingLot class is needed", isCorrect: false },
      { text: "Database tables only, no classes needed", isCorrect: false },
      { text: "REST API endpoints only", isCorrect: false },
    ],
  },
  {
    id: 112,
    title: "What is a class diagram?",
    text: "Explain the purpose and components of UML class diagrams.",
    difficulty: "Easy",
    categoryId: "uml",
    topicId: "class-diagrams",
    answer: `## UML Class Diagrams

Static structure diagram showing classes, attributes, methods, and relationships.

### Class Box
\`\`\`
┌─────────────────┐
│    ClassName    │  ← Class name
├─────────────────┤
│ - attribute: T  │  ← Attributes (- private, + public, # protected)
├─────────────────┤
│ + method(): T   │  ← Methods
└─────────────────┘
\`\`\`

### Relationships
- **Association**: Line (has-a)
- **Aggregation**: Empty diamond (weak has-a)
- **Composition**: Filled diamond (strong has-a)
- **Inheritance**: Triangle arrow (is-a)
- **Dependency**: Dashed arrow (uses)
- **Interface**: Dashed triangle (implements)

### Multiplicity
- 1: Exactly one
- 0..1: Zero or one
- *: Zero or more
- 1..*: One or more`,
    options: [
      { text: "Shows classes, attributes, methods, and their relationships", isCorrect: true },
      { text: "Shows only database tables", isCorrect: false },
      { text: "Shows API endpoints", isCorrect: false },
      { text: "Shows runtime object interactions", isCorrect: false },
    ],
  },
  // Additional LLD Case Studies
  {
    id: 113,
    title: "Design an Elevator System",
    text: "What are the key components for a multi-elevator system?",
    difficulty: "Hard",
    categoryId: "case-studies",
    topicId: "elevator",
    answer: `## Elevator System Design

### Key Classes
\`\`\`
ElevatorController
├── elevators: Elevator[]
├── floors: Floor[]
├── dispatchRequest(request): void

Elevator
├── id: int
├── currentFloor: int
├── direction: Direction (UP, DOWN, IDLE)
├── state: State (MOVING, STOPPED, MAINTENANCE)
├── destinations: Set<int>
├── move(): void
├── openDoors(): void
├── closeDoors(): void

Request
├── sourceFloor: int
├── destinationFloor: int
├── direction: Direction

Floor
├── floorNumber: int
├── upButton: Button
├── downButton: Button
\`\`\`

### Scheduling Algorithms
- **FCFS**: First come, first served
- **SCAN**: Elevator moves in one direction, serving all requests
- **LOOK**: Like SCAN but reverses at last request
- **Destination Dispatch**: Groups passengers by destination`,
    options: [
      { text: "ElevatorController, Elevator, Request, Floor with scheduling algorithms", isCorrect: true },
      { text: "Just a single Elevator class handles everything", isCorrect: false },
      { text: "Only database tables needed", isCorrect: false },
      { text: "Simple queue for requests", isCorrect: false },
    ],
  },
  {
    id: 114,
    title: "Design a Rate Limiter",
    text: "What algorithms can be used for rate limiting?",
    difficulty: "Medium",
    categoryId: "case-studies",
    topicId: "library",
    answer: `## Rate Limiter Design

### Common Algorithms

#### Token Bucket
- Tokens added at fixed rate
- Request consumes token
- Allows bursts up to bucket size

#### Leaky Bucket
- Requests enter bucket, processed at fixed rate
- Overflow requests dropped
- Smooth output rate

#### Fixed Window Counter
- Count requests in fixed time windows
- Reset counter at window boundary
- Simple but can allow 2x rate at boundary

#### Sliding Window Log
- Store timestamp of each request
- Count requests in sliding window
- Memory intensive

#### Sliding Window Counter
- Hybrid of fixed window and sliding log
- Weighted count from current and previous window
- Good balance of accuracy and efficiency

### Implementation
\`\`\`java
class TokenBucket {
    private int tokens;
    private int maxTokens;
    private long lastRefill;
    private int refillRate; // tokens per second
    
    public synchronized boolean tryConsume() {
        refill();
        if (tokens > 0) {
            tokens--;
            return true;
        }
        return false;
    }
}
\`\`\``,
    options: [
      { text: "Token Bucket, Leaky Bucket, Sliding Window algorithms", isCorrect: true },
      { text: "Only simple counters are needed", isCorrect: false },
      { text: "Rate limiting is handled by hardware only", isCorrect: false },
      { text: "No algorithms, just reject random requests", isCorrect: false },
    ],
  },
  {
    id: 115,
    title: "Design a URL Shortener",
    text: "How would you design a service like bit.ly?",
    difficulty: "Medium",
    categoryId: "case-studies",
    topicId: "atm",
    answer: `## URL Shortener Design

### Requirements
- Shorten long URLs to short codes
- Redirect short URLs to original
- Handle billions of URLs
- High availability

### Key Components

#### ID Generation
- **Auto-increment**: Simple but predictable
- **Base62 encoding**: a-z, A-Z, 0-9 (62 chars)
- **Hash-based**: MD5/SHA256 with collision handling
- **Distributed ID**: Snowflake ID for uniqueness

#### Database Schema
\`\`\`sql
CREATE TABLE urls (
    id BIGINT PRIMARY KEY,
    short_code VARCHAR(10) UNIQUE,
    original_url TEXT NOT NULL,
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    user_id BIGINT
);
\`\`\`

#### System Design
\`\`\`
Client → Load Balancer → API Servers → Cache (Redis)
                                    ↓
                              Database (Sharded)
\`\`\`

### Encoding Example
\`\`\`
ID: 125,322,764,568
Base62: "dg2Xc8q"
Short URL: bit.ly/dg2Xc8q
\`\`\``,
    options: [
      { text: "Base62 encoding with distributed ID generation and caching", isCorrect: true },
      { text: "Simply store URLs in a single table with auto-increment", isCorrect: false },
      { text: "Use UUIDs directly as short codes", isCorrect: false },
      { text: "Hash the entire URL and use as short code", isCorrect: false },
    ],
  },
  {
    id: 116,
    title: "What is the Interface Segregation Principle?",
    text: "Explain ISP from SOLID principles.",
    difficulty: "Medium",
    categoryId: "solid",
    topicId: "isp",
    answer: `## Interface Segregation Principle (ISP)

Clients should not be forced to depend on interfaces they don't use.

### Violation Example
\`\`\`java
interface Worker {
    void work();
    void eat();
    void sleep();
}

class Robot implements Worker {
    void work() { /* OK */ }
    void eat() { /* Robots don't eat! */ }
    void sleep() { /* Robots don't sleep! */ }
}
\`\`\`

### Good Example
\`\`\`java
interface Workable {
    void work();
}

interface Eatable {
    void eat();
}

interface Sleepable {
    void sleep();
}

class Human implements Workable, Eatable, Sleepable {
    // Implements all
}

class Robot implements Workable {
    // Only implements what it needs
}
\`\`\`

### Benefits
- Smaller, focused interfaces
- Reduces coupling
- Easier to implement and test
- More flexible design`,
    options: [
      { text: "Clients should not depend on interfaces they don't use", isCorrect: true },
      { text: "Interfaces should have many methods", isCorrect: false },
      { text: "One interface for entire application", isCorrect: false },
      { text: "Interfaces must match class hierarchies", isCorrect: false },
    ],
  },
  {
    id: 117,
    title: "What is the Builder pattern?",
    text: "Explain the Builder design pattern.",
    difficulty: "Medium",
    categoryId: "design-patterns",
    topicId: "creational-patterns",
    answer: `## Builder Pattern

Separates the construction of a complex object from its representation.

### Problem
Constructors with many parameters are hard to use:
\`\`\`java
new Pizza(Size.LARGE, true, true, false, true, "thin", "tomato");
\`\`\`

### Solution
\`\`\`java
class Pizza {
    private final Size size;
    private final boolean cheese;
    private final boolean pepperoni;
    // ...
    
    private Pizza(Builder builder) {
        this.size = builder.size;
        this.cheese = builder.cheese;
        // ...
    }
    
    public static class Builder {
        private Size size;
        private boolean cheese;
        
        public Builder size(Size size) {
            this.size = size;
            return this;
        }
        
        public Builder cheese(boolean cheese) {
            this.cheese = cheese;
            return this;
        }
        
        public Pizza build() {
            return new Pizza(this);
        }
    }
}

// Usage
Pizza pizza = new Pizza.Builder()
    .size(Size.LARGE)
    .cheese(true)
    .pepperoni(true)
    .build();
\`\`\`

### Benefits
- Readable construction
- Immutable objects
- Validation before building`,
    options: [
      { text: "Separates complex object construction with fluent interface", isCorrect: true },
      { text: "Creates single instances of classes", isCorrect: false },
      { text: "Converts one interface to another", isCorrect: false },
      { text: "Defines algorithm skeletons", isCorrect: false },
    ],
  },
  {
    id: 118,
    title: "What is a sequence diagram?",
    text: "Explain UML sequence diagrams and their components.",
    difficulty: "Easy",
    categoryId: "uml",
    topicId: "sequence-diagrams",
    answer: `## UML Sequence Diagrams

Shows how objects interact over time through message passing.

### Components
- **Lifeline**: Vertical dashed line (object's existence)
- **Activation Bar**: Tall rectangle (object is active)
- **Messages**: Horizontal arrows between lifelines
  - Synchronous: Solid arrow, filled head
  - Asynchronous: Solid arrow, open head
  - Return: Dashed arrow

### Example: Login Flow
\`\`\`
┌──────┐          ┌──────────┐          ┌────────┐
│ User │          │Controller│          │Database│
└──┬───┘          └────┬─────┘          └───┬────┘
   │   login(u,p)      │                    │
   │──────────────────>│                    │
   │                   │   validate(u,p)    │
   │                   │───────────────────>│
   │                   │     user data      │
   │                   │<───────────────────│
   │   success/fail    │                    │
   │<──────────────────│                    │
\`\`\`

### When to Use
- Understanding complex interactions
- API design documentation
- Debugging message flow
- Team communication`,
    options: [
      { text: "Shows object interactions over time through messages", isCorrect: true },
      { text: "Shows class hierarchies and relationships", isCorrect: false },
      { text: "Shows database table structures", isCorrect: false },
      { text: "Shows deployment configurations", isCorrect: false },
    ],
  },
];

// Additional HLD Questions for new topics
export const additionalHLDQuestions: SystemDesignQuestion[] = [
  {
    id: 13,
    title: "What is the Raft consensus algorithm?",
    text: "Explain how Raft achieves distributed consensus.",
    difficulty: "Hard",
    categoryId: "databases",
    topicId: "distributed-consensus",
    answer: `## Raft Consensus Algorithm

Raft is a consensus algorithm designed to be understandable. It ensures all nodes in a distributed system agree on the same state.

### Key Concepts

#### Leader Election
- Nodes are: Leader, Follower, or Candidate
- Leader sends heartbeats to maintain authority
- If followers don't receive heartbeat, they become candidates
- Candidate requests votes; majority wins

#### Log Replication
1. Client sends command to leader
2. Leader appends to its log
3. Leader replicates to followers
4. Once majority confirms, entry is committed
5. Leader applies and responds to client

### Terms
- **Term**: Logical clock, increments with each election
- **Committed**: Entry replicated to majority
- **Applied**: Entry executed on state machine

### Safety Guarantees
- Only one leader per term
- Leaders never delete/overwrite entries
- If entry committed, all future leaders have it

### vs Paxos
- Raft is more understandable
- Raft has stronger leader
- Similar performance in practice`,
    options: [
      { text: "Leader election, log replication, and safety through majority consensus", isCorrect: true },
      { text: "All nodes vote on every decision equally", isCorrect: false },
      { text: "Uses timestamps to order events", isCorrect: false },
      { text: "Requires all nodes to be online", isCorrect: false },
    ],
  },
  {
    id: 14,
    title: "Explain the CAP theorem trade-offs in detail",
    text: "How do real systems choose between C, A, and P?",
    difficulty: "Hard",
    categoryId: "databases",
    topicId: "cap-theorem",
    answer: `## CAP Theorem Deep Dive

### The Theorem
During network partition, choose between:
- **Consistency**: All reads get most recent write
- **Availability**: Every request gets a response

### Real-World Trade-offs

#### CP Systems (Consistency + Partition Tolerance)
- MongoDB, Redis Cluster, HBase, Zookeeper
- Reject writes during partition
- Better for: Financial transactions, inventory

#### AP Systems (Availability + Partition Tolerance)
- Cassandra, DynamoDB, CouchDB
- Allow writes during partition, resolve later
- Better for: Social media, analytics

### Consistency Models

| Model | Description |
|-------|-------------|
| Strong | Reads see latest write |
| Eventual | Reads eventually see write |
| Causal | Respects causality ordering |
| Read-your-writes | See your own writes |

### PACELC Extension
- If Partition: choose A or C
- Else (normal operation): choose Latency or Consistency
- Example: Cassandra is PA/EL (AP, but tunable consistency normally)

### Practical Considerations
- Network partitions are rare but happen
- Within datacenter: often CA is achievable
- Across datacenters: must handle partitions`,
    options: [
      { text: "CP sacrifices availability during partitions, AP sacrifices consistency", isCorrect: true },
      { text: "All three can be achieved with enough resources", isCorrect: false },
      { text: "CAP only applies to NoSQL databases", isCorrect: false },
      { text: "Partitions never happen in modern networks", isCorrect: false },
    ],
  },
  {
    id: 15,
    title: "What is the Saga pattern?",
    text: "Explain how Saga handles distributed transactions.",
    difficulty: "Hard",
    categoryId: "microservices",
    topicId: "saga-pattern",
    answer: `## Saga Pattern

A saga is a sequence of local transactions where each transaction updates a service and publishes an event to trigger the next.

### Problem
Distributed transactions (2PC) don't scale well and create tight coupling.

### Types of Sagas

#### Choreography
- Services listen to events and react
- No central coordinator
- Decentralized, loosely coupled
- Harder to understand flow

#### Orchestration
- Central orchestrator directs the saga
- Sends commands to services
- Easier to understand and debug
- Single point of failure risk

### Example: Order Saga

\`\`\`
1. Order Service: Create order (PENDING)
2. Payment Service: Reserve payment
3. Inventory Service: Reserve stock
4. Order Service: Confirm order (CONFIRMED)

If step 3 fails:
3a. Inventory: Rollback (no-op)
2a. Payment: Compensate (release payment)
1a. Order: Compensate (cancel order)
\`\`\`

### Compensating Transactions
- Each step has a compensation action
- Compensations undo the effect (semantically)
- Must be idempotent

### Challenges
- Partial failures and compensation
- Ordering guarantees
- Observability and debugging`,
    options: [
      { text: "Sequence of local transactions with compensating actions for rollback", isCorrect: true },
      { text: "Single distributed transaction across all services", isCorrect: false },
      { text: "Retry failed operations indefinitely", isCorrect: false },
      { text: "Ignore failures and continue", isCorrect: false },
    ],
  },
  {
    id: 16,
    title: "What is a Service Mesh?",
    text: "Explain service mesh architecture and benefits.",
    difficulty: "Medium",
    categoryId: "microservices",
    topicId: "service-mesh",
    answer: `## Service Mesh

A dedicated infrastructure layer for handling service-to-service communication.

### Architecture

#### Data Plane
- Sidecar proxies (e.g., Envoy)
- Deployed alongside each service
- Intercepts all network traffic
- Handles: routing, load balancing, security

#### Control Plane
- Manages and configures proxies
- Examples: Istio, Linkerd, Consul Connect
- Provides: configuration, certificates, policies

### Key Features

| Feature | Description |
|---------|-------------|
| Traffic Management | Routing, load balancing, retries |
| Security | mTLS, authentication, authorization |
| Observability | Metrics, tracing, logging |
| Resilience | Circuit breakers, timeouts, retries |

### Example: Istio Architecture
\`\`\`
┌─────────────────────────────────────┐
│           Control Plane              │
│  (Istiod: Pilot, Citadel, Galley)   │
└───────────────┬─────────────────────┘
                │ Config
    ┌───────────┴───────────┐
    ▼                       ▼
┌─────────┐           ┌─────────┐
│ Service │           │ Service │
│    A    │◄─────────►│    B    │
│ [Envoy] │   mTLS    │ [Envoy] │
└─────────┘           └─────────┘
\`\`\`

### When to Use
- Many microservices
- Need consistent security/observability
- Complex traffic management needs`,
    options: [
      { text: "Infrastructure layer with sidecar proxies for service communication", isCorrect: true },
      { text: "A type of message queue for services", isCorrect: false },
      { text: "Database replication technology", isCorrect: false },
      { text: "Container orchestration platform", isCorrect: false },
    ],
  },
  {
    id: 17,
    title: "What are message delivery guarantees?",
    text: "Explain at-most-once, at-least-once, and exactly-once delivery.",
    difficulty: "Hard",
    categoryId: "messaging",
    topicId: "exactly-once",
    answer: `## Message Delivery Guarantees

### At-Most-Once
- Message delivered 0 or 1 time
- Fire and forget
- No retries
- May lose messages
- Use case: Metrics where loss is acceptable

### At-Least-Once
- Message delivered 1 or more times
- Retry on failure
- May duplicate messages
- Consumer must be idempotent
- Use case: Most applications

### Exactly-Once
- Message delivered exactly 1 time
- Hardest to achieve
- Usually involves transactions

### Achieving Exactly-Once

#### Idempotent Consumers
\`\`\`java
// Store processed message IDs
if (processedIds.contains(messageId)) {
    return; // Already processed
}
process(message);
processedIds.add(messageId);
\`\`\`

#### Transactional Outbox
1. Write to DB and outbox table in transaction
2. Separate process reads outbox and publishes
3. Delete from outbox after confirmation

#### Kafka Exactly-Once
- Idempotent producers (dedup by sequence number)
- Transactional producers (atomic writes)
- Read-process-write transactions

### Trade-offs
| Guarantee | Complexity | Performance | Use Case |
|-----------|------------|-------------|----------|
| At-most-once | Low | High | Metrics |
| At-least-once | Medium | Medium | Most apps |
| Exactly-once | High | Lower | Financial |`,
    options: [
      { text: "At-most-once may lose, at-least-once may duplicate, exactly-once is hardest", isCorrect: true },
      { text: "All guarantees have same performance", isCorrect: false },
      { text: "Exactly-once is easy to achieve", isCorrect: false },
      { text: "Message brokers always guarantee exactly-once", isCorrect: false },
    ],
  },
  {
    id: 18,
    title: "What is consistent hashing?",
    text: "Explain consistent hashing for distributed systems.",
    difficulty: "Medium",
    categoryId: "scalability",
    topicId: "database-scaling",
    answer: `## Consistent Hashing

A technique for distributing data across nodes where adding/removing nodes minimizes data movement.

### Problem with Simple Hashing
\`\`\`
hash(key) % num_servers
\`\`\`
Adding/removing server remaps almost all keys!

### Consistent Hashing Solution

#### The Ring
- Hash space forms a ring (0 to 2^32-1)
- Nodes placed on ring by hash(node_id)
- Keys placed on ring by hash(key)
- Key goes to first node clockwise from its position

#### Adding a Node
- Only keys between new node and predecessor move
- ~1/N keys need to move (vs almost all)

#### Virtual Nodes
- Each physical node gets multiple positions
- Better load distribution
- Handles heterogeneous nodes

### Example
\`\`\`
        ┌───────────────┐
        │     Key1      │
        ▼               │
    ┌──────┐        ┌──────┐
    │Node A│        │Node C│
    └──┬───┘        └──────┘
       │        Ring
       │     ┌──────┐
       └────►│Node B│ ← Key1 stored here
             └──────┘
\`\`\`

### Used In
- DynamoDB, Cassandra
- Memcached, Redis Cluster
- Content delivery networks (CDNs)`,
    options: [
      { text: "Ring-based hashing where only 1/N keys move when nodes change", isCorrect: true },
      { text: "Hashing that always gives same output", isCorrect: false },
      { text: "Encrypting data consistently across nodes", isCorrect: false },
      { text: "Simple modulo-based distribution", isCorrect: false },
    ],
  },
];

// Merge additional questions into main arrays
hldQuestions.push(...additionalHLDQuestions);

// Helper functions
export const getHLDCategories = () => hldCategories;
export const getLLDCategories = () => lldCategories;

export const getTopicsForCategory = (categoryId: string) => {
  const isHLD = hldCategories.some(c => c.id === categoryId);
  return isHLD 
    ? hldTopics.filter(t => t.categoryId === categoryId)
    : lldTopics.filter(t => t.categoryId === categoryId);
};

export const getQuestionsForCategory = (categoryId: string) => {
  const isHLD = hldCategories.some(c => c.id === categoryId);
  return isHLD
    ? hldQuestions.filter(q => q.categoryId === categoryId)
    : lldQuestions.filter(q => q.categoryId === categoryId);
};

export const getAllHLDQuestions = () => hldQuestions;
export const getAllLLDQuestions = () => lldQuestions;

export const getHLDTopics = () => hldTopics;
export const getLLDTopics = () => lldTopics;
