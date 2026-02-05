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
  
  // Microservices
  { id: "service-discovery", name: "Service Discovery", categoryId: "microservices", description: "Finding services dynamically" },
  { id: "api-gateway", name: "API Gateway", categoryId: "microservices", description: "Entry point for services" },
  { id: "circuit-breaker", name: "Circuit Breaker", categoryId: "microservices", description: "Fault tolerance pattern" },
  
  // Messaging
  { id: "pub-sub", name: "Pub/Sub Pattern", categoryId: "messaging", description: "Publisher-subscriber model" },
  { id: "message-brokers", name: "Message Brokers", categoryId: "messaging", description: "Kafka, RabbitMQ, SQS" },
  { id: "event-driven", name: "Event-Driven Architecture", categoryId: "messaging", description: "Event sourcing, CQRS" },
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
];

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
