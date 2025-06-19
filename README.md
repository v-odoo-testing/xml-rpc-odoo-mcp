# Odoo XML-RPC MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Odoo via XML-RPC.

## Features

- Connect to any Odoo instance via XML-RPC
- Configurable project and environment parameters
- Environment variable support with priority over config files
- Complete set of Odoo operations: search, read, create, write, delete
- Integration with Claude Desktop and Claude Code

## Installation

### Global Installation (Desktop MCP Server)

1. Install globally using npm:
```bash
npm install -g .
```

2. Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "odoo-xmlrpc": {
      "command": "odoo-xmlrpc-mcp-server",
      "args": ["--project", "your_project", "--environment", "your_env"],
      "env": {
        "ODOO_URL": "https://your-odoo.domain.com",
        "ODOO_DATABASE": "your_database",
        "ODOO_USERNAME": "your_username", 
        "ODOO_PASSWORD": "your_password"
      }
    }
  }
}
```

### Local Installation (Claude Code)

1. Clone or copy this repository to your project directory

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Create `.claude.json` in your project root:
```json
{
  "mcp": {
    "servers": {
      "odoo-xmlrpc": {
        "command": "node",
        "args": ["./dist/index.js", "--project", "your_project", "--environment", "your_env"],
        "env": {
          "ODOO_URL": "https://your-odoo.domain.com",
          "ODOO_DATABASE": "your_database", 
          "ODOO_USERNAME": "your_username",
          "ODOO_PASSWORD": "your_password"
        }
      }
    }
  }
}
```

### Development

For development, you can run directly with tsx:
```bash
npm run dev -- --project your_project --environment your_env
```

## Configuration

### Config File Method

Create a configuration file at `~/.odoo_config/<project>_<environment>.conf`:

```ini
[odoo]
url = https://your-odoo.domain.com
database = your_database
username = your_username
password = your_password
```

### Environment Variables (Priority)

Set these environment variables (they take priority over config files):
- `ODOO_URL`
- `ODOO_DATABASE` 
- `ODOO_USERNAME`
- `ODOO_PASSWORD`

## Usage

### Available Tools

#### `odoo_search`
Search for records in an Odoo model.
```json
{
  "model": "res.partner",
  "domain": [["is_company", "=", true]],
  "limit": 10
}
```

#### `odoo_read`
Read specific records by ID.
```json
{
  "model": "res.partner", 
  "ids": [1, 2, 3],
  "fields": ["name", "email", "phone"]
}
```

#### `odoo_create`
Create a new record.
```json
{
  "model": "res.partner",
  "values": {
    "name": "New Company",
    "is_company": true,
    "email": "info@newcompany.com"
  }
}
```

#### `odoo_write`
Update existing records.
```json
{
  "model": "res.partner",
  "ids": [123], 
  "values": {
    "phone": "+1-555-0123"
  }
}
```

#### `odoo_unlink`
Delete records.
```json
{
  "model": "res.partner",
  "ids": [456]
}
```

#### `odoo_search_count`
Count records matching a domain.
```json
{
  "model": "res.partner",
  "domain": [["is_company", "=", true]]
}
```

#### `odoo_fields_get`
Get field definitions for a model.
```json
{
  "model": "res.partner",
  "fields": ["name", "email"]
}
```

#### `odoo_search_read`
Search and read in one operation.
```json
{
  "model": "res.partner",
  "domain": [["is_company", "=", true]],
  "fields": ["name", "email"],
  "limit": 5
}
```

## Development

### Requirements
- Node.js 18+
- npm or yarn

### Running Locally
```bash
npm run dev -- --project myproject --environment staging
```

### Building
```bash
npm run build
```

### Testing Connection
```bash
npm run dev -- --project idp --environment staging
```

## License

MIT License