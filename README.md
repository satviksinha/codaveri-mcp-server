# Codaveri MCP Server

This is a Model-Context-Protocol (MCP) server for the Codaveri API, allowing you to execute code in various languages.

## Installation

1.  Clone the repository:

    ```sh
    git clone https://github.com/satviksinha/codaveri-mcp-server.git
    ```

2.  Install the dependencies:
    ```sh
    npm install
    ```

## Configuration

1.  Create a `.env.development.local` file in the root of the project.
2.  Add your Codaveri API key to the file:
    ```
    API_KEY=<your_codaveri_api_key>
    CODAVERI_API_BASE_URL=<codaveri-url>
    ```

## Environment Variables

Create a `.env.development.local` file in the root of the project with the following variables:

```
API_KEY=<your_codaveri_api_key>
CODAVERI_API_BASE_URL=<api-url>
```

Replace `your_codaveri_api_key` with your actual API key.

## Building the Server

To build the server, run the following command:

```sh
npm run build
```

This will compile the TypeScript code into JavaScript and place it in the `build` directory.

## Running the Server

You can run the server locally using `npm link`:

1.  Link the package to make the `codaveri` command available globally:

    ```sh
    npm link
    ```

2.  Now you can run the server by simply typing `codaveri` in your terminal.

## Client Integration

To use this server in an MCP client, you need to configure the client to connect to the `codaveri` command.

Here is an example of how you might configure your MCP client:

```json
{
  "mcpServers": {
    "codaveri": {
      "command": "codaveri"
    }
  }
}
```

## `executeCode` Tool

This server provides a single tool, `executeCode`.

### Description

Executes a given code snippet in a specified language and returns the output.

### Parameters

- `code` (string, required): The code to be executed.
- `language` (string, required): The programming language of the code. Supported languages are:
  - `python`
  - `javascript`
  - `java`
  - `c`
  - `cpp`
  - `typescript`
  - `go`
  - `rust`
  - `csharp`

### Example Usage in an MCP Client

```
executeCode(code="print('Hello, world!')", language="python")
```

### Example Output

The tool will return the standard output of the executed code.

```json
{
  "content": [
    {
      "type": "text",
      "text": "Hello, world!\\n"
    }
  ]
}
```
