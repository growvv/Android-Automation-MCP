#!/usr/bin/env node

import { AndroidAutomation } from '../dist/android/automation.js';

async function testAndroidAutomation() {
  console.log('🤖 Testing Android MCP Server...');
  
  try {
    const automation = new AndroidAutomation();
    
    // Test basic functionality
    console.log('📱 Testing device connection...');
    await automation.initializeDevice();
    console.log('✅ Device connected successfully');
    
    // Test screen info
    console.log('📸 Testing screen info...');
    const screenInfo = await automation.getScreenInfo();
    console.log(`✅ Screen info: ${screenInfo.width}x${screenInfo.height}, ${screenInfo.elements.length} elements`);
    
    // Test screenshot
    console.log('📷 Testing screenshot...');
    const screenshot = await automation.takeScreenshot();
    console.log(`✅ Screenshot captured: ${screenshot.base64Data.length} base64 characters`);
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Only run if this is the main module
if (process.argv[1].includes('test.js')) {
  testAndroidAutomation();
}