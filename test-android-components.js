import { AndroidAutomation } from './dist/android/automation.js';
import { logger } from './dist/utils/logger.js';
import fs from 'fs';
import path from 'path';

async function testAndroidComponents() {
  console.log('🧪 Starting local test for android_get_components...');
  
  try {
    // Create AndroidAutomation instance
    const automation = new AndroidAutomation();
    
    console.log('📱 Testing device connection...');
    
    // Test device initialization
    try {
      await automation.initializeDevice();
      console.log('✅ Device initialization successful');
    } catch (error) {
      console.log('⚠️ Device initialization failed, continuing with test:', error.message);
    }
    
    console.log('🔍 Testing getScreenInfo...');
    
    // Test getScreenInfo
    const startTime = Date.now();
    const screenInfo = await automation.getScreenInfo();
    const endTime = Date.now();
    
    console.log('📊 Test Results:');
    console.log(`⏱️ Execution time: ${endTime - startTime}ms`);
    console.log(`📱 Screen: ${screenInfo.width}x${screenInfo.height}`);
    console.log(`📦 Current app: ${screenInfo.currentApp}`);
    console.log(`🔢 Total elements: ${screenInfo.elements.length}`);
    console.log(`🎯 Clickable elements: ${screenInfo.elements.filter(el => el.clickable).length}`);
    console.log(`📝 Elements with text: ${screenInfo.elements.filter(el => el.text).length}`);
    console.log(`🏷️ Elements with resourceId: ${screenInfo.elements.filter(el => el.resourceId).length}`);
    
    // Show first few elements as examples
    if (screenInfo.elements.length > 0) {
      console.log('\n📋 Sample elements:');
      screenInfo.elements.slice(0, 3).forEach((el, index) => {
        console.log(`${index + 1}. ${el.className || 'Unknown'}`);
        console.log(`   Text: "${el.text}"`);
        console.log(`   ResourceId: "${el.resourceId}"`);
        console.log(`   Bounds: [${el.bounds.left},${el.bounds.top}][${el.bounds.right},${el.bounds.bottom}]`);
        console.log(`   Clickable: ${el.clickable}`);
        console.log('');
      });
    } else {
      console.log('❌ No elements found! This indicates a problem.');
    }
    
    // Test debug file creation
    console.log('📁 Testing debug file creation...');
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      testResults: {
        executionTime: endTime - startTime,
        elementCount: screenInfo.elements.length,
        screenDimensions: `${screenInfo.width}x${screenInfo.height}`,
        currentApp: screenInfo.currentApp
      },
      screenInfo: screenInfo
    };
    
    try {
      fs.writeFileSync('test_debug_output.json', JSON.stringify(debugInfo, null, 2));
      console.log('✅ Debug file created: test_debug_output.json');
    } catch (error) {
      console.log('❌ Failed to create debug file:', error.message);
    }
    
    // Check for MCP debug files
    const debugFiles = ['debug_components_screenInfo.json', 'debug_components_debugInfo.json'];
    debugFiles.forEach(filename => {
      if (fs.existsSync(filename)) {
        console.log(`✅ Found MCP debug file: ${filename}`);
      } else {
        console.log(`❌ Missing MCP debug file: ${filename}`);
      }
    });
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testAndroidComponents().catch(console.error);