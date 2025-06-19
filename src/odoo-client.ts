/**
 * Odoo XML-RPC Client
 */

import * as xmlrpc from 'xmlrpc';
import { OdooConfig } from './config';

export class OdooClient {
  private commonClient: any;
  private objectClient: any;
  private config: OdooConfig;
  private uid: number | null = null;

  constructor(config: OdooConfig) {
    this.config = config;
    const url = new URL(config.url);
    const isHttps = url.protocol === 'https:';
    
    const clientOptions = {
      host: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: '/xmlrpc/2/common',
      basic_auth: null,
      headers: {},
      ...(isHttps && { secure: true })
    };

    this.commonClient = isHttps ? 
      xmlrpc.createSecureClient(clientOptions) : 
      xmlrpc.createClient(clientOptions);

    this.objectClient = isHttps ? 
      xmlrpc.createSecureClient({
        ...clientOptions,
        path: '/xmlrpc/2/object'
      }) : 
      xmlrpc.createClient({
        ...clientOptions,
        path: '/xmlrpc/2/object'
      });
  }

  async authenticate(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.commonClient.methodCall('authenticate', [
        this.config.database,
        this.config.username,
        this.config.password,
        {}
      ], (error: any, value: any) => {
        if (error) {
          reject(new Error(`Authentication failed: ${error.message}`));
        } else if (!value) {
          reject(new Error('Authentication failed - check username/password'));
        } else {
          this.uid = value;
          resolve(value);
        }
      });
    });
  }

  async executeKw(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
    if (!this.uid) {
      await this.authenticate();
    }

    return new Promise((resolve, reject) => {
      this.objectClient.methodCall('execute_kw', [
        this.config.database,
        this.uid,
        this.config.password,
        model,
        method,
        args,
        kwargs
      ], (error: any, value: any) => {
        if (error) {
          reject(new Error(`XML-RPC call failed: ${error.message}`));
        } else {
          resolve(value);
        }
      });
    });
  }

  async search(model: string, domain: any[] = [], options: any = {}): Promise<number[]> {
    return this.executeKw(model, 'search', [domain], options);
  }

  async read(model: string, ids: number[], fields: string[] = []): Promise<any[]> {
    const options = fields.length > 0 ? { fields } : {};
    return this.executeKw(model, 'read', [ids], options);
  }

  async create(model: string, values: any): Promise<number> {
    return this.executeKw(model, 'create', [values]);
  }

  async write(model: string, ids: number[], values: any): Promise<boolean> {
    return this.executeKw(model, 'write', [ids, values]);
  }

  async unlink(model: string, ids: number[]): Promise<boolean> {
    return this.executeKw(model, 'unlink', [ids]);
  }

  async searchCount(model: string, domain: any[] = []): Promise<number> {
    return this.executeKw(model, 'search_count', [domain]);
  }

  async fieldsGet(model: string, fields: string[] = []): Promise<any> {
    return this.executeKw(model, 'fields_get', [fields]);
  }

  async searchRead(model: string, domain: any[] = [], options: any = {}): Promise<any[]> {
    return this.executeKw(model, 'search_read', [domain], options);
  }
}