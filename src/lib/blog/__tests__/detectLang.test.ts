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

  it("detects Dockerfile from FROM + RUN directives", () => {
    expect(
      detectLanguage(`FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm ci\nCMD ["node","server.js"]`),
    ).toBe("dockerfile");
  });

  it("detects Makefile from target + tab-indented recipe", () => {
    expect(
      detectLanguage(`.PHONY: build\nbuild:\n\tgo build -o app ./...\n`),
    ).toBe("makefile");
  });

  it("detects GitHub Actions YAML workflow", () => {
    expect(
      detectLanguage(
        `name: CI\non:\n  push:\n    branches: [main]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n`,
      ),
    ).toBe("yaml");
  });

  it("detects TOML from section header + key=value", () => {
    expect(
      detectLanguage(`[package]\nname = "byteskill"\nversion = "0.1.0"`),
    ).toBe("toml");
  });

  it("detects nginx config", () => {
    expect(
      detectLanguage(`server {\n  listen 80;\n  location /api {\n    proxy_pass http://app;\n  }\n}`),
    ).toBe("nginx");
  });

  it("detects GraphQL schema", () => {
    expect(
      detectLanguage(`type User {\n  id: ID!\n  name: String\n}\n`),
    ).toBe("graphql");
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
