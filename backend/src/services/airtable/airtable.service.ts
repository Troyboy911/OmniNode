import Airtable, { FieldSet, Records } from 'airtable';
import { logger } from '../../config/logger';
import pRetry from 'p-retry';

export interface AirtableConfig {
  apiKey: string;
  baseId: string;
}

export class AirtableService {
  private base: Airtable.Base;

  constructor(private config: AirtableConfig) {
    const airtable = new Airtable({ apiKey: config.apiKey });
    this.base = airtable.base(config.baseId);
  }

  /**
   * Create record with retry
   */
  async create<T extends FieldSet>(
    table: string,
    fields: Partial<T>
  ): Promise<Airtable.Record<T>> {
    return pRetry(
      async () => {
        const record = await this.base(table).create(fields as any);
        logger.debug('Airtable record created', { table, id: record.id });
        return record;
      },
      {
        retries: 3,
        minTimeout: 1000,
        onFailedAttempt: error => {
          logger.warn('Airtable create failed, retrying', {
            table,
            attempt: error.attemptNumber,
            retriesLeft: error.retriesLeft,
          });
        },
      }
    );
  }

  /**
   * Update record with retry
   */
  async update<T extends FieldSet>(
    table: string,
    recordId: string,
    fields: Partial<T>
  ): Promise<Airtable.Record<T>> {
    return pRetry(
      async () => {
        const record = await this.base(table).update(recordId, fields as any);
        logger.debug('Airtable record updated', { table, id: record.id });
        return record;
      },
      {
        retries: 3,
        minTimeout: 1000,
      }
    );
  }

  /**
   * Find records with filter
   */
  async find<T extends FieldSet>(
    table: string,
    options?: {
      filterByFormula?: string;
      maxRecords?: number;
      sort?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
    }
  ): Promise<Records<T>> {
    return pRetry(
      async () => {
        const records = await this.base(table).select(options || {}).all();
        logger.debug('Airtable records found', { table, count: records.length });
        return records;
      },
      {
        retries: 3,
        minTimeout: 1000,
      }
    );
  }

  /**
   * Get single record by ID
   */
  async get<T extends FieldSet>(
    table: string,
    recordId: string
  ): Promise<Airtable.Record<T>> {
    return pRetry(
      async () => {
        const record = await this.base(table).find(recordId);
        return record;
      },
      {
        retries: 3,
        minTimeout: 1000,
      }
    );
  }

  /**
   * Delete record
   */
  async delete(table: string, recordId: string): Promise<boolean> {
    try {
      await this.base(table).destroy(recordId);
      logger.debug('Airtable record deleted', { table, id: recordId });
      return true;
    } catch (error) {
      logger.error('Failed to delete Airtable record', { table, id: recordId, error: error.message });
      return false;
    }
  }

  /**
   * Batch create records
   */
  async batchCreate<T extends FieldSet>(
    table: string,
    records: Array<Partial<T>>
  ): Promise<Records<T>> {
    // Airtable limits batch operations to 10 records
    const batches: Array<Partial<T>[]> = [];
    for (let i = 0; i < records.length; i += 10) {
      batches.push(records.slice(i, i + 10));
    }

    const results: Airtable.Record<T>[] = [];
    for (const batch of batches) {
      const created = await pRetry(
        async () => {
          return await this.base(table).create(batch as any);
        },
        { retries: 3, minTimeout: 1000 }
      );
      results.push(...created);
    }

    logger.info('Airtable batch create completed', { table, count: results.length });
    return results;
  }

  /**
   * Batch update records
   */
  async batchUpdate<T extends FieldSet>(
    table: string,
    updates: Array<{ id: string; fields: Partial<T> }>
  ): Promise<Records<T>> {
    const batches: typeof updates[] = [];
    for (let i = 0; i < updates.length; i += 10) {
      batches.push(updates.slice(i, i + 10));
    }

    const results: Airtable.Record<T>[] = [];
    for (const batch of batches) {
      const updated = await pRetry(
        async () => {
          return await this.base(table).update(batch as any);
        },
        { retries: 3, minTimeout: 1000 }
      );
      results.push(...updated);
    }

    logger.info('Airtable batch update completed', { table, count: results.length });
    return results;
  }
}
