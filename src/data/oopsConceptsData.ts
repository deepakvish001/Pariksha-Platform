// OOPs Concepts Data - Topics, questions, and quiz content
import type { Difficulty } from "./positionResourcesData";

export interface OOPsQuestion {
  id: number;
  title: string;
  text: string;
  difficulty: Difficulty;
  conceptId: string;
  answer: string;
  options?: { text: string; isCorrect: boolean }[];
}

export interface OOPsConcept {
  id: string;
  name: string;
  icon: string;
  color: string;
  importance: "Critical" | "High" | "Medium";
  description: string;
  lessons: number;
}

export const oopsConcepts: OOPsConcept[] = [
  { id: "classes-objects", name: "Classes & Objects", icon: "Box", color: "from-blue-500 to-cyan-500", importance: "Critical", description: "Blueprints for creating objects", lessons: 8 },
  { id: "inheritance", name: "Inheritance", icon: "GitBranch", color: "from-green-500 to-emerald-500", importance: "Critical", description: "Code reuse through class hierarchies", lessons: 7 },
  { id: "polymorphism", name: "Polymorphism", icon: "Shapes", color: "from-purple-500 to-pink-500", importance: "Critical", description: "One interface, multiple implementations", lessons: 8 },
  { id: "encapsulation", name: "Encapsulation", icon: "Lock", color: "from-amber-500 to-orange-500", importance: "Critical", description: "Data hiding and access control", lessons: 5 },
  { id: "abstraction", name: "Abstraction", icon: "Layers", color: "from-indigo-500 to-violet-500", importance: "High", description: "Hiding implementation complexity", lessons: 6 },
  { id: "solid", name: "SOLID Principles", icon: "Diamond", color: "from-rose-500 to-red-500", importance: "Critical", description: "Five principles of OOP design", lessons: 10 },
  { id: "design-patterns", name: "Design Patterns", icon: "Puzzle", color: "from-teal-500 to-cyan-500", importance: "High", description: "Proven solutions to common problems", lessons: 12 },
  { id: "relationships", name: "Object Relationships", icon: "Network", color: "from-sky-500 to-blue-500", importance: "Medium", description: "Association, aggregation, composition", lessons: 5 },
];

export const oopsQuestions: OOPsQuestion[] = [
  // Classes & Objects
  {
    id: 1,
    title: "What is the difference between a class and an object?",
    text: "Explain the relationship between classes and objects in OOP.",
    difficulty: "Easy",
    conceptId: "classes-objects",
    answer: `## Class vs Object

### Class
A **class** is a blueprint or template that defines the structure and behavior of objects.

### Object
An **object** is an instance of a class - a concrete entity created from the class blueprint.

\`\`\`java
// Class - the blueprint
class Car {
    String brand;
    int speed;
    
    void accelerate() {
        speed += 10;
    }
}

// Objects - instances of Car
Car myCar = new Car();    // Object 1
Car yourCar = new Car();  // Object 2
\`\`\`

### Analogy
- **Class**: Architectural blueprint for a house
- **Object**: Actual house built from that blueprint`,
    options: [
      { text: "Class is a blueprint, object is an instance of that blueprint", isCorrect: true },
      { text: "They are the same thing", isCorrect: false },
      { text: "Object is a blueprint, class is an instance", isCorrect: false },
      { text: "Classes cannot have methods", isCorrect: false },
    ],
  },
  {
    id: 2,
    title: "What is a constructor?",
    text: "Explain constructors and their types in OOP.",
    difficulty: "Easy",
    conceptId: "classes-objects",
    answer: `## Constructors

A **constructor** is a special method that initializes an object when it's created.

### Types of Constructors

#### 1. Default Constructor
\`\`\`java
class Person {
    String name;
    Person() {
        name = "Unknown";
    }
}
\`\`\`

#### 2. Parameterized Constructor
\`\`\`java
class Person {
    String name;
    Person(String name) {
        this.name = name;
    }
}
\`\`\`

#### 3. Copy Constructor
\`\`\`java
class Person {
    String name;
    Person(Person other) {
        this.name = other.name;
    }
}
\`\`\`

### Key Points
- Same name as the class
- No return type
- Called automatically on object creation
- Can be overloaded`,
    options: [
      { text: "A special method that initializes objects when created", isCorrect: true },
      { text: "A method that destroys objects", isCorrect: false },
      { text: "A method that can only return integers", isCorrect: false },
      { text: "A static method", isCorrect: false },
    ],
  },
  
  // Inheritance
  {
    id: 101,
    title: "What are the types of inheritance?",
    text: "Explain different types of inheritance in OOP.",
    difficulty: "Medium",
    conceptId: "inheritance",
    answer: `## Types of Inheritance

### 1. Single Inheritance
One child inherits from one parent.
\`\`\`
Parent → Child
\`\`\`

### 2. Multilevel Inheritance
Chain of inheritance.
\`\`\`
Grandparent → Parent → Child
\`\`\`

### 3. Hierarchical Inheritance
Multiple children from one parent.
\`\`\`
     Parent
    /      \\
Child1   Child2
\`\`\`

### 4. Multiple Inheritance
One child from multiple parents (not in Java, use interfaces).
\`\`\`
Parent1  Parent2
    \\    /
     Child
\`\`\`

### 5. Hybrid Inheritance
Combination of above types.

### Java Example
\`\`\`java
class Animal { }
class Dog extends Animal { }      // Single
class Puppy extends Dog { }       // Multilevel
class Cat extends Animal { }      // Hierarchical
\`\`\``,
    options: [
      { text: "Single, Multilevel, Hierarchical, Multiple, Hybrid", isCorrect: true },
      { text: "Only single inheritance exists", isCorrect: false },
      { text: "Public, Private, Protected", isCorrect: false },
      { text: "Static and Dynamic", isCorrect: false },
    ],
  },
  {
    id: 102,
    title: "What is the diamond problem?",
    text: "Explain the diamond problem in multiple inheritance.",
    difficulty: "Hard",
    conceptId: "inheritance",
    answer: `## The Diamond Problem

The diamond problem occurs in multiple inheritance when a class inherits from two classes that have a common ancestor.

\`\`\`
       A
      / \\
     B   C
      \\ /
       D
\`\`\`

### The Issue
If \`A\` has a method \`foo()\`, and both \`B\` and \`C\` inherit it (or override it), which version does \`D\` get?

### Solutions

#### 1. Java's Approach - Interfaces
\`\`\`java
interface A { default void foo() { } }
interface B extends A { }
interface C extends A { }
class D implements B, C {
    // Must override if B and C both override foo()
}
\`\`\`

#### 2. C++ Virtual Inheritance
\`\`\`cpp
class A { };
class B : virtual public A { };
class C : virtual public A { };
class D : public B, public C { }; // Only one copy of A
\`\`\`

#### 3. Python's MRO (Method Resolution Order)
Uses C3 linearization to determine method lookup order.`,
    options: [
      { text: "Ambiguity when a class inherits from two classes with a common ancestor", isCorrect: true },
      { text: "When you inherit from four classes", isCorrect: false },
      { text: "A problem with diamond-shaped data structures", isCorrect: false },
      { text: "Memory leak in inheritance", isCorrect: false },
    ],
  },

  // Polymorphism
  {
    id: 201,
    title: "What is the difference between method overloading and overriding?",
    text: "Explain compile-time vs runtime polymorphism.",
    difficulty: "Medium",
    conceptId: "polymorphism",
    answer: `## Method Overloading vs Overriding

### Method Overloading (Compile-time Polymorphism)
Same method name, different parameters in the **same class**.

\`\`\`java
class Calculator {
    int add(int a, int b) { return a + b; }
    double add(double a, double b) { return a + b; }
    int add(int a, int b, int c) { return a + b + c; }
}
\`\`\`

### Method Overriding (Runtime Polymorphism)
Same method signature in **parent and child class**.

\`\`\`java
class Animal {
    void speak() { System.out.println("..."); }
}

class Dog extends Animal {
    @Override
    void speak() { System.out.println("Woof!"); }
}

Animal a = new Dog();
a.speak(); // "Woof!" - decided at runtime
\`\`\`

| Feature | Overloading | Overriding |
|---------|-------------|------------|
| Classes | Same class | Different classes |
| Binding | Compile-time | Runtime |
| Parameters | Must differ | Must be same |
| Return type | Can differ | Must be same (or covariant) |`,
    options: [
      { text: "Overloading: same name different params; Overriding: same signature in child class", isCorrect: true },
      { text: "They are the same thing", isCorrect: false },
      { text: "Overloading requires inheritance", isCorrect: false },
      { text: "Overriding happens at compile time", isCorrect: false },
    ],
  },

  // Encapsulation
  {
    id: 301,
    title: "What is encapsulation and why is it important?",
    text: "Explain data hiding and access modifiers.",
    difficulty: "Easy",
    conceptId: "encapsulation",
    answer: `## Encapsulation

Encapsulation is the bundling of data (attributes) and methods that operate on that data within a single unit (class), and restricting direct access to some components.

### Implementation
\`\`\`java
public class BankAccount {
    private double balance;  // Hidden data
    
    public double getBalance() {
        return balance;
    }
    
    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
        }
    }
    
    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
        }
    }
}
\`\`\`

### Benefits
1. **Data Protection**: Prevents invalid modifications
2. **Flexibility**: Internal implementation can change
3. **Maintainability**: Easy to modify and debug
4. **Control**: Validate data before changes`,
    options: [
      { text: "Bundling data and methods together while restricting direct access", isCorrect: true },
      { text: "Making all variables public", isCorrect: false },
      { text: "Removing all methods from a class", isCorrect: false },
      { text: "Using only static methods", isCorrect: false },
    ],
  },

  // Abstraction
  {
    id: 401,
    title: "What is the difference between abstract class and interface?",
    text: "Compare abstract classes and interfaces.",
    difficulty: "Medium",
    conceptId: "abstraction",
    answer: `## Abstract Class vs Interface

| Feature | Abstract Class | Interface |
|---------|---------------|-----------|
| Methods | Abstract & concrete | Abstract (default/static since Java 8) |
| Variables | Any type | public static final only |
| Inheritance | Single | Multiple |
| Constructor | Yes | No |
| Access modifiers | Any | public only |

### When to use Abstract Class
- Share code among related classes
- Need non-public members
- Need non-static/non-final fields

### When to use Interface
- Define a contract
- Multiple inheritance needed
- Unrelated classes share behavior

\`\`\`java
abstract class Animal {
    protected String name;
    abstract void speak();
    void sleep() { System.out.println("Zzz"); }
}

interface Flyable {
    void fly();
}

class Bird extends Animal implements Flyable {
    void speak() { System.out.println("Tweet"); }
    public void fly() { System.out.println("Flying"); }
}
\`\`\``,
    options: [
      { text: "Abstract class can have implementation; interface defines contract only", isCorrect: true },
      { text: "They are the same thing", isCorrect: false },
      { text: "Interfaces can have constructors", isCorrect: false },
      { text: "Abstract classes support multiple inheritance", isCorrect: false },
    ],
  },

  // SOLID Principles
  {
    id: 501,
    title: "What is the Single Responsibility Principle?",
    text: "Explain SRP with examples.",
    difficulty: "Medium",
    conceptId: "solid",
    answer: `## Single Responsibility Principle (SRP)

> A class should have only one reason to change.

### Bad Example
\`\`\`java
class Employee {
    void calculateSalary() { }
    void saveToDatabase() { }
    void generateReport() { }
}
// This class has 3 responsibilities!
\`\`\`

### Good Example
\`\`\`java
class Employee {
    private String name;
    private double salary;
    // Only employee data
}

class SalaryCalculator {
    void calculate(Employee e) { }
}

class EmployeeRepository {
    void save(Employee e) { }
}

class ReportGenerator {
    void generate(Employee e) { }
}
\`\`\`

### Benefits
- Easier to understand
- Easier to test
- Reduced coupling
- Changes affect only one area`,
    options: [
      { text: "A class should have only one reason to change", isCorrect: true },
      { text: "A class should only have one method", isCorrect: false },
      { text: "Each method should do one thing", isCorrect: false },
      { text: "Only one person should work on a class", isCorrect: false },
    ],
  },
  {
    id: 502,
    title: "What is the Open/Closed Principle?",
    text: "Explain OCP with examples.",
    difficulty: "Medium",
    conceptId: "solid",
    answer: `## Open/Closed Principle (OCP)

> Software entities should be open for extension but closed for modification.

### Bad Example
\`\`\`java
class AreaCalculator {
    double calculate(Object shape) {
        if (shape instanceof Rectangle) {
            // calculate rectangle
        } else if (shape instanceof Circle) {
            // calculate circle
        }
        // Must modify for each new shape!
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

class AreaCalculator {
    double calculate(Shape shape) {
        return shape.area();  // Works for any shape!
    }
}
\`\`\`

### Benefits
- Add new features without modifying existing code
- Reduced risk of breaking existing functionality
- More maintainable codebase`,
    options: [
      { text: "Open for extension, closed for modification", isCorrect: true },
      { text: "Always keep files open", isCorrect: false },
      { text: "Never change existing code", isCorrect: false },
      { text: "Classes should be open source", isCorrect: false },
    ],
  },
  {
    id: 503,
    title: "What is the Liskov Substitution Principle?",
    text: "Explain LSP with examples.",
    difficulty: "Hard",
    conceptId: "solid",
    answer: `## Liskov Substitution Principle (LSP)

> Objects of a superclass should be replaceable with objects of its subclasses without breaking the application.

### Bad Example
\`\`\`java
class Rectangle {
    void setWidth(int w) { this.width = w; }
    void setHeight(int h) { this.height = h; }
}

class Square extends Rectangle {
    void setWidth(int w) {
        this.width = w;
        this.height = w;  // Violates LSP!
    }
}

// Client code expects Rectangle behavior
Rectangle r = new Square();
r.setWidth(5);
r.setHeight(10);
// Expected area: 50, Actual: 100
\`\`\`

### Good Example
\`\`\`java
interface Shape {
    int area();
}

class Rectangle implements Shape {
    // Rectangle implementation
}

class Square implements Shape {
    // Square implementation
}
\`\`\`

### Key Points
- Subclasses must honor parent's contract
- Don't strengthen preconditions
- Don't weaken postconditions`,
    options: [
      { text: "Subtypes must be substitutable for their base types", isCorrect: true },
      { text: "Named after a person who invented inheritance", isCorrect: false },
      { text: "All methods should be substitutable", isCorrect: false },
      { text: "Only applies to abstract classes", isCorrect: false },
    ],
  },

  // Design Patterns
  {
    id: 601,
    title: "What is the Singleton pattern?",
    text: "Explain the Singleton design pattern.",
    difficulty: "Medium",
    conceptId: "design-patterns",
    answer: `## Singleton Pattern

Ensures a class has only one instance and provides global access to it.

### Implementation
\`\`\`java
public class Singleton {
    private static volatile Singleton instance;
    
    private Singleton() { }  // Private constructor
    
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
\`\`\`

### Use Cases
- Database connections
- Logger instances
- Configuration managers
- Thread pools

### Considerations
- Can make testing difficult
- Considered an anti-pattern by some
- Be careful with thread safety`,
    options: [
      { text: "Ensures only one instance of a class exists globally", isCorrect: true },
      { text: "A pattern for creating single methods", isCorrect: false },
      { text: "Used for creating multiple instances", isCorrect: false },
      { text: "Only used in single-threaded applications", isCorrect: false },
    ],
  },
  {
    id: 602,
    title: "What is the Factory pattern?",
    text: "Explain the Factory design pattern.",
    difficulty: "Medium",
    conceptId: "design-patterns",
    answer: `## Factory Pattern

Provides an interface for creating objects without specifying their concrete classes.

### Implementation
\`\`\`java
interface Animal {
    void speak();
}

class Dog implements Animal {
    public void speak() { System.out.println("Woof!"); }
}

class Cat implements Animal {
    public void speak() { System.out.println("Meow!"); }
}

class AnimalFactory {
    public Animal createAnimal(String type) {
        switch (type) {
            case "dog": return new Dog();
            case "cat": return new Cat();
            default: throw new IllegalArgumentException();
        }
    }
}

// Usage
AnimalFactory factory = new AnimalFactory();
Animal pet = factory.createAnimal("dog");
pet.speak();  // "Woof!"
\`\`\`

### Benefits
- Decouples object creation from usage
- Easy to add new types
- Follows Open/Closed Principle`,
    options: [
      { text: "Creates objects without exposing creation logic to client", isCorrect: true },
      { text: "A factory for creating factories", isCorrect: false },
      { text: "Used only for creating database connections", isCorrect: false },
      { text: "Replaces all constructors", isCorrect: false },
    ],
  },

  // Object Relationships
  {
    id: 701,
    title: "What is the difference between association, aggregation, and composition?",
    text: "Explain object relationships in OOP.",
    difficulty: "Medium",
    conceptId: "relationships",
    answer: `## Object Relationships

### Association
General "uses-a" relationship. Objects are independent.
\`\`\`java
class Teacher {
    void teach(Student s) { }  // Uses Student
}
\`\`\`

### Aggregation (Weak "has-a")
Whole-part relationship where parts can exist independently.
\`\`\`java
class Department {
    List<Employee> employees;  // Employees can exist without Department
}
\`\`\`

### Composition (Strong "has-a")
Whole-part relationship where parts cannot exist without the whole.
\`\`\`java
class House {
    private Room room;  // Room cannot exist without House
    
    House() {
        room = new Room();  // Created with House
    }
}
\`\`\`

| Relationship | Strength | Lifecycle |
|-------------|----------|-----------|
| Association | Weak | Independent |
| Aggregation | Medium | Can exist separately |
| Composition | Strong | Dependent |`,
    options: [
      { text: "Association: uses; Aggregation: has (weak); Composition: has (strong)", isCorrect: true },
      { text: "They are all the same", isCorrect: false },
      { text: "Only composition involves objects", isCorrect: false },
      { text: "Association is the strongest relationship", isCorrect: false },
    ],
  },
  // More Design Patterns
  {
    id: 603,
    title: "What is the Observer pattern?",
    text: "Explain the Observer design pattern.",
    difficulty: "Medium",
    conceptId: "design-patterns",
    answer: `## Observer Pattern

Defines a one-to-many dependency between objects so when one changes state, all dependents are notified.

### Implementation
\`\`\`java
interface Observer {
    void update(String message);
}

interface Subject {
    void attach(Observer o);
    void detach(Observer o);
    void notifyObservers();
}

class NewsAgency implements Subject {
    private List<Observer> observers = new ArrayList<>();
    private String news;
    
    public void setNews(String news) {
        this.news = news;
        notifyObservers();
    }
    
    public void notifyObservers() {
        for (Observer o : observers) {
            o.update(news);
        }
    }
}
\`\`\`

### Use Cases
- Event handling systems
- Model-View-Controller (MVC)
- Reactive programming`,
    options: [
      { text: "One-to-many dependency where state changes notify all observers", isCorrect: true },
      { text: "Watching files for changes", isCorrect: false },
      { text: "A pattern for creating objects", isCorrect: false },
      { text: "Only used in GUI applications", isCorrect: false },
    ],
  },
  {
    id: 604,
    title: "What is the Strategy pattern?",
    text: "Explain the Strategy design pattern.",
    difficulty: "Medium",
    conceptId: "design-patterns",
    answer: `## Strategy Pattern

Defines a family of algorithms, encapsulates each one, and makes them interchangeable.

### Implementation
\`\`\`java
interface PaymentStrategy {
    void pay(int amount);
}

class CreditCardPayment implements PaymentStrategy {
    public void pay(int amount) {
        System.out.println("Paid $" + amount + " with credit card");
    }
}

class PayPalPayment implements PaymentStrategy {
    public void pay(int amount) {
        System.out.println("Paid $" + amount + " with PayPal");
    }
}

class ShoppingCart {
    private PaymentStrategy strategy;
    
    public void setPaymentStrategy(PaymentStrategy strategy) {
        this.strategy = strategy;
    }
    
    public void checkout(int amount) {
        strategy.pay(amount);
    }
}
\`\`\`

### Benefits
- Eliminates conditional statements
- Easy to add new algorithms
- Algorithms can be switched at runtime`,
    options: [
      { text: "Encapsulates algorithms making them interchangeable at runtime", isCorrect: true },
      { text: "A planning strategy for development", isCorrect: false },
      { text: "Only for sorting algorithms", isCorrect: false },
      { text: "Same as the Factory pattern", isCorrect: false },
    ],
  },
  {
    id: 605,
    title: "What is the Builder pattern?",
    text: "Explain the Builder design pattern.",
    difficulty: "Medium",
    conceptId: "design-patterns",
    answer: `## Builder Pattern

Separates object construction from its representation, allowing same construction process to create different representations.

### Implementation
\`\`\`java
class Pizza {
    private String dough;
    private String sauce;
    private String topping;
    
    private Pizza(Builder builder) {
        this.dough = builder.dough;
        this.sauce = builder.sauce;
        this.topping = builder.topping;
    }
    
    public static class Builder {
        private String dough;
        private String sauce;
        private String topping;
        
        public Builder dough(String dough) {
            this.dough = dough;
            return this;
        }
        
        public Builder sauce(String sauce) {
            this.sauce = sauce;
            return this;
        }
        
        public Builder topping(String topping) {
            this.topping = topping;
            return this;
        }
        
        public Pizza build() {
            return new Pizza(this);
        }
    }
}

// Usage
Pizza pizza = new Pizza.Builder()
    .dough("thin")
    .sauce("tomato")
    .topping("cheese")
    .build();
\`\`\``,
    options: [
      { text: "Step-by-step construction of complex objects with fluent interface", isCorrect: true },
      { text: "Building applications", isCorrect: false },
      { text: "Same as Factory pattern", isCorrect: false },
      { text: "Only for immutable objects", isCorrect: false },
    ],
  },

  // More SOLID Principles
  {
    id: 504,
    title: "What is the Interface Segregation Principle?",
    text: "Explain ISP with examples.",
    difficulty: "Medium",
    conceptId: "solid",
    answer: `## Interface Segregation Principle (ISP)

> Clients should not be forced to depend on interfaces they don't use.

### Bad Example
\`\`\`java
interface Worker {
    void work();
    void eat();
    void sleep();
}

class Robot implements Worker {
    public void work() { /* OK */ }
    public void eat() { /* Robots don't eat! */ }
    public void sleep() { /* Robots don't sleep! */ }
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
    public void work() { }
    public void eat() { }
    public void sleep() { }
}

class Robot implements Workable {
    public void work() { }
    // No unnecessary methods!
}
\`\`\`

### Benefits
- More focused interfaces
- Reduced coupling
- Easier to implement and maintain`,
    options: [
      { text: "Many specific interfaces are better than one general-purpose interface", isCorrect: true },
      { text: "Interfaces should be separated into files", isCorrect: false },
      { text: "Only use one interface per class", isCorrect: false },
      { text: "Avoid using interfaces", isCorrect: false },
    ],
  },
  {
    id: 505,
    title: "What is the Dependency Inversion Principle?",
    text: "Explain DIP with examples.",
    difficulty: "Hard",
    conceptId: "solid",
    answer: `## Dependency Inversion Principle (DIP)

> High-level modules should not depend on low-level modules. Both should depend on abstractions.

### Bad Example
\`\`\`java
class EmailService {
    public void send(String message) { }
}

class UserService {
    private EmailService emailService = new EmailService();
    
    public void register(User user) {
        // Direct dependency on EmailService
        emailService.send("Welcome!");
    }
}
\`\`\`

### Good Example
\`\`\`java
interface NotificationService {
    void send(String message);
}

class EmailService implements NotificationService {
    public void send(String message) { }
}

class SMSService implements NotificationService {
    public void send(String message) { }
}

class UserService {
    private NotificationService notificationService;
    
    // Dependency injected
    public UserService(NotificationService service) {
        this.notificationService = service;
    }
    
    public void register(User user) {
        notificationService.send("Welcome!");
    }
}
\`\`\`

### Benefits
- Loose coupling
- Easy to swap implementations
- Better testability (mock dependencies)`,
    options: [
      { text: "Depend on abstractions, not concrete implementations", isCorrect: true },
      { text: "Invert the class hierarchy", isCorrect: false },
      { text: "Dependencies should be inverted in order", isCorrect: false },
      { text: "Low-level modules should depend on high-level modules", isCorrect: false },
    ],
  },

  // More Polymorphism
  {
    id: 202,
    title: "What is dynamic dispatch?",
    text: "Explain dynamic dispatch in polymorphism.",
    difficulty: "Hard",
    conceptId: "polymorphism",
    answer: `## Dynamic Dispatch

Dynamic dispatch determines which implementation to call at runtime based on the actual object type.

### Virtual Method Table (vtable)
\`\`\`java
class Animal {
    void speak() { System.out.println("..."); }
}

class Dog extends Animal {
    @Override
    void speak() { System.out.println("Woof!"); }
}

class Cat extends Animal {
    @Override
    void speak() { System.out.println("Meow!"); }
}

// Runtime polymorphism
Animal[] animals = { new Dog(), new Cat() };
for (Animal a : animals) {
    a.speak();  // Dispatched at runtime
}
// Output: Woof! Meow!
\`\`\`

### How It Works
1. Each object has a pointer to its class's vtable
2. vtable contains pointers to actual method implementations
3. At runtime, correct method is looked up via vtable

### Performance
- Small overhead compared to static dispatch
- JIT compilation can optimize frequent calls`,
    options: [
      { text: "Runtime selection of method implementation based on actual object type", isCorrect: true },
      { text: "Dispatching tasks to multiple threads", isCorrect: false },
      { text: "Same as method overloading", isCorrect: false },
      { text: "Only works with interfaces", isCorrect: false },
    ],
  },

  // More Encapsulation
  {
    id: 302,
    title: "What are access modifiers and their scope?",
    text: "Explain access levels in detail.",
    difficulty: "Easy",
    conceptId: "encapsulation",
    answer: `## Access Modifiers

### Java Access Levels

| Modifier | Class | Package | Subclass | World |
|----------|-------|---------|----------|-------|
| private | ✓ | ✗ | ✗ | ✗ |
| default | ✓ | ✓ | ✗ | ✗ |
| protected | ✓ | ✓ | ✓ | ✗ |
| public | ✓ | ✓ | ✓ | ✓ |

### Best Practices
\`\`\`java
public class Example {
    // Most restrictive by default
    private int internalData;
    
    // Protected for inheritance
    protected void helperMethod() { }
    
    // Public API
    public void doSomething() { }
    
    // Getters/setters for controlled access
    public int getData() {
        return internalData;
    }
    
    public void setData(int value) {
        if (value > 0) {  // Validation
            internalData = value;
        }
    }
}
\`\`\`

### Principle of Least Privilege
Always use the most restrictive access level that works.`,
    options: [
      { text: "private < default < protected < public in visibility scope", isCorrect: true },
      { text: "All modifiers have the same scope", isCorrect: false },
      { text: "protected is most restrictive", isCorrect: false },
      { text: "default means public", isCorrect: false },
    ],
  },

  // More Abstraction
  {
    id: 402,
    title: "When should you use abstraction?",
    text: "Explain use cases for abstraction.",
    difficulty: "Medium",
    conceptId: "abstraction",
    answer: `## When to Use Abstraction

### Use Abstract Classes When:
1. You want to share code among closely related classes
2. You need non-public members or non-final fields
3. You want to provide common implementation

\`\`\`java
abstract class Vehicle {
    protected int speed;
    
    public void accelerate() {
        speed += 10;
    }
    
    abstract void fuelType();  // Must implement
}
\`\`\`

### Use Interfaces When:
1. Unrelated classes need to share behavior
2. You need multiple inheritance
3. You want to specify a contract

\`\`\`java
interface Flyable {
    void fly();
}

class Bird implements Flyable { }
class Airplane implements Flyable { }
class Superhero implements Flyable { }
\`\`\`

### Real-World Example
\`\`\`java
// Abstract class for template method pattern
abstract class DataProcessor {
    public final void process() {
        readData();      // Template method
        processData();
        saveData();
    }
    
    abstract void readData();
    abstract void processData();
    abstract void saveData();
}
\`\`\``,
    options: [
      { text: "Abstract class for shared code, interface for contracts across unrelated classes", isCorrect: true },
      { text: "Always use interfaces over abstract classes", isCorrect: false },
      { text: "Abstraction is only for large projects", isCorrect: false },
      { text: "Use abstraction to hide all code", isCorrect: false },
    ],
  },

  // More Classes & Objects
  {
    id: 3,
    title: "What is the 'this' keyword?",
    text: "Explain the uses of 'this' in Java.",
    difficulty: "Easy",
    conceptId: "classes-objects",
    answer: `## The 'this' Keyword

'this' refers to the current object instance.

### Uses

#### 1. Distinguish instance variables from parameters
\`\`\`java
class Person {
    private String name;
    
    public Person(String name) {
        this.name = name;  // this.name is instance variable
    }
}
\`\`\`

#### 2. Call another constructor
\`\`\`java
class Rectangle {
    private int width, height;
    
    public Rectangle() {
        this(1, 1);  // Call parameterized constructor
    }
    
    public Rectangle(int width, int height) {
        this.width = width;
        this.height = height;
    }
}
\`\`\`

#### 3. Pass current object as argument
\`\`\`java
class Node {
    void addToList(List<Node> list) {
        list.add(this);
    }
}
\`\`\`

#### 4. Return current object (fluent interface)
\`\`\`java
class Builder {
    Builder setName(String name) {
        this.name = name;
        return this;
    }
}
\`\`\``,
    options: [
      { text: "Reference to the current object instance", isCorrect: true },
      { text: "Reference to the parent class", isCorrect: false },
      { text: "A static reference", isCorrect: false },
      { text: "Same as 'super'", isCorrect: false },
    ],
  },
  {
    id: 4,
    title: "What are static members?",
    text: "Explain static variables and methods.",
    difficulty: "Easy",
    conceptId: "classes-objects",
    answer: `## Static Members

Static members belong to the class, not instances.

### Static Variables
\`\`\`java
class Counter {
    private static int count = 0;  // Shared across all instances
    
    public Counter() {
        count++;
    }
    
    public static int getCount() {
        return count;
    }
}

new Counter();
new Counter();
Counter.getCount();  // Returns 2
\`\`\`

### Static Methods
- Cannot access instance variables directly
- Cannot use 'this' keyword
- Called on the class, not objects

\`\`\`java
class MathUtils {
    public static int add(int a, int b) {
        return a + b;
    }
}

MathUtils.add(5, 3);  // No object needed
\`\`\`

### Static Blocks
\`\`\`java
class Database {
    static Connection conn;
    
    static {
        // Runs once when class is loaded
        conn = createConnection();
    }
}
\`\`\``,
    options: [
      { text: "Members that belong to the class, shared across all instances", isCorrect: true },
      { text: "Members that cannot change", isCorrect: false },
      { text: "Members that are always private", isCorrect: false },
      { text: "Same as final members", isCorrect: false },
    ],
  },

  // More Inheritance
  {
    id: 103,
    title: "What is method hiding in Java?",
    text: "Explain the difference between overriding and hiding.",
    difficulty: "Medium",
    conceptId: "inheritance",
    answer: `## Method Hiding vs Overriding

### Method Overriding (Instance Methods)
Runtime polymorphism - actual object type determines which method runs.

\`\`\`java
class Parent {
    void greet() { System.out.println("Parent"); }
}

class Child extends Parent {
    @Override
    void greet() { System.out.println("Child"); }
}

Parent p = new Child();
p.greet();  // Prints "Child" (runtime dispatch)
\`\`\`

### Method Hiding (Static Methods)
Compile-time binding - reference type determines which method runs.

\`\`\`java
class Parent {
    static void staticGreet() { System.out.println("Parent"); }
}

class Child extends Parent {
    static void staticGreet() { System.out.println("Child"); }
}

Parent p = new Child();
p.staticGreet();  // Prints "Parent" (compile-time)
\`\`\`

### Key Difference
| Aspect | Overriding | Hiding |
|--------|-----------|--------|
| Methods | Instance | Static |
| Binding | Runtime | Compile-time |
| Polymorphism | Yes | No |`,
    options: [
      { text: "Hiding uses reference type (compile-time), overriding uses object type (runtime)", isCorrect: true },
      { text: "They are the same thing", isCorrect: false },
      { text: "Hiding only works with private methods", isCorrect: false },
      { text: "Overriding only works with static methods", isCorrect: false },
    ],
  },
];

export const getQuestionsForConcept = (conceptId: string): OOPsQuestion[] => {
  return oopsQuestions.filter((q) => q.conceptId === conceptId);
};
