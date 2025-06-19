# XML-RPC server for odoo

## goal

have a mcp server for xml rpc odoo with a config file in ~/.odoo_config/<project>_<environment>.conf
where in the arguments for the mcp server we provide the `~/.odoo_config/<project>_<environment>.conf` path


## _config.py

let's first rework that one to include project and environment to make the config path `~/.odoo_config/<project>_<environment>.conf`

secondly we need the settings to be able to be provided by environment variables for the config project and environemtn or directly the databas xml rpc connection details e.g.:

            "ODOO_url = https://staging-odoo.idpltd.net\n"
            "ODOO_database = staging\n"
            "ODOO_username = your_username\n"
            "ODOO_password = your_password\n"

anything set in the environment takes priority over hte config file.

## rules:

1. don not read the content of `~/.odoo_config/*.conf` files, not allowed, i provided the sample code that works in _config.py and it should be done by having the mcp server to read the url and credentals.

2. the mcp server code can be python or npm code

3. first plan the implementation.

4. then excute

5. create a changelog, never edit change log but use writefile and write append

6. when finished, create a readme on how to install globaly in desktop mcp server but also how to set it in a local dir for claude code as the .json.mcp

7. create new repository in github with the github gh client in bash as `https://github.com/v-odoo-testing/xml-rpc-odoo-mcp.git`