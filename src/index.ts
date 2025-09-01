#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import z from "zod";

dotenv.config({ path: ".env.development.local", quiet: true });

const CODAVERI_API_BASE_URL = process.env.CODAVERI_API_BASE_URL;
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY is not set in .env.development.local");
}

const server = new McpServer({
  name: "codaveri",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});

interface compile {
  stdout: string;
  stderr: string;
  code: number;
  output: string;
  signal: number;
  cpuTime: number;
  wallTime: number;
  memory: number;
  message: string;
  status: string;
}

interface testcase {
  index: number;
  visibility: string;
  input: string;
  output: string;
}

interface IOResults {
  compile: compile;
  run: compile;
  testcase: testcase;
}

interface ResponseExecute {
  success: boolean;
  message: string;
  data: {
    id: string;
    IOResults: IOResults[];
    exprResults: [];
    transactionId: string;
  };
}

server.tool(
  "executeCode",
  "Execute code",
  {
    code: z.string().describe("The code to be executed"),
    language: z
      .enum([
        "python",
        "javascript",
        "java",
        "c",
        "cpp",
        "typescript",
        "go",
        "rust",
        "csharp",
      ])
      .describe("The programming language of the code"),
  },
  async (params: { code: string; language: string }) => {
    const { code, language } = params;
    function getFilePathAndVersion(language: string): {
      path: string;
      version: string;
    } {
      switch (language) {
        case "python":
          return { path: "main.py", version: "3.12" };
        case "javascript":
          return { path: "main.js", version: "22.16.0" };
        case "java":
          return { path: "main.java", version: "17.0" };
        case "c":
          return { path: "main.c", version: "10.2" };
        case "cpp":
          return { path: "main.cpp", version: "10.2" };
        case "typescript":
          return { path: "main.ts", version: "5.8.3" };
        case "go":
          return { path: "main.go", version: "1.16.2" };
        case "rust":
          return { path: "main.rs", version: "1.68.2" };
        case "csharp":
          return { path: "main.cs", version: "5.0.201" };
        // Add more cases for other languages as needed
        default:
          throw new Error(`Unsupported language: ${language}`);
      }
    }

    const { path, version } = getFilePathAndVersion(language);

    try {
      const response = await fetch(`${CODAVERI_API_BASE_URL}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2.1",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          files: [
            {
              path,
              content: code,
            },
          ],
          languageVersion: {
            language,
            version,
          },
          testcases: {
            IOTestcases: [
              {
                index: 1,
                input: "",
                output: "",
              },
            ],
          },
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `API Error: ${response.status} ${response.statusText} - ${errorBody}`
        );
      }
      const postResult: ResponseExecute = await response.json();
      const executeId = postResult.data.id;

      // keep on polling GET /execute?id=${executeId} with a frequency of 1s until we get a 200 response code
      const poll = async () => {
        const response = await fetch(
          `${CODAVERI_API_BASE_URL}/execute?id=${executeId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-api-version": "2.1",
              "x-api-key": apiKey,
            },
          }
        );
        if (response.status === 200) {
          const result: ResponseExecute = await response.json();
          return result;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return poll();
      };
      const result = await poll();

      return {
        content: [
          {
            type: "text",
            text: result.data.IOResults[0].run.stdout || "No output",
          },
        ],
      };
    } catch (error) {
      console.error("Error executing code:", error);
      throw error;
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  //   console.error("Codaveri MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
