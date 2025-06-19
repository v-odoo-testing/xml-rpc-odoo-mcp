#!/usr/bin/env python3
"""
XML-RPC MCP Server for Odoo
Provides MCP tools for interacting with Odoo via XML-RPC
"""

import asyncio
import argparse
import json
import logging
from typing import Any, Dict, List, Optional
import xmlrpc.client
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.types import (
    CallToolRequest, 
    CallToolResult,
    ListToolsRequest,
    TextContent,
    Tool,
)
from _config import load_odoo_config, connect_odoo

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("odoo-xmlrpc-server")

app = Server("odoo-xmlrpc-server")

# Global variables for Odoo connection
odoo_models = None
odoo_db = None
odoo_uid = None
odoo_password = None
odoo_project = None
odoo_environment = None


def init_odoo_connection(project: str, environment: str):
    """Initialize Odoo connection with given project and environment"""
    global odoo_models, odoo_db, odoo_uid, odoo_password, odoo_project, odoo_environment
    
    try:
        odoo_models, odoo_db, odoo_uid, odoo_password = connect_odoo(project, environment)
        odoo_project = project
        odoo_environment = environment
        logger.info(f"Connected to Odoo: {project}_{environment}")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to Odoo: {e}")
        return False


@app.list_tools()
async def handle_list_tools() -> list[Tool]:
    """List available Odoo XML-RPC tools"""
    return [
        Tool(
            name="odoo_search",
            description="Search for records in Odoo model",
            inputSchema={
                "type": "object",
                "properties": {
                    "model": {"type": "string", "description": "Odoo model name (e.g., 'res.partner')"},
                    "domain": {"type": "array", "description": "Search domain as list of tuples", "default": []},
                    "limit": {"type": "integer", "description": "Maximum number of records to return", "default": 100},
                    "offset": {"type": "integer", "description": "Number of records to skip", "default": 0},
                },
                "required": ["model"],
            },
        ),
        Tool(
            name="odoo_read",
            description="Read specific records from Odoo model",
            inputSchema={
                "type": "object",
                "properties": {
                    "model": {"type": "string", "description": "Odoo model name"},
                    "ids": {"type": "array", "items": {"type": "integer"}, "description": "List of record IDs to read"},
                    "fields": {"type": "array", "items": {"type": "string"}, "description": "List of fields to read", "default": []},
                },
                "required": ["model", "ids"],
            },
        ),
        Tool(
            name="odoo_create",
            description="Create new record in Odoo model",
            inputSchema={
                "type": "object",
                "properties": {
                    "model": {"type": "string", "description": "Odoo model name"},
                    "values": {"type": "object", "description": "Dictionary of field values for new record"},
                },
                "required": ["model", "values"],
            },
        ),
        Tool(
            name="odoo_write",
            description="Update existing records in Odoo model",
            inputSchema={
                "type": "object",
                "properties": {
                    "model": {"type": "string", "description": "Odoo model name"},
                    "ids": {"type": "array", "items": {"type": "integer"}, "description": "List of record IDs to update"},
                    "values": {"type": "object", "description": "Dictionary of field values to update"},
                },
                "required": ["model", "ids", "values"],
            },
        ),
        Tool(
            name="odoo_unlink",
            description="Delete records from Odoo model",
            inputSchema={
                "type": "object",
                "properties": {
                    "model": {"type": "string", "description": "Odoo model name"},
                    "ids": {"type": "array", "items": {"type": "integer"}, "description": "List of record IDs to delete"},
                },
                "required": ["model", "ids"],
            },
        ),
        Tool(
            name="odoo_search_count",
            description="Count records matching domain in Odoo model",
            inputSchema={
                "type": "object",
                "properties": {
                    "model": {"type": "string", "description": "Odoo model name"},
                    "domain": {"type": "array", "description": "Search domain as list of tuples", "default": []},
                },
                "required": ["model"],
            },
        ),
        Tool(
            name="odoo_fields_get",
            description="Get field definitions for Odoo model",
            inputSchema={
                "type": "object",
                "properties": {
                    "model": {"type": "string", "description": "Odoo model name"},
                    "fields": {"type": "array", "items": {"type": "string"}, "description": "Specific fields to get info for", "default": []},
                },
                "required": ["model"],
            },
        ),
        Tool(
            name="odoo_search_read",
            description="Search and read records in one call",
            inputSchema={
                "type": "object", 
                "properties": {
                    "model": {"type": "string", "description": "Odoo model name"},
                    "domain": {"type": "array", "description": "Search domain as list of tuples", "default": []},
                    "fields": {"type": "array", "items": {"type": "string"}, "description": "List of fields to read", "default": []},
                    "limit": {"type": "integer", "description": "Maximum number of records to return", "default": 100},
                    "offset": {"type": "integer", "description": "Number of records to skip", "default": 0},
                },
                "required": ["model"],
            },
        ),
    ]


@app.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> CallToolResult:
    """Handle tool calls for Odoo XML-RPC operations"""
    
    if not odoo_models:
        return CallToolResult([TextContent(type="text", text="Error: Not connected to Odoo. Please check configuration.")])
    
    try:
        if name == "odoo_search":
            model = arguments["model"]
            domain = arguments.get("domain", [])
            limit = arguments.get("limit", 100)
            offset = arguments.get("offset", 0)
            
            result = odoo_models.execute_kw(
                odoo_db, odoo_uid, odoo_password,
                model, 'search', [domain],
                {'limit': limit, 'offset': offset}
            )
            
            return CallToolResult([TextContent(type="text", text=f"Search results: {json.dumps(result, indent=2)}")])
            
        elif name == "odoo_read":
            model = arguments["model"]
            ids = arguments["ids"]
            fields = arguments.get("fields", [])
            
            options = {'fields': fields} if fields else {}
            result = odoo_models.execute_kw(
                odoo_db, odoo_uid, odoo_password,
                model, 'read', [ids], options
            )
            
            return CallToolResult([TextContent(type="text", text=f"Read results: {json.dumps(result, indent=2)}")])
            
        elif name == "odoo_create":
            model = arguments["model"]
            values = arguments["values"]
            
            result = odoo_models.execute_kw(
                odoo_db, odoo_uid, odoo_password,
                model, 'create', [values]
            )
            
            return CallToolResult([TextContent(type="text", text=f"Created record ID: {result}")])
            
        elif name == "odoo_write":
            model = arguments["model"]
            ids = arguments["ids"]
            values = arguments["values"]
            
            result = odoo_models.execute_kw(
                odoo_db, odoo_uid, odoo_password,
                model, 'write', [ids, values]
            )
            
            return CallToolResult([TextContent(type="text", text=f"Write operation successful: {result}")])
            
        elif name == "odoo_unlink":
            model = arguments["model"]
            ids = arguments["ids"]
            
            result = odoo_models.execute_kw(
                odoo_db, odoo_uid, odoo_password,
                model, 'unlink', [ids]
            )
            
            return CallToolResult([TextContent(type="text", text=f"Delete operation successful: {result}")])
            
        elif name == "odoo_search_count":
            model = arguments["model"]
            domain = arguments.get("domain", [])
            
            result = odoo_models.execute_kw(
                odoo_db, odoo_uid, odoo_password,
                model, 'search_count', [domain]
            )
            
            return CallToolResult([TextContent(type="text", text=f"Record count: {result}")])
            
        elif name == "odoo_fields_get":
            model = arguments["model"]
            fields = arguments.get("fields", [])
            
            result = odoo_models.execute_kw(
                odoo_db, odoo_uid, odoo_password,
                model, 'fields_get', [fields]
            )
            
            return CallToolResult([TextContent(type="text", text=f"Field definitions: {json.dumps(result, indent=2)}")])
            
        elif name == "odoo_search_read":
            model = arguments["model"]
            domain = arguments.get("domain", [])
            fields = arguments.get("fields", [])
            limit = arguments.get("limit", 100)
            offset = arguments.get("offset", 0)
            
            options = {
                'fields': fields,
                'limit': limit,
                'offset': offset
            }
            
            result = odoo_models.execute_kw(
                odoo_db, odoo_uid, odoo_password,
                model, 'search_read', [domain], options
            )
            
            return CallToolResult([TextContent(type="text", text=f"Search and read results: {json.dumps(result, indent=2)}")])
            
        else:
            return CallToolResult([TextContent(type="text", text=f"Unknown tool: {name}")])
            
    except Exception as e:
        logger.error(f"Error executing {name}: {e}")
        return CallToolResult([TextContent(type="text", text=f"Error: {str(e)}")])


async def main():
    """Main entry point for the MCP server"""
    parser = argparse.ArgumentParser(description="Odoo XML-RPC MCP Server")
    parser.add_argument("--project", default="idp", help="Project name for config file")
    parser.add_argument("--environment", default="staging", help="Environment name for config file")
    parser.add_argument("--config-path", help="Direct path to config file (overrides project/environment)")
    
    args = parser.parse_args()
    
    # Initialize Odoo connection
    if not init_odoo_connection(args.project, args.environment):
        logger.error("Failed to initialize Odoo connection")
        return
    
    # Run the server
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="odoo-xmlrpc-server",
                server_version="1.0.0",
                capabilities=app.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )


if __name__ == "__main__":
    asyncio.run(main())