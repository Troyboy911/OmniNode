import { prisma } from '@/config/database';
import { logger } from '@/config/logger';

interface MemoryEntry {
  key: string;
  value: any;
  type: 'short_term' | 'long_term' | 'context';
  metadata?: any;
  expiresAt?: Date;
}

interface AgentMemory {
  shortTerm: any[];
  longTerm: any[];
  context: Record<string, any>;
}

export class AgentMemoryService {
  private static instance: AgentMemoryService;

  static getInstance(): AgentMemoryService {
    if (!AgentMemoryService.instance) {
      AgentMemoryService.instance = new AgentMemoryService();
    }
    return AgentMemoryService.instance;
  }

  async storeMemory(
    agentId: string,
    entry: MemoryEntry
  ): Promise<void> {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      const currentMemory: AgentMemory = (agent.memory as any) || {
        shortTerm: [],
        longTerm: [],
        context: {},
      };

      // Add new memory entry
      if (entry.type === 'short_term') {
        currentMemory.shortTerm.unshift({
          ...entry,
          id: Date.now().toString(),
          createdAt: new Date(),
        });

        // Keep only last 100 short-term memories
        currentMemory.shortTerm = currentMemory.shortTerm.slice(0, 100);
      } else if (entry.type === 'long_term') {
        currentMemory.longTerm.unshift({
          ...entry,
          id: Date.now().toString(),
          createdAt: new Date(),
        });

        // Keep only last 50 long-term memories
        currentMemory.longTerm = currentMemory.longTerm.slice(0, 50);
      } else if (entry.type === 'context') {
        currentMemory.context[entry.key] = {
          value: entry.value,
          metadata: entry.metadata,
          updatedAt: new Date(),
          expiresAt: entry.expiresAt,
        };
      }

      await prisma.agent.update({
        where: { id: agentId },
        data: { memory: currentMemory as any },
      });

      logger.info(`Memory stored for agent ${agentId}`);
    } catch (error) {
      logger.error('Error storing memory:', error);
      throw error;
    }
  }

  async retrieveMemory(
    agentId: string,
    key?: string,
    type?: 'short_term' | 'long_term' | 'context'
  ): Promise<any> {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      const memory: AgentMemory = (agent.memory as any) || {
        shortTerm: [],
        longTerm: [],
        context: {},
      };

      // Clean expired context
      if (memory.context) {
        const now = new Date();
        const keysToDelete: string[] = [];
        
        Object.entries(memory.context).forEach(([key, value]) => {
          if (value.expiresAt && new Date(value.expiresAt) < now) {
            keysToDelete.push(key);
          }
        });
        
        if (keysToDelete.length > 0) {
          keysToDelete.forEach(key => delete memory.context[key]);
        }
      }

      if (key) {
        if (type === 'short_term') {
          return memory.shortTerm.find((item: any) => item.key === key);
        } else if (type === 'long_term') {
          return memory.longTerm.find((item: any) => item.key === key);
        } else if (type === 'context') {
          return memory.context[key];
        } else {
          return memory.context[key] || 
                 memory.shortTerm.find((item: any) => item.key === key) ||
                 memory.longTerm.find((item: any) => item.key === key);
        }
      }

      if (type) {
        return memory[type];
      }

      return memory;
    } catch (error) {
      logger.error('Error retrieving memory:', error);
      throw error;
    }
  }

  async searchMemory(
    agentId: string,
    query: string,
    type?: 'short_term' | 'long_term' | 'context'
  ): Promise<any[]> {
    try {
      const memory = await this.retrieveMemory(agentId);
      
      const results: any[] = [];

      if (!type || type === 'short_term') {
        const shortTermResults = memory.shortTerm.filter((item: any) =>
          item.key.toLowerCase().includes(query.toLowerCase()) ||
          JSON.stringify(item.value).toLowerCase().includes(query.toLowerCase())
        );
        results.push(...shortTermResults);
      }

      if (!type || type === 'long_term') {
        const longTermResults = memory.longTerm.filter((item: any) =>
          item.key.toLowerCase().includes(query.toLowerCase()) ||
          JSON.stringify(item.value).toLowerCase().includes(query.toLowerCase())
        );
        results.push(...longTermResults);
      }

      if (!type || type === 'context') {
        const contextResults = Object.entries(memory.context)
          .filter(([key, value]) =>
            key.toLowerCase().includes(query.toLowerCase()) ||
            JSON.stringify(value).toLowerCase().includes(query.toLowerCase())
          )
          .map(([key, value]) => ({ key, ...value }));
        results.push(...contextResults);
      }

      return results;
    } catch (error) {
      logger.error('Error searching memory:', error);
      throw error;
    }
  }

  async clearMemory(
    agentId: string,
    type?: 'short_term' | 'long_term' | 'context'
  ): Promise<void> {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      const memory: AgentMemory = (agent.memory as any) || {
        shortTerm: [],
        longTerm: [],
        context: {},
      };

      if (type) {
        memory[type] = type === 'context' ? {} : [];
      } else {
        memory.shortTerm = [];
        memory.longTerm = [];
        memory.context = {};
      }

      await prisma.agent.update({
        where: { id: agentId },
        data: { memory: memory as any },
      });

      logger.info(`Memory cleared for agent ${agentId}`);
    } catch (error) {
      logger.error('Error clearing memory:', error);
      throw error;
    }
  }

  async summarizeMemory(agentId: string): Promise<{
    shortTermCount: number;
    longTermCount: number;
    contextCount: number;
    totalSize: number;
  }> {
    try {
      const memory = await this.retrieveMemory(agentId);
      
      return {
        shortTermCount: memory.shortTerm?.length || 0,
        longTermCount: memory.longTerm?.length || 0,
        contextCount: Object.keys(memory.context || {}).length,
        totalSize: JSON.stringify(memory).length,
      };
    } catch (error) {
      logger.error('Error summarizing memory:', error);
      throw error;
    }
  }

  async consolidateMemory(agentId: string): Promise<void> {
    try {
      const memory = await this.retrieveMemory(agentId);
      
      // Move old short-term memories to long-term
      if (memory.shortTerm && memory.shortTerm.length > 50) {
        const oldMemories = memory.shortTerm.slice(50);
        memory.longTerm.unshift(...oldMemories);
        memory.shortTerm = memory.shortTerm.slice(0, 50);
      }

      // Keep only last 100 long-term memories
      if (memory.longTerm && memory.longTerm.length > 100) {
        memory.longTerm = memory.longTerm.slice(0, 100);
      }

      await prisma.agent.update({
        where: { id: agentId },
        data: { memory: memory as any },
      });

      logger.info(`Memory consolidated for agent ${agentId}`);
    } catch (error) {
      logger.error('Error consolidating memory:', error);
      throw error;
    }
  }

  async getMemoryInsights(agentId: string): Promise<{
    mostAccessed: any[];
    recentActivity: any[];
    patterns: any[];
  }> {
    try {
      const memory = await this.retrieveMemory(agentId);
      
      const recentActivity = [
        ...(memory.shortTerm?.slice(0, 10) || []),
        ...(memory.longTerm?.slice(0, 5) || []),
      ];

      return {
        mostAccessed: recentActivity.slice(0, 5),
        recentActivity,
        patterns: this.detectPatterns(memory),
      };
    } catch (error) {
      logger.error('Error getting memory insights:', error);
      throw error;
    }
  }

  private detectPatterns(memory: AgentMemory): any[] {
    const patterns: any[] = [];
    
    // Detect frequent keys
    const allKeys = [
      ...(memory.shortTerm?.map((item: any) => item.key) || []),
      ...(memory.longTerm?.map((item: any) => item.key) || []),
      ...Object.keys(memory.context || {}),
    ];
    
    const keyCounts = allKeys.reduce((acc: any, key: string) => {
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    const frequentKeys = Object.entries(keyCounts)
      .filter(([_, count]) => count > 1)
      .sort(([, a], [, b]) => b - a);
    
    if (frequentKeys.length > 0) {
      patterns.push({
        type: 'frequent_keys',
        keys: frequentKeys,
      });
    }

    return patterns;
  }
}

// Memory cleanup service
export class MemoryCleanupService {
  static async cleanupExpiredMemories(): Promise<void> {
    try {
      const agents = await prisma.agent.findMany({
        where: { memory: { not: null } },
      });

      for (const agent of agents) {
        const memory: AgentMemory = (agent.memory as any) || { context: {} };
        
        if (memory.context) {
          const now = new Date();
          const keysToDelete: string[] = [];
          
          Object.entries(memory.context).forEach(([key, value]: [string, any]) => {
            if (value.expiresAt && new Date(value.expiresAt) < now) {
              keysToDelete.push(key);
            }
          });
          
          if (keysToDelete.length > 0) {
            keysToDelete.forEach(key => delete memory.context[key]);
            
            await prisma.agent.update({
              where: { id: agent.id },
              data: { memory: memory as any },
            });
            
            logger.info(`Cleaned ${keysToDelete.length} expired memories for agent ${agent.id}`);
          }
        }
      }
    } catch (error) {
      logger.error('Error cleaning expired memories:', error);
    }
  }
}