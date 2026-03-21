/**
 * Easy Market - Health Check Service
 * Verifies all critical systems are operational
 */

const supabase = require('./lib/supabase');

class HealthCheckService {
  static async checkAll() {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {}
    };

    // Environment check
    checks.services.environment = this.checkEnvironment();

    // Database check
    try {
      checks.services.database = await this.checkDatabase();
    } catch (error) {
      checks.services.database = {
        status: 'error',
        message: error.message
      };
    }

    // API check
    checks.services.api = {
      status: 'healthy',
      port: process.env.PORT || 3000,
      apiPrefix: process.env.API_PREFIX || '/api/v1'
    };

    // Determine overall status
    const hasError = Object.values(checks.services).some(s => s.status === 'error');
    checks.status = hasError ? 'degraded' : 'healthy';

    return checks;
  }

  static checkEnvironment() {
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NODE_ENV'
    ];

    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
      return {
        status: 'error',
        message: `Missing environment variables: ${missing.join(', ')}`
      };
    }

    return {
      status: 'healthy',
      nodeEnv: process.env.NODE_ENV,
      variables: requiredVars.length
    };
  }

  static async checkDatabase() {
    try {
      // Test Supabase connection
      const { data, error } = await supabase
        .from('lojas')
        .select('count', { count: 'exact', head: true })
        .limit(0);

      if (error) {
        return {
          status: 'error',
          message: `Database error: ${error.message}`
        };
      }

      return {
        status: 'healthy',
        message: 'Connected to Supabase',
        lojas: data ? data.length : 0
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Connection failed: ${error.message}`
      };
    }
  }

  static async logHealthCheck() {
    const health = await this.checkAll();
    console.log('🏥 Health Check Results:');
    console.log(JSON.stringify(health, null, 2));
    return health;
  }
}

module.exports = HealthCheckService;
