#!/usr/bin/env node
/**
 * Odoo Configuration Module
 * Reads connection settings from ~/.odoo_config/<project>_<environment>.conf
 * Environment variables take priority over config file settings
 */

import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface OdooConfig {
  url: string;
  database: string;
  username: string;
  password: string;
}

export function loadOdooConfig(project: string = 'idp', environment: string = 'staging'): OdooConfig {
  const configPath = join(homedir(), '.odoo_config', `${project}_${environment}.conf`);
  
  // Check environment variables first (priority)
  const envConfig = {
    url: process.env.ODOO_URL,
    database: process.env.ODOO_DATABASE,
    username: process.env.ODOO_USERNAME,
    password: process.env.ODOO_PASSWORD
  };
  
  // If all environment variables are set, use them
  if (envConfig.url && envConfig.database && envConfig.username && envConfig.password) {
    return envConfig as OdooConfig;
  }
  
  // Otherwise, try to load from config file
  if (!existsSync(configPath)) {
    throw new Error(
      `Odoo configuration not found. Please create ${configPath} with:\n` +
      '[odoo]\n' +
      'url = https://staging-odoo.idpltd.net\n' +
      'database = staging\n' +
      'username = your_username\n' +
      'password = your_password\n' +
      '\nOr set environment variables:\n' +
      'ODOO_URL, ODOO_DATABASE, ODOO_USERNAME, ODOO_PASSWORD'
    );
  }
  
  const configContent = readFileSync(configPath, 'utf-8');
  const configLines = configContent.split('\n');
  const config: Partial<OdooConfig> = {};
  
  // Simple INI parser
  for (const line of configLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('[') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      const cleanKey = key.trim();
      
      switch (cleanKey) {
        case 'url':
          config.url = value;
          break;
        case 'database':
          config.database = value;
          break;
        case 'username':
          config.username = value;
          break;
        case 'password':
          config.password = value;
          break;
      }
    }
  }
  
  // Merge config file with environment variables (env vars take priority)
  const result: OdooConfig = {
    url: envConfig.url || config.url || '',
    database: envConfig.database || config.database || '',
    username: envConfig.username || config.username || '',
    password: envConfig.password || config.password || ''
  };
  
  // Validate required fields
  if (!result.url || !result.database || !result.username || !result.password) {
    throw new Error('Missing required Odoo configuration. Please check your config file or environment variables.');
  }
  
  return result;
}