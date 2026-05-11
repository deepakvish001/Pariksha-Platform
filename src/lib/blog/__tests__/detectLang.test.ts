import { describe, it, expect } from "vitest";
import { detectLanguage, detectLanguageOr } from "../detectLang";

describe("detectLanguage", () => {
  it("detects Python from def + import", () => {
    expect(
      detectLanguage(`import os\n\ndef greet(name):\n    print(f"hello {name}")`),
    ).toBe("py");
  });

  it("detects TypeScript from type annotations", () => {
    expect(
      detectLanguage(`const greet = (name: string): void => {\n  console.log(name);\n}`),
    ).toBe("ts");
  });

  it("detects Java from class declaration", () => {
    expect(
      detectLanguage(`public class Main {\n  public static void main(String[] a) {\n    System.out.println("hi");\n  }\n}`),
    ).toBe("java");
  });

  it("detects C++ from #include + std::", () => {
    expect(
      detectLanguage(`#include <iostream>\nint main(){ std::cout << "hi"; }`),
    ).toBe("cpp");
  });

  it("detects Go from package + fmt", () => {
    expect(
      detectLanguage(`package main\nimport "fmt"\nfunc main(){ fmt.Println("hi") }`),
    ).toBe("go");
  });

  it("detects SQL from select/from/where", () => {
    expect(detectLanguage("SELECT id, name FROM users WHERE active = 1")).toBe("sql");
  });

  it("detects bash from prompt prefix", () => {
    expect(detectLanguage("$ npm install react\n$ bun run dev")).toBe("bash");
  });

  it("detects JSON object", () => {
    expect(detectLanguage(`{ "name": "byteskill", "version": 1 }`)).toBe("json");
  });

  it("returns null on too-short / opaque input", () => {
    expect(detectLanguage("")).toBeNull();
    expect(detectLanguage("abc")).toBeNull();
  });

  it("falls back via detectLanguageOr when no match", () => {
    expect(detectLanguageOr("abc", "text")).toBe("text");
    expect(detectLanguageOr("def x():\n  pass", "text")).toBe("py");
  });
});
