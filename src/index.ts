#!/usr/bin/env node
/**
 * XML-RPC MCP Server for Odoo
 * Provides MCP tools for interacting with Odoo via XML-RPC
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { loadOdooConfig } from './config';
import { OdooClient } from './odoo-client';

class OdooMCPServer {
  private server: Server;
  private odooClient: OdooClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: "odoo-xmlrpc-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  async initialize(project: string, environment: string) {
    try {
      const config = loadOdooConfig(project, environment);
      this.odooClient = new OdooClient(config);
      await this.odooClient.authenticate();
      console.error(`Connected to Odoo: ${project}_${environment}`);
    } catch (error) {
      console.error(`Failed to connect to Odoo: ${error}`);
      throw error;
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "odoo_search",
            description: "Search for records in Odoo model",
            inputSchema: {
              type: "object",
              properties: {
                model: { type: "string", description: "Odoo model name (e.g., 'res.partner')" },
                domain: { type: "array", description: "Search domain as list of tuples", default: [] },
                limit: { type: "integer", description: "Maximum number of records to return", default: 100 },
                offset: { type: "integer", description: "Number of records to skip", default: 0 },
              },
              required: ["model"],
            },
          },
          {
            name: "odoo_read",
            description: "Read specific records from Odoo model",
            inputSchema: {
              type: "object",
              properties: {
                model: { type: "string", description: "Odoo model name" },
                ids: { type: "array", items: { type: "integer" }, description: "List of record IDs to read" },
                fields: { type: "array", items: { type: "string" }, description: "List of fields to read", default: [] },
              },
              required: ["model", "ids"],
            },
          },
          {
            name: "odoo_create",
            description: "Create new record in Odoo model",
            inputSchema: {
              type: "object",
              properties: {
                model: { type: "string", description: "Odoo model name" },
                values: { type: "object", description: "Dictionary of field values for new record" },
              },
              required: ["model", "values"],
            },
          },
          {
            name: "odoo_write",
            description: "Update existing records in Odoo model",
            inputSchema: {
              type: "object",
              properties: {
                model: { type: "string", description: "Odoo model name" },
                ids: { type: "array", items: { type: "integer" }, description: "List of record IDs to update" },
                values: { type: "object", description: "Dictionary of field values to update" },
              },
              required: ["model", "ids", "values"],
            },
          },
          {
            name: "odoo_unlink",
            description: "Delete records from Odoo model",
            inputSchema: {
              type: "object",
              properties: {
                model: { type: "string", description: "Odoo model name" },
                ids: { type: "array", items: { type: "integer" }, description: "List of record IDs to delete" },
              },
              required: ["model", "ids"],
            },
          },
          {
            name: "odoo_search_count",
            description: "Count records matching domain in Odoo model",
            inputSchema: {
              type: "object",
              properties: {
                model: { type: "string", description: "Odoo model name" },
                domain: { type: "array", description: "Search domain as list of tuples", default: [] },
              },
              required: ["model"],
            },
          },
          {
            name: "odoo_fields_get",
            description: "Get field definitions for Odoo model",
            inputSchema: {
              type: "object",
              properties: {
                model: { type: "string", description: "Odoo model name" },
                fields: { type: "array", items: { type: "string" }, description: "Specific fields to get info for", default: [] },
              },
              required: ["model"],
            },
          },
          {
            name: "odoo_search_read",
            description: "Search and read records in one call",
            inputSchema: {
              type: "object",
              properties: {
                model: { type: "string", description: "Odoo model name" },
                domain: { type: "array", description: "Search domain as list of tuples", default: [] },
                fields: { type: "array", items: { type: "string" }, description: "List of fields to read", default: [] },
                limit: { type: "integer", description: "Maximum number of records to return", default: 100 },
                offset: { type: "integer", description: "Number of records to skip", default: 0 },
              },
              required: ["model"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.odooClient) {
        return {
          content: [
            {
              type: "text",
              text: "Error: Not connected to Odoo. Please check configuration.",
            },
          ],
        };
      }

      try {
        const { name, arguments: args } = request.params;
        const toolArgs = args as any;

        switch (name) {
          case "odoo_search": {
            const { model, domain = [], limit = 100, offset = 0 } = toolArgs;
            const result = await this.odooClient.search(model, domain, { limit, offset });
            return {
              content: [
                {
                  type: "text",
                  text: `Search results: ${JSON.stringify(result, null, 2)}`,
                },
              ],
            };
          }

          case "odoo_read": {
            const { model, ids, fields = [] } = toolArgs;
            const result = await this.odooClient.read(model, ids, fields);
            return {
              content: [
                {
                  type: "text",
                  text: `Read results: ${JSON.stringify(result, null, 2)}`,
                },
              ],
            };
          }

          case "odoo_create": {
            const { model, values } = toolArgs;
            const result = await this.odooClient.create(model, values);
            return {
              content: [
                {
                  type: "text",
                  text: `Created record ID: ${result}`,
                },
              ],
            };
          }

          case "odoo_write": {
            const { model, ids, values } = toolArgs;
            const result = await this.odooClient.write(model, ids, values);
            return {
              content: [
                {
                  type: "text",
                  text: `Write operation successful: ${result}`,
                },
              ],
            };
          }

          case "odoo_unlink": {
            const { model, ids } = toolArgs;
            const result = await this.odooClient.unlink(model, ids);
            return {
              content: [
                {
                  type: "text", 
                  text: `Delete operation successful: ${result}`,
                },
              ],
            };
          }

          case "odoo_search_count": {
            const { model, domain = [] } = toolArgs;
            const result = await this.odooClient.searchCount(model, domain);
            return {
              content: [
                {
                  type: "text",
                  text: `Record count: ${result}`,
                },
              ],
            };
          }

          case "odoo_fields_get": {
            const { model, fields = [] } = toolArgs;
            const result = await this.odooClient.fieldsGet(model, fields);
            return {
              content: [
                {
                  type: "text",
                  text: `Field definitions: ${JSON.stringify(result, null, 2)}`,
                },
              ],
            };
          }

          case "odoo_search_read": {
            const { model, domain = [], fields = [], limit = 100, offset = 0 } = toolArgs;
            const result = await this.odooClient.searchRead(model, domain, {
              fields,
              limit,
              offset,
            });
            return {
              content: [
                {
                  type: "text",
                  text: `Search and read results: ${JSON.stringify(result, null, 2)}`,
                },
              ],
            };
          }

          default:
            return {
              content: [
                {
                  type: "text",
                  text: `Unknown tool: ${name}`,
                },
              ],
            };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Odoo XML-RPC MCP server running on stdio");
  }
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('project', {
      type: 'string',
      default: 'idp',
      description: 'Project name for config file',
    })
    .option('environment', {
      type: 'string', 
      default: 'staging',
      description: 'Environment name for config file',
    })
    .help()
    .argv;

  const server = new OdooMCPServer();
  
  try {
    await server.initialize(argv.project, argv.environment);
    await server.run();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}