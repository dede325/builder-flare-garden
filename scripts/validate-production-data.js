#!/usr/bin/env node

/**
 * AirPlus Aviation - Production Data Validation Script
 * Validates that all data sources are production-ready and no mock data exists
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CLIENT_LIB_DIR = path.join(__dirname, '..', 'client', 'lib');

console.log('🔍 AirPlus Aviation - Production Data Validation');
console.log('================================================');

// Validation results
let validationResults = {
  dataFiles: [],
  serviceFiles: [],
  errors: [],
  warnings: []
};

/**
 * Validate JSON data files
 */
function validateDataFiles() {
  console.log('\n📁 Validating data files...');
  
  const dataFiles = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
  
  dataFiles.forEach(filename => {
    const filePath = path.join(DATA_DIR, filename);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      if (Array.isArray(data) && data.length > 0) {
        // Check for real data patterns
        const firstItem = data[0];
        const hasRealIds = firstItem.id && firstItem.id.length > 10;
        const hasRealNames = firstItem.name && !firstItem.name.includes('Demo');
        const hasRealDates = firstItem.created_at || firstItem.hire_date;
        
        if (hasRealIds && hasRealDates) {
          validationResults.dataFiles.push({
            file: filename,
            status: 'valid',
            records: data.length,
            sample: firstItem.name || firstItem.registration || firstItem.code
          });
          console.log(`✅ ${filename}: ${data.length} valid records`);
        } else {
          validationResults.errors.push(`❌ ${filename}: Contains mock/demo data patterns`);
        }
      } else {
        validationResults.warnings.push(`⚠️ ${filename}: Empty or invalid data structure`);
      }
      
    } catch (error) {
      validationResults.errors.push(`❌ ${filename}: JSON parsing error - ${error.message}`);
    }
  });
}

/**
 * Validate service files for mock data
 */
function validateServiceFiles() {
  console.log('\n🔧 Validating service files...');
  
  const serviceFiles = fs.readdirSync(CLIENT_LIB_DIR).filter(file => file.endsWith('.ts'));
  
  const mockDataPatterns = [
    /demo\s*[=:]/i,
    /mock\s*[=:]/i,
    /fallback\s*[=:]/i,
    /test\s*data/i,
    /demo.*user/i,
    /mock.*aircraft/i,
    /placeholder.*employee/i
  ];
  
  serviceFiles.forEach(filename => {
    const filePath = path.join(CLIENT_LIB_DIR, filename);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      let hasMockData = false;
      let mockLines = [];
      
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const mockPattern = mockDataPatterns.some(pattern => pattern.test(line));
        if (mockPattern && !line.trim().startsWith('//')) {
          hasMockData = true;
          mockLines.push(index + 1);
        }
      });
      
      if (hasMockData) {
        validationResults.errors.push(`❌ ${filename}: Contains mock data on lines: ${mockLines.join(', ')}`);
      } else {
        validationResults.serviceFiles.push({
          file: filename,
          status: 'clean',
          lines: lines.length
        });
        console.log(`✅ ${filename}: Clean of mock data`);
      }
      
    } catch (error) {
      validationResults.warnings.push(`⚠️ ${filename}: Read error - ${error.message}`);
    }
  });
}

/**
 * Check migration files
 */
function validateMigrations() {
  console.log('\n🗄️ Validating migrations...');
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    validationResults.errors.push('❌ Migrations directory not found');
    return;
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));
  
  if (migrationFiles.length === 0) {
    validationResults.errors.push('❌ No migration files found');
    return;
  }
  
  // Check for VFINAL migrations
  const vfinalMigrations = migrationFiles.filter(file => file.includes('vfinal'));
  
  if (vfinalMigrations.length >= 2) {
    console.log(`✅ Found ${vfinalMigrations.length} VFINAL migration files`);
    validationResults.dataFiles.push({
      file: 'migrations',
      status: 'valid',
      records: vfinalMigrations.length,
      sample: vfinalMigrations[0]
    });
  } else {
    validationResults.warnings.push('⚠️ VFINAL migrations may be incomplete');
  }
}

/**
 * Generate validation report
 */
function generateReport() {
  console.log('\n📊 Validation Report');
  console.log('====================');
  
  console.log(`\n✅ Valid Data Files: ${validationResults.dataFiles.length}`);
  validationResults.dataFiles.forEach(file => {
    console.log(`   • ${file.file}: ${file.records} records (${file.sample})`);
  });
  
  console.log(`\n✅ Clean Service Files: ${validationResults.serviceFiles.length}`);
  
  if (validationResults.warnings.length > 0) {
    console.log(`\n⚠️ Warnings: ${validationResults.warnings.length}`);
    validationResults.warnings.forEach(warning => console.log(`   ${warning}`));
  }
  
  if (validationResults.errors.length > 0) {
    console.log(`\n❌ Errors: ${validationResults.errors.length}`);
    validationResults.errors.forEach(error => console.log(`   ${error}`));
    console.log('\n🚨 Production readiness: FAILED');
    process.exit(1);
  } else {
    console.log('\n🎉 Production readiness: PASSED');
    console.log('✅ All data sources validated successfully!');
    console.log('✅ No mock data detected in services!');
    console.log('✅ System ready for production deployment!');
  }
}

/**
 * Main validation process
 */
function main() {
  try {
    validateDataFiles();
    validateServiceFiles();
    validateMigrations();
    generateReport();
  } catch (error) {
    console.error('\n💥 Validation failed with error:', error.message);
    process.exit(1);
  }
}

// Run validation
main();
