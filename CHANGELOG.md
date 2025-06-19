# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-19

### Added
- Initial release of Odoo XML-RPC MCP Server
- Support for configurable project and environment parameters
- Environment variable priority over config file settings
- Configuration path: `~/.odoo_config/<project>_<environment>.conf`
- MCP tools for Odoo XML-RPC operations:
  - `odoo_search` - Search for records in Odoo model
  - `odoo_read` - Read specific records from Odoo model
  - `odoo_create` - Create new record in Odoo model
  - `odoo_write` - Update existing records in Odoo model
  - `odoo_unlink` - Delete records from Odoo model
  - `odoo_search_count` - Count records matching domain
  - `odoo_fields_get` - Get field definitions for Odoo model
  - `odoo_search_read` - Search and read records in one call
- Command line arguments for project and environment specification
- Support for environment variables: ODOO_URL, ODOO_DATABASE, ODOO_USERNAME, ODOO_PASSWORD
- Python package distribution via setup.py