/**
 * Store Flow Variables Scheduler
 * Automatically collects data at specified intervals
 */

const StoreFlowScraper = require('./index');

class ScraperScheduler {
  constructor(supabase) {
    this.supabase = supabase;
    this.intervals = [];
    this.isRunning = false;
  }

  /**
   * Start scheduled collection for multiple stores
   * @param {Array<string>} lojaIds - List of store IDs to monitor
   * @param {number} intervalMinutes - Collection interval in minutes (default: 60)
   */
  start(lojaIds = ['loja_001'], intervalMinutes = 60) {
    if (this.isRunning) {
      console.warn('[Scheduler] Already running, skipping start');
      return;
    }

    this.isRunning = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`
╔════════════════════════════════════════════════════════════╗
║         Store Flow Variables Scheduler Started             ║
╠════════════════════════════════════════════════════════════╣
║ Stores: ${lojaIds.join(', ').padEnd(51)} ║
║ Interval: Every ${intervalMinutes} minutes${' '.repeat(41 - String(intervalMinutes).length)} ║
║ Collection: Weather, Economic, Social, Inventory, Ops     ║
║ Variables: 50 real-time indicators                        ║
╚════════════════════════════════════════════════════════════╝
    `);

    // Initial immediate collection
    this.collectAll(lojaIds);

    // Schedule recurring collections
    lojaIds.forEach(lojaId => {
      const intervalId = setInterval(() => {
        this.collectAll([lojaId]);
      }, intervalMs);

      this.intervals.push({
        lojaId,
        intervalId,
        intervalMinutes,
      });
    });

    // Log collection status every 6 hours
    this.statusInterval = setInterval(() => {
      this.logStatus();
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Stop all scheduled collections
   */
  stop() {
    if (!this.isRunning) {
      console.warn('[Scheduler] Not running');
      return;
    }

    this.intervals.forEach(({ intervalId }) => {
      clearInterval(intervalId);
    });

    clearInterval(this.statusInterval);

    this.intervals = [];
    this.isRunning = false;

    console.log('[Scheduler] ✅ Stopped');
  }

  /**
   * Manually trigger collection for stores
   */
  async collectAll(lojaIds) {
    const promises = lojaIds.map(lojaId => this.collect(lojaId));
    const results = await Promise.allSettled(promises);

    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;

    if (failures > 0) {
      console.warn(`[Scheduler] ${successes} ✅ / ${failures} ❌`);
    }

    return results;
  }

  /**
   * Collect variables for a single store
   */
  async collect(lojaId) {
    if (!this.supabase) {
      console.log(`[Scheduler] Mock collection for ${lojaId}`);
      return { sucesso: true, mock: true };
    }

    const startTime = Date.now();

    try {
      const scraper = new StoreFlowScraper(this.supabase);
      const result = await scraper.scrapeAll(lojaId);

      const duration = Date.now() - startTime;

      // Log to database
      await this.logExecution({
        status: result.sucesso ? 'success' : 'partial',
        lojaId,
        variablesCollected: result.stored || 0,
        executionTimeMs: duration,
      });

      console.log(
        `[${new Date().toLocaleTimeString()}] ${lojaId}: ✅ ${result.stored || 0} variables in ${duration}ms`
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      await this.logExecution({
        status: 'error',
        lojaId,
        errorMessage: error.message,
        executionTimeMs: duration,
      });

      console.error(
        `[${new Date().toLocaleTimeString()}] ${lojaId}: ❌ ${error.message}`
      );

      return { sucesso: false, error: error.message };
    }
  }

  /**
   * Log execution to database
   */
  async logExecution(data) {
    if (!this.supabase) return;

    try {
      await this.supabase.from('scraper_logs').insert({
        scraper_name: 'store_flow_variables',
        status: data.status,
        variables_collected: data.variablesCollected || 0,
        error_message: data.errorMessage || null,
        execution_time_ms: data.executionTimeMs,
      });
    } catch (error) {
      console.warn('[Scheduler] Could not log execution:', error.message);
    }
  }

  /**
   * Log scheduler status
   */
  async logStatus() {
    const status = {
      isRunning: this.isRunning,
      activeSchedules: this.intervals.length,
      stores: this.intervals.map(i => ({
        lojaId: i.lojaId,
        intervalMinutes: i.intervalMinutes,
      })),
      timestamp: new Date().toISOString(),
    };

    console.log('[Scheduler] Status:', JSON.stringify(status, null, 2));
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeSchedules: this.intervals.length,
      schedules: this.intervals,
    };
  }

  /**
   * Get statistics from logs
   */
  async getStatistics(days = 7) {
    if (!this.supabase) {
      return {
        sucesso: true,
        mock: true,
        period_days: days,
      };
    }

    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await this.supabase
        .from('scraper_logs')
        .select('*')
        .gte('executed_at', since.toISOString())
        .order('executed_at', { ascending: false });

      if (error) throw error;

      const stats = {
        total_executions: data?.length || 0,
        successful: data?.filter(d => d.status === 'success').length || 0,
        partial: data?.filter(d => d.status === 'partial').length || 0,
        errors: data?.filter(d => d.status === 'error').length || 0,
        avg_execution_time_ms: data && data.length > 0
          ? Math.round(
              data.reduce((sum, d) => sum + (d.execution_time_ms || 0), 0) /
              data.length
            )
          : 0,
        total_variables_collected: data
          ? data.reduce((sum, d) => sum + (d.variables_collected || 0), 0)
          : 0,
        period_days: days,
      };

      return {
        sucesso: true,
        ...stats,
        sample_logs: data?.slice(0, 5),
      };
    } catch (error) {
      return {
        sucesso: false,
        error: error.message,
      };
    }
  }
}

module.exports = ScraperScheduler;
