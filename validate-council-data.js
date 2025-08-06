#!/usr/bin/env node

/**
 * Council Data Validation Script
 * 
 * This script validates that council member names and data are consistent
 * across all templates and files in the Keep Alley Trash system.
 */

const fs = require('fs');
const path = require('path');
const { getAllCouncilMembers, validateCouncilData } = require('./council-data');

class CouncilDataValidator {
  constructor() {
    this.councilMembers = getAllCouncilMembers();
    this.errors = [];
    this.warnings = [];
    this.validationPassed = true;
  }

  addError(message) {
    this.errors.push(message);
    this.validationPassed = false;
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  // Validate basic council data structure
  validateDataStructure() {
    console.log('🔍 Validating council data structure...');
    
    if (!validateCouncilData()) {
      this.addError('Basic council data validation failed');
      return;
    }

    // Check for required districts
    const requiredDistricts = [9, 10, 11, 12, 13];
    const presentDistricts = this.councilMembers.map(m => m.district);
    
    requiredDistricts.forEach(district => {
      if (!presentDistricts.includes(district)) {
        this.addError(`Missing data for District ${district}`);
      }
    });

    // Check for duplicate districts
    const duplicates = presentDistricts.filter((item, index) => presentDistricts.indexOf(item) !== index);
    if (duplicates.length > 0) {
      this.addError(`Duplicate districts found: ${duplicates.join(', ')}`);
    }

    console.log('✅ Council data structure validation complete');
  }

  // Validate that newsletter generator will get correct data
  validateNewsletterData() {
    console.log('🔍 Validating newsletter data consistency...');
    
    const { getNewsletterCouncilMembers } = require('./council-data');
    const newsletterData = getNewsletterCouncilMembers();

    if (newsletterData.length !== this.councilMembers.length) {
      this.addError(`Newsletter data count mismatch: expected ${this.councilMembers.length}, got ${newsletterData.length}`);
    }

    newsletterData.forEach(member => {
      if (!member.name || !member.status || !member.votes) {
        this.addError(`Incomplete newsletter data for member: ${JSON.stringify(member)}`);
      }
    });

    console.log('✅ Newsletter data validation complete');
  }

  // Check email addresses format
  validateEmailAddresses() {
    console.log('🔍 Validating email addresses...');
    
    this.councilMembers.forEach(member => {
      if (!member.email.includes('@dallas.gov')) {
        this.addError(`Invalid email format for ${member.name}: ${member.email}`);
      }
      
      // Check for common typos
      if (member.email.includes('..') || member.email.endsWith('.')) {
        this.addError(`Malformed email for ${member.name}: ${member.email}`);
      }
    });

    console.log('✅ Email validation complete');
  }

  // Validate template files exist and can be read
  validateTemplateFiles() {
    console.log('🔍 Validating template files...');
    
    const templateFiles = [
      'views/council-report.handlebars',
      'views/suggestions.handlebars',
      'newsletter-generator.js'
    ];

    templateFiles.forEach(filePath => {
      if (!fs.existsSync(filePath)) {
        this.addError(`Template file not found: ${filePath}`);
      } else {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Check for hardcoded council member names that might be outdated
          const hardcodedPatterns = [
            /paula\.blackmon/gi,
            /kathy\.stewart/gi,
            /william\.roth/gi,
            /cara\.mendelsohn/gi,
            /gay\.willis/gi
          ];

          hardcodedPatterns.forEach(pattern => {
            if (pattern.test(content)) {
              this.addWarning(`Found hardcoded council member reference in ${filePath}`);
            }
          });

        } catch (error) {
          this.addError(`Could not read template file ${filePath}: ${error.message}`);
        }
      }
    });

    console.log('✅ Template file validation complete');
  }

  // Generate a report of all council members
  generateReport() {
    console.log('\n📋 COUNCIL MEMBER REPORT');
    console.log('='.repeat(50));
    
    this.councilMembers.forEach(member => {
      console.log(`\nDistrict ${member.district}: ${member.name}`);
      console.log(`  Email: ${member.email}`);
      console.log(`  Status: ${member.status} (${member.statusLabel})`);
      console.log(`  Votes: ${member.votes}`);
      if (member.quote) {
        console.log(`  Quote: "${member.quote}"`);
      }
    });
  }

  // Run all validations
  runAllValidations() {
    console.log('🚀 Starting council data validation...\n');
    
    this.validateDataStructure();
    this.validateNewsletterData();
    this.validateEmailAddresses();
    this.validateTemplateFiles();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(50));
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    if (this.validationPassed && this.warnings.length === 0) {
      console.log('\n🎉 All validations passed! Council data is consistent.');
    } else if (this.validationPassed) {
      console.log('\n✅ Validations passed with warnings. Please review warnings above.');
    } else {
      console.log('\n💥 Validation failed! Please fix errors above.');
    }

    this.generateReport();
    
    return this.validationPassed;
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new CouncilDataValidator();
  const success = validator.runAllValidations();
  process.exit(success ? 0 : 1);
}

module.exports = CouncilDataValidator;