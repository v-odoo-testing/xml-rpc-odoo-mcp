#!/usr/bin/env python3
"""
Odoo Configuration Module
Reads connection settings from ~/.odoo_config/<project>_<environment>.conf
Environment variables take priority over config file settings
"""

import os
import configparser
import xmlrpc.client


def load_odoo_config(project="idp", environment="staging"):
    """Load Odoo connection configuration with environment variable priority"""
    config_path = os.path.expanduser(f'~/.odoo_config/{project}_{environment}.conf')
    
    # Check environment variables first (priority)
    env_config = {
        'url': os.getenv('ODOO_URL'),
        'database': os.getenv('ODOO_DATABASE'), 
        'username': os.getenv('ODOO_USERNAME'),
        'password': os.getenv('ODOO_PASSWORD')
    }
    
    # If all environment variables are set, use them
    if all(env_config.values()):
        return env_config
    
    # Otherwise, try to load from config file
    if not os.path.exists(config_path):
        raise FileNotFoundError(
            f"Odoo configuration not found. Please create {config_path} with:\n"
            "[odoo]\n"
            "url = https://staging-odoo.idpltd.net\n"
            "database = staging\n"
            "username = your_username\n"
            "password = your_password\n"
            "\nOr set environment variables:\n"
            "ODOO_URL, ODOO_DATABASE, ODOO_USERNAME, ODOO_PASSWORD\n"
        )
    
    config = configparser.ConfigParser()
    config.read(config_path)
    
    # Merge config file with environment variables (env vars take priority)
    result = {
        'url': config['odoo']['url'],
        'database': config['odoo']['database'], 
        'username': config['odoo']['username'],
        'password': config['odoo']['password']
    }
    
    # Override with environment variables if they exist
    for key, env_value in env_config.items():
        if env_value:
            result[key] = env_value
    
    return result



def connect_odoo(project="idp", environment="staging"):
    """Connect to Odoo using standard configuration"""
    config = load_odoo_config(project, environment)
    
    try:
        common = xmlrpc.client.ServerProxy(f"{config['url']}/xmlrpc/2/common")
        uid = common.authenticate(config['database'], config['username'], 
                                config['password'], {})
        
        if not uid:
            raise Exception("Authentication failed - check username/password")
        
        models = xmlrpc.client.ServerProxy(f"{config['url']}/xmlrpc/2/object")
        
        return models, config['database'], uid, config['password']
        
    except Exception as e:
        raise Exception(f"Failed to connect to Odoo: {e}")


def test_connection():
    """Test Odoo connection and return user info"""
    models, db, uid, password = connect_odoo()
    
    # Test connection by getting user info
    user_info = models.execute_kw(db, uid, password, 'res.users', 'read', [uid], 
                                 {'fields': ['name', 'login']})
    
    return {
        'user_id': uid,
        'name': user_info[0]['name'],
        'login': user_info[0]['login'],
        'database': db
    }


if __name__ == "__main__":
    # Test the connection
    try:
        info = test_connection()
        print(f"✅ Connection successful!")
        print(f"   User: {info['name']} ({info['login']})")
        print(f"   Database: {info['database']}")
        print(f"   User ID: {info['user_id']}")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
