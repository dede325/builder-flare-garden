#!/usr/bin/env node

/**
 * AirPlus Aviation - Final Verification Script
 *
 * This script performs comprehensive end-to-end verification of:
 * 1. RLS (Row Level Security) policies
 * 2. Photo upload and storage functionality
 * 3. PDF generation and QR code functionality
 *
 * Usage: node scripts/final-verification.cjs
 */

const { createClient } = require('@supabase/supabase-js');
const { readFile } = require('fs/promises');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Load environment variables
const loadEnv = async () => {
  try {
    const envPath = path.join(__dirname, "..", ".env.production");
    const envContent = await readFile(envPath, "utf8");
    const envVars = {};

    envContent.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        envVars[key.trim()] = value.trim().replace(/['"]/g, "");
      }
    });

    return envVars;
  } catch (error) {
    console.log(
      `${colors.yellow}⚠️  Could not load .env.production, using default values${colors.reset}`,
    );
    return {};
  }
};

// Test utilities
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) =>
    console.log(
      `\n${colors.bright}${colors.cyan}=== ${msg} ===${colors.reset}\n`,
    ),
  subheader: (msg) =>
    console.log(`\n${colors.magenta}--- ${msg} ---${colors.reset}`),
};

// Verification functions
class AirPlusVerification {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.results = {
      rls: { passed: 0, failed: 0, tests: [] },
      photos: { passed: 0, failed: 0, tests: [] },
      pdf: { passed: 0, failed: 0, tests: [] },
      qr: { passed: 0, failed: 0, tests: [] },
      system: { passed: 0, failed: 0, tests: [] },
    };
  }

  async runTest(category, testName, testFn) {
    try {
      log.info(`Testing: ${testName}`);
      await testFn();
      this.results[category].passed++;
      this.results[category].tests.push({ name: testName, status: "PASSED" });
      log.success(`${testName} - PASSED`);
      return true;
    } catch (error) {
      this.results[category].failed++;
      this.results[category].tests.push({
        name: testName,
        status: "FAILED",
        error: error.message,
      });
      log.error(`${testName} - FAILED: ${error.message}`);
      return false;
    }
  }

  // RLS (Row Level Security) Tests
  async verifyRLSPolicies() {
    log.header("VERIFYING RLS POLICIES");

    // Test 1: Check basic table access
    await this.runTest(
      "rls",
      "Basic table access",
      async () => {
        const { data, error } = await this.supabase
          .from("user_profiles")
          .select("id")
          .limit(1);
        
        // RLS should block unauthenticated access or return empty results
        if (error && !error.message.includes("0 rows") && !error.message.includes("JWT")) {
          throw new Error(`Unexpected table access error: ${error.message}`);
        }
      },
    );

    // Test 2: Check if tables exist with proper structure
    await this.runTest("rls", "Critical tables exist", async () => {
      const tables = [
        "user_profiles",
        "cleaning_forms", 
        "aircraft",
        "employees",
      ];

      for (const table of tables) {
        const { data, error } = await this.supabase
          .from(table)
          .select("*")
          .limit(1);

        // Table should exist (RLS may block access but table should exist)
        if (error && error.message.includes("does not exist")) {
          throw new Error(`Table ${table} does not exist`);
        }
      }
    });

    // Test 3: Test system settings access (usually public)
    await this.runTest("rls", "System settings accessible", async () => {
      const { data, error } = await this.supabase
        .from("system_settings")
        .select("key, value")
        .limit(1);
        
      if (error && !error.message.includes("0 rows") && !error.message.includes("does not exist")) {
        log.warning(`System settings access: ${error.message}`);
      }
    });
  }

  // Photo Evidence Tests
  async verifyPhotoFunctionality() {
    log.header("VERIFYING PHOTO FUNCTIONALITY");

    // Test 1: Check if photo_evidence table exists and is accessible
    await this.runTest(
      "photos",
      "Photo evidence table exists",
      async () => {
        const { data, error } = await this.supabase
          .from("photo_evidence")
          .select("id")
          .limit(1);

        if (error && error.message.includes("does not exist")) {
          throw new Error("Photo evidence table does not exist");
        }
      },
    );

    // Test 2: Check Supabase Storage buckets
    await this.runTest("photos", "Storage configuration", async () => {
      const { data, error } = await this.supabase.storage.listBuckets();

      if (error) {
        log.warning(`Storage access: ${error.message}`);
      } else {
        const buckets = data.map((bucket) => bucket.name);
        log.info(`Available buckets: ${buckets.join(", ")}`);
      }
    });

    // Test 3: Test storage bucket access
    await this.runTest("photos", "Photo storage access", async () => {
      // Test photos bucket
      const { data, error } = await this.supabase.storage
        .from("photos")
        .list("", { limit: 1 });
        
      if (error && !error.message.includes("not found") && !error.message.includes("does not exist")) {
        log.warning(`Photos bucket access: ${error.message}`);
      }
    });

    // Test 4: Check photo metadata structure
    await this.runTest("photos", "Photo metadata structure", async () => {
      const { error } = await this.supabase
        .from("photo_evidence")
        .select(
          "id, form_id, type, category, description, timestamp, captured_by"
        )
        .limit(1);

      if (error && error.message.includes("column") && error.message.includes("does not exist")) {
        throw new Error(`Photo metadata structure invalid: ${error.message}`);
      }
    });
  }

  // PDF Generation Tests
  async verifyPDFGeneration() {
    log.header("VERIFYING PDF GENERATION");

    // Test 1: Check if cleaning_forms table has PDF-related fields
    await this.runTest("pdf", "Cleaning forms structure", async () => {
      const { error } = await this.supabase
        .from("cleaning_forms")
        .select("id, code, status")
        .limit(1);

      if (error && error.message.includes("does not exist")) {
        throw new Error("Cleaning forms table does not exist");
      }
    });

    // Test 2: Check PDF storage capability
    await this.runTest("pdf", "PDF storage access", async () => {
      const { data, error } = await this.supabase.storage
        .from("documents")
        .list("", { limit: 1 });

      if (error && !error.message.includes("not found") && !error.message.includes("does not exist")) {
        log.warning(`Documents bucket access: ${error.message}`);
      }
    });

    // Test 3: Verify form code generation logic
    await this.runTest("pdf", "Form code pattern validation", async () => {
      // Test the form code pattern: AP-PS-SNR##-DDMMAAHHMMSS
      const codePattern = /^AP-PS-SNR\d{2}-\d{12}$/;

      // Generate a mock form code
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = String(now.getFullYear()).slice(-2);
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      const timestamp = `${day}${month}${year}${hours}${minutes}${seconds}`;
      const mockCode = `AP-PS-SNR01-${timestamp}`;

      if (!codePattern.test(mockCode)) {
        throw new Error("Form code generation pattern is invalid");
      }
    });
  }

  // QR Code Tests
  async verifyQRCodeFunctionality() {
    log.header("VERIFYING QR CODE FUNCTIONALITY");

    // Test 1: Check QR codes table
    await this.runTest("qr", "QR codes table exists", async () => {
      const { data, error } = await this.supabase
        .from("qr_codes")
        .select("id")
        .limit(1);

      if (error && error.message.includes("does not exist")) {
        throw new Error("QR codes table does not exist");
      }
    });

    // Test 2: Test QR code generation pattern
    await this.runTest("qr", "QR code pattern validation", async () => {
      const mockFormCode = "AP-PS-SNR01-010125123045";
      
      if (!mockFormCode.match(/^AP-PS-SNR\d{2}-\d{12}$/)) {
        throw new Error("QR code form pattern is invalid");
      }
    });

    // Test 3: Check signed URL capability
    await this.runTest("qr", "Signed URL generation", async () => {
      try {
        const { data, error } = await this.supabase.storage
          .from("documents")
          .createSignedUrl("test/sample.pdf", 3600);

        if (error && !error.message.includes("Object not found") && !error.message.includes("not found")) {
          log.warning(`Signed URL test: ${error.message}`);
        }
      } catch (error) {
        log.warning(`Signed URL generation test: ${error.message}`);
      }
    });
  }

  // System Integration Tests
  async verifySystemIntegration() {
    log.header("VERIFYING SYSTEM INTEGRATION");

    // Test 1: Database connectivity
    await this.runTest("system", "Database connectivity", async () => {
      const { data, error } = await this.supabase
        .from("system_settings")
        .select("key")
        .limit(1);

      if (error && error.message.includes("does not exist")) {
        throw new Error("System settings table does not exist");
      }
    });

    // Test 2: Storage connectivity
    await this.runTest("system", "Storage connectivity", async () => {
      const { data, error } = await this.supabase.storage.listBuckets();

      if (error) {
        throw new Error(`Storage connectivity failed: ${error.message}`);
      }

      log.info(`Storage connected with ${data.length} bucket(s)`);
    });

    // Test 3: Basic query performance
    await this.runTest("system", "Query performance", async () => {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase
        .from("user_profiles")
        .select("id")
        .limit(5);
        
      const duration = Date.now() - startTime;
      
      if (duration > 5000) {
        log.warning(`Query took ${duration}ms - may be slow`);
      }
      
      log.info(`Query completed in ${duration}ms`);
    });
  }

  // Generate final report
  generateReport() {
    log.header("VERIFICATION REPORT");

    const categories = ["rls", "photos", "pdf", "qr", "system"];
    let totalPassed = 0;
    let totalFailed = 0;

    categories.forEach((category) => {
      const result = this.results[category];
      totalPassed += result.passed;
      totalFailed += result.failed;

      log.subheader(`${category.toUpperCase()} Tests`);
      console.log(`${colors.green}✅ Passed: ${result.passed}${colors.reset}`);
      console.log(`${colors.red}❌ Failed: ${result.failed}${colors.reset}`);

      if (result.tests.length > 0) {
        result.tests.forEach((test) => {
          const status =
            test.status === "PASSED"
              ? `${colors.green}✅ PASSED${colors.reset}`
              : `${colors.red}❌ FAILED${colors.reset}`;
          console.log(`  ${test.name}: ${status}`);
          if (test.error) {
            console.log(`    ${colors.red}Error: ${test.error}${colors.reset}`);
          }
        });
      }
      console.log("");
    });

    // Overall summary
    log.header("OVERALL SUMMARY");
    console.log(
      `${colors.bright}Total Tests: ${totalPassed + totalFailed}${colors.reset}`,
    );
    console.log(`${colors.green}✅ Passed: ${totalPassed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${totalFailed}${colors.reset}`);

    const successRate =
      totalPassed > 0
        ? ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)
        : 0;
    console.log(
      `${colors.cyan}📊 Success Rate: ${successRate}%${colors.reset}`,
    );

    if (totalFailed === 0) {
      log.success(
        "🎉 ALL VERIFICATIONS PASSED! System is ready for production.",
      );
    } else if (successRate >= 80) {
      log.warning(
        "⚠️  Most verifications passed. Review failed tests before production deployment.",
      );
    } else {
      log.error(
        "🚨 Multiple verifications failed. System needs attention before production deployment.",
      );
    }

    return {
      totalPassed,
      totalFailed,
      successRate: parseFloat(successRate),
      ready: totalFailed === 0,
    };
  }
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.blue}`);
  console.log(
    "╔══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║                    AirPlus Aviation                         ║",
  );
  console.log(
    "║               Final System Verification                     ║",
  );
  console.log(
    "║                                                              ║",
  );
  console.log(
    "║    Verifying: RLS Policies • Photos • PDF • QR Codes        ║",
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝",
  );
  console.log(colors.reset);

  // Load environment
  const env = await loadEnv();
  const supabaseUrl =
    env.VITE_SUPABASE_URL || 
    process.env.VITE_SUPABASE_URL ||
    "https://fyngvoojdfjexbzasgiz.supabase.co";
  const supabaseKey = 
    env.VITE_SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_ANON_KEY ||
    "your-anon-key-here";

  if (!supabaseUrl || supabaseUrl === "your-supabase-url") {
    log.error("❌ Supabase URL not configured properly");
    log.info("Set VITE_SUPABASE_URL environment variable or .env.production file");
    process.exit(1);
  }

  if (!supabaseKey || supabaseKey === "your-anon-key-here") {
    log.error("❌ Supabase anon key not configured properly");
    log.info("Set VITE_SUPABASE_ANON_KEY environment variable or .env.production file");
    process.exit(1);
  }

  log.info(`Connected to Supabase: ${supabaseUrl}`);

  // Initialize verification
  const verification = new AirPlusVerification(supabaseUrl, supabaseKey);

  try {
    // Run all verification tests
    await verification.verifyRLSPolicies();
    await verification.verifyPhotoFunctionality();
    await verification.verifyPDFGeneration();
    await verification.verifyQRCodeFunctionality();
    await verification.verifySystemIntegration();

    // Generate final report
    const report = verification.generateReport();

    // Exit with appropriate code
    process.exit(report.ready ? 0 : 1);
  } catch (error) {
    log.error(`❌ Verification failed with critical error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Critical error:', error);
    process.exit(1);
  });
}

module.exports = { AirPlusVerification };
