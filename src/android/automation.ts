import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { UIAutomator2Bridge } from './uiautomator2-bridge.js';
import { logger } from '../utils/logger.js';
import sharp from 'sharp';

const execAsync = promisify(exec);

export interface FindElementOptions {
  text?: string;
  description?: string;
  resourceId?: string;
  className?: string;
}

export interface ScreenInfo {
  width: number;
  height: number;
  elements: UIElement[];
  currentApp: string;
}

export interface UIElement {
  text?: string;
  description: string;
  resourceId: string;
  className: string;
  bounds: [number, number, number, number]; // [x1, y1, x2, y2] format to save tokens
  clickable?: boolean;
  enabled?: boolean;
}

export class AndroidAutomation {
  private deviceSerial?: string;
  private uiautomatorPort = 9008;
  private baseUrl: string;
  private pythonBridge?: UIAutomator2Bridge;
  private usePythonBridge = true; // Prefer Python bridge over HTTP API

  constructor(deviceSerial?: string) {
    this.deviceSerial = deviceSerial;
    this.baseUrl = `http://localhost:${this.uiautomatorPort}`;
    this.pythonBridge = new UIAutomator2Bridge(deviceSerial);
  }

  async initializeDevice(): Promise<void> {
    try {
      // Initialize Python bridge first
      if (this.usePythonBridge && this.pythonBridge) {
        try {
          await this.pythonBridge.initialize();
          console.log(`Using Python uiautomator2 bridge for device: ${this.deviceSerial || 'default'}`);
          return;
        } catch (error) {
          console.warn('Failed to initialize Python bridge, falling back to HTTP API:', error);
          this.usePythonBridge = false;
        }
      }

      // Fallback to HTTP API initialization
      const devices = await this.getDevices();
      if (devices.length === 0) {
        throw new Error('No Android devices found. Please connect a device or start an emulator.');
      }

      if (!this.deviceSerial) {
        this.deviceSerial = devices[0];
      }

      console.log(`Using device: ${this.deviceSerial}`);
      
      // Install and start uiautomator2 server on device
      await this.installUiautomator2();
      await this.startUiautomator2Server();
      
      // Wait for server to be ready
      await this.waitForServer();
    } catch (error) {
      throw new Error(`Failed to initialize device: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getDevices(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('adb devices');
      const lines = stdout.split('\n').slice(1);
      const devices = lines
        .filter(line => line.includes('\tdevice'))
        .map(line => line.split('\t')[0]);
      return devices;
    } catch (error) {
      throw new Error(`Failed to get devices: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async installUiautomator2(): Promise<void> {
    try {
      // Install uiautomator2 using pip (assuming it's available)
      await execAsync('python -m pip install uiautomator2');
      
      // Initialize device with a simple test
      const deviceFlag = this.deviceSerial ? `-s ${this.deviceSerial}` : '';
      await execAsync(`python -c "import uiautomator2 as u2; d = u2.connect('${this.deviceSerial || ''}'); print('Device connected:', d.info.get('displayWidth', 'unknown'))"`);
    } catch (error) {
      console.warn('Failed to install/initialize uiautomator2:', error);
      // Fallback to manual ADB commands
    }
  }

  private async startUiautomator2Server(): Promise<void> {
    try {
      const deviceFlag = this.deviceSerial ? `-s ${this.deviceSerial}` : '';
      
      // Forward port for uiautomator2 server
      await execAsync(`adb ${deviceFlag} forward tcp:${this.uiautomatorPort} tcp:9008`);
      
      // Start uiautomator2 server on device
      await execAsync(`adb ${deviceFlag} shell "am start -n com.github.uiautomator/.MainActivity"`);
    } catch (error) {
      console.warn('Failed to start uiautomator2 server:', error);
    }
  }

  private async waitForServer(timeout = 10000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        await axios.get(`${this.baseUrl}/ping`, { timeout: 1000 });
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    console.warn('uiautomator2 server not responding, falling back to ADB commands');
  }

  async openApp(packageName: string, stop = false, useMonkey = false, activity?: string): Promise<void> {
    try {
      // Try Python bridge first
      if (this.usePythonBridge && this.pythonBridge) {
        try {
          const result = await this.pythonBridge.openApp(packageName, stop, useMonkey, activity);
          if (result.success) {
            // Reduced wait time for app to load
            await new Promise(resolve => setTimeout(resolve, 500));
            return;
          }
          throw new Error(result.error || 'Python bridge open app failed');
        } catch (error) {
          console.warn('Python bridge open app failed, falling back to ADB:', error);
        }
      }

      // Fallback to ADB monkey command
      const deviceFlag = this.deviceSerial ? `-s ${this.deviceSerial}` : '';
      
      if (stop) {
        // Stop app first if requested
        await execAsync(`adb ${deviceFlag} shell am force-stop ${packageName}`);
      }
      
      if (activity) {
        // Start with specific activity
        await execAsync(`adb ${deviceFlag} shell am start -n ${packageName}/${activity}`);
      } else if (useMonkey) {
        // Use monkey to start the app
        await execAsync(`adb ${deviceFlag} shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`);
      } else {
        // Try monkey as default
        await execAsync(`adb ${deviceFlag} shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`);
      }
      
      // Reduced wait time for app to load
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      throw new Error(`Failed to open app ${packageName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async tap(x: number, y: number): Promise<void> {
    try {
      // Try Python bridge first
      if (this.usePythonBridge && this.pythonBridge) {
        try {
          const result = await this.pythonBridge.tap(x, y);
          if (result.success) return;
          throw new Error(result.error || 'Python bridge tap failed');
        } catch (error) {
          console.warn('Python bridge tap failed, falling back to HTTP/ADB:', error);
        }
      }

      // Try uiautomator2 API first
      try {
        await axios.post(`${this.baseUrl}/click`, { x, y }, { timeout: 5000 });
        return;
      } catch (apiError) {
        // Fallback to ADB
        const deviceFlag = this.deviceSerial ? `-s ${this.deviceSerial}` : '';
        await execAsync(`adb ${deviceFlag} shell input tap ${x} ${y}`);
      }
    } catch (error) {
      throw new Error(`Failed to tap at (${x}, ${y}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findAndTap(options: FindElementOptions): Promise<string> {
    try {
      const element = await this.findElement(options);
      if (element) {
        const centerX = (element.bounds[0] + element.bounds[2]) / 2;
        const centerY = (element.bounds[1] + element.bounds[3]) / 2;
        await this.tap(centerX, centerY);
        return `Found and tapped element: ${element.description || element.resourceId || element.className}`;
      } else {
        return `Element not found with criteria: ${JSON.stringify(options)}`;
      }
    } catch (error) {
      throw new Error(`Failed to find and tap element: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findElement(options: FindElementOptions): Promise<UIElement | null> {
    try {
      // Try Python bridge first
      if (this.usePythonBridge && this.pythonBridge) {
        try {
          const result = await this.pythonBridge.findElement({
            text: options.text,
            textContains: options.text, // Also try textContains for better matching
            description: options.description,
            resourceId: options.resourceId,
            className: options.className
          });
          
          if (result.success && result.found && result.element) {
            return {
              description: result.element.description,
              resourceId: result.element.resourceId,
              className: result.element.className,
              bounds: result.element.bounds
              // Only include the 4 required attributes
            };
          } else if (result.success && !result.found) {
            return null;
          }
          throw new Error(result.error || 'Python bridge find element failed');
        } catch (error) {
          console.warn('Python bridge find element failed, falling back to screen parsing:', error);
        }
      }

      // Fallback to screen info parsing
      const screenInfo = await this.getScreenInfo();
      
      for (const element of screenInfo.elements) {
        if (options.text && element.description && element.description.includes(options.text)) {
          return element;
        }
        if (options.description && element.description.includes(options.description)) {
          return element;
        }
        if (options.resourceId && element.resourceId.includes(options.resourceId)) {
          return element;
        }
        if (options.className && element.className.includes(options.className)) {
          return element;
        }
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to find element: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async inputText(text: string): Promise<void> {
    try {
      // Try Python bridge first
      if (this.usePythonBridge && this.pythonBridge) {
        try {
          const result = await this.pythonBridge.inputText(text);
          if (result.success) return;
          throw new Error(result.error || 'Python bridge input text failed');
        } catch (error) {
          console.warn('Python bridge input text failed, falling back to HTTP/ADB:', error);
        }
      }

      // Try uiautomator2 API first
      try {
        await axios.post(`${this.baseUrl}/send_keys`, { text }, { timeout: 5000 });
        return;
      } catch (apiError) {
        // Fallback to ADB
        const deviceFlag = this.deviceSerial ? `-s ${this.deviceSerial}` : '';
        const escapedText = text.replace(/[\"\'\\]/g, '\\$&');
        await execAsync(`adb ${deviceFlag} shell input text "${escapedText}"`);
      }
    } catch (error) {
      throw new Error(`Failed to input text "${text}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async xpathOperation(xpath: string, action: string = 'click', text?: string): Promise<string> {
    try {
      // Try Python bridge first
      if (this.usePythonBridge && this.pythonBridge) {
        try {
          const result = await this.pythonBridge.xpathOperation(xpath, action, text);
          if (result.success) {
            return result.message || `XPath operation '${action}' completed successfully`;
          }
          throw new Error(result.error || 'Python bridge XPath operation failed');
        } catch (error) {
          console.warn('Python bridge XPath operation failed, no fallback available:', error);
          throw error;
        }
      }

      throw new Error('XPath operations require Python bridge with uiautomator2');
    } catch (error) {
      throw new Error(`Failed to execute XPath operation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async search(query: string): Promise<string> {
    try {
      // Common search patterns
      const searchPatterns = [
        { text: '搜索' },
        { text: 'Search' },
        { text: '查找' },
        { description: 'search' },
        { resourceId: 'search' },
        { resourceId: 'edit_text' },
        { className: 'EditText' }
      ];

      let searchElement = null;
      for (const pattern of searchPatterns) {
        searchElement = await this.findElement(pattern);
        if (searchElement) break;
      }

      if (!searchElement) {
        return 'Search box not found';
      }

      // Tap on search box
      const centerX = (searchElement.bounds[0] + searchElement.bounds[2]) / 2;
      const centerY = (searchElement.bounds[1] + searchElement.bounds[3]) / 2;
      await this.tap(centerX, centerY);
      
      // Reduced wait time for search box to focus
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Input search query
      await this.inputText(query);
      
      // Press enter or search button
      await this.pressKey('KEYCODE_ENTER');
      
      return `Searched for: ${query}`;
    } catch (error) {
      throw new Error(`Failed to search for "${query}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getScreenInfo(): Promise<ScreenInfo> {
    try {
      logger.info('🔍 Starting getScreenInfo()');
      
      // Ensure device is initialized
      if (!this.pythonBridge && this.usePythonBridge) {
        try {
          logger.debug('Initializing device...');
          await this.initializeDevice();
        } catch (error) {
          logger.warn('Failed to initialize device, continuing with ADB fallback:', error);
        }
      }

      logger.debug("Getting screen info...")

      // Try Python bridge first
      if (this.usePythonBridge && this.pythonBridge) {
        try {
          logger.debug('Trying Python bridge for screen dump');
          const result = await this.pythonBridge.getScreenDump();
          if (result.success && result.data) {
            logger.info('✅ Python bridge screen dump successful');
            return this.parseScreenInfo({
              xml: result.data.xml,
              displayWidth: result.data.displayWidth,
              displayHeight: result.data.displayHeight,
              currentPackageName: result.data.currentPackageName
            });
          }
          logger.warn("❌ Python bridge screen dump failed, trying fallback", result.error);
          throw new Error(result.error || 'Python bridge screen dump failed');
        } catch (error) {
          logger.warn('❌ Python bridge screen dump failed, falling back to HTTP/ADB:', error);
        }
      }

      // Try uiautomator2 API first
      try {
        logger.debug("Trying uiautomator2 HTTP API");
        const response = await axios.get(`${this.baseUrl}/dump`, { timeout: 10000 });
        logger.info('✅ uiautomator2 HTTP API successful');
        return this.parseScreenInfo(response.data);
      } catch (apiError) {
        logger.warn('❌ uiautomator2 HTTP API failed, falling back to ADB UI dump:', apiError);
        // Fallback to ADB UI dump
        return await this.getScreenInfoViaADB();
      }
    } catch (error) {
      throw new Error(`Failed to get screen info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getScreenInfoViaADB(): Promise<ScreenInfo> {
    try {
      logger.info('🔧 Starting getScreenInfoViaADB fallback method');
      const deviceFlag = this.deviceSerial ? `-s ${this.deviceSerial}` : '';
      logger.debug(`Using device flag: "${deviceFlag}"`);
      
      // Get screen size
      logger.debug('Getting screen size...');
      const { stdout: sizeOutput } = await execAsync(`adb ${deviceFlag} shell wm size`);
      logger.debug('Screen size output:', sizeOutput);
      const sizeMatch = sizeOutput.match(/(\d+)x(\d+)/);
      const width = sizeMatch ? parseInt(sizeMatch[1]) : 1080;
      const height = sizeMatch ? parseInt(sizeMatch[2]) : 1920;
      logger.info(`📱 Screen dimensions: ${width}x${height}`);
      
      // Get current app (Windows compatible)
      let currentApp = 'unknown';
      try {
        logger.debug('Getting current focused app...');
        const { stdout: appOutput } = await execAsync(`adb ${deviceFlag} shell dumpsys window`);
        const lines = appOutput.split('\n');
        for (const line of lines) {
          if (line.includes('mCurrentFocus')) {
            const appMatch = line.match(/([a-zA-Z0-9.]+)\/([a-zA-Z0-9.]+)/);
            if (appMatch) {
              currentApp = appMatch[1];
              break;
            }
          }
        }
        logger.info(`📱 Current app: ${currentApp}`);
      } catch (error) {
        logger.warn('⚠️ Failed to get current app, using default:', error);
      }
      
      // Get UI dump with multiple fallback methods
      let dumpOutput = '';
      let dumpMethod = 'unknown';
      
      logger.info('🔍 Starting UI dump attempts...');
      
      try {
        // Method 1: Try standard uiautomator dump
        logger.debug('🔸 Method 1: standard uiautomator dump');
        await execAsync(`adb ${deviceFlag} shell uiautomator dump`);
        const { stdout } = await execAsync(`adb ${deviceFlag} shell cat /sdcard/window_dump.xml`);
        dumpOutput = stdout;
        dumpMethod = 'standard_dump';
        logger.info('✅ Method 1 succeeded');
      } catch (error) {
        logger.warn('❌ Method 1 failed:', error);
        try {
          // Method 2: Try with explicit dump path
          logger.debug('🔸 Method 2: explicit dump path');
          await execAsync(`adb ${deviceFlag} shell uiautomator dump /sdcard/ui_dump.xml`);
          const { stdout } = await execAsync(`adb ${deviceFlag} shell cat /sdcard/ui_dump.xml`);
          dumpOutput = stdout;
          dumpMethod = 'explicit_path';
          logger.info('✅ Method 2 succeeded');
        } catch (error2) {
          logger.warn('❌ Method 2 failed:', error2);
          try {
            // Method 3: Alternative dump command
            logger.debug('🔸 Method 3: dump to stdout');
            const { stdout } = await execAsync(`adb ${deviceFlag} shell uiautomator dump --compressed /dev/stdout`);
            dumpOutput = stdout;
            dumpMethod = 'stdout_dump';
            logger.info('✅ Method 3 succeeded');
          } catch (error3) {
            logger.warn('❌ Method 3 failed:', error3);
            try {
              // Method 4: Try without compression
              logger.debug('🔸 Method 4: dump without compression');
              const { stdout } = await execAsync(`adb ${deviceFlag} shell uiautomator dump /dev/stdout`);
              dumpOutput = stdout;
              dumpMethod = 'uncompressed_stdout';
              logger.info('✅ Method 4 succeeded');
            } catch (error4) {
              logger.warn('❌ Method 4 failed:', error4);
              // Method 5: Basic window dump as last resort
              logger.warn('⚠️ All uiautomator dump methods failed, using basic window info');
              dumpOutput = '<hierarchy><node class="android.widget.FrameLayout" text="" resource-id="" bounds="[0,0][1080,1920]" clickable="false" enabled="true"/></hierarchy>';
              dumpMethod = 'fallback';
            }
          }
        }
      }
      
      logger.info(`📋 Using dump method: ${dumpMethod}`);
      logger.debug(`Dump output length: ${dumpOutput.length} characters`);
      logger.debug(`Dump preview: ${dumpOutput.substring(0, 300)}`);
      
      return this.parseUIDump(dumpOutput, width, height, currentApp);
    } catch (error) {
      throw new Error(`Failed to get screen info via ADB: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private parseScreenInfo(data: any): ScreenInfo {
    // Handle both Python bridge data and uiautomator2 API response
    if (data.xml) {
      // Python bridge format
      return this.parseUIDump(data.xml, data.displayWidth || 1080, data.displayHeight || 1920, data.currentPackageName || 'unknown');
    } else {
      // Parse uiautomator2 API response
      return {
        width: data.displayWidth || 1080,
        height: data.displayHeight || 1920,
        elements: data.elements || [],
        currentApp: data.currentPackageName || 'unknown'
      };
    }
  }

  private parseUIDump(xml: string, width: number, height: number, currentApp: string): ScreenInfo {
    const elements: UIElement[] = [];
    
    logger.info('🔍 Starting parseUIDump (simplified mode)');
    logger.debug('XML dump details', {
      length: xml.length,
      preview: xml.substring(0, 200),
      hasNodes: xml.includes('<node'),
      hasHierarchy: xml.includes('<hierarchy')
    });
    
    // Handle both self-closing and opening node tags
    const nodeMatches = xml.match(/<node[^>]*\/?>/g) || [];
    logger.info(`📊 Found ${nodeMatches.length} node matches in XML`);
    
    for (const nodeMatch of nodeMatches) {
      // Only extract essential attributes: resource-id, class, description, bounds
      const resourceMatch = nodeMatch.match(/resource-id="([^"]*)"/);
      const classMatch = nodeMatch.match(/class="([^"]*)"/);
      const descMatch = nodeMatch.match(/content-desc="([^"]*)"/);
      const boundsMatch = nodeMatch.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
      
      if (boundsMatch) {
        const element: UIElement = {
          description: descMatch ? descMatch[1] : '',
          resourceId: resourceMatch ? resourceMatch[1] : '',
          className: classMatch ? classMatch[1] : '',
          bounds: [
            parseInt(boundsMatch[1]), // x1 (left)
            parseInt(boundsMatch[2]), // y1 (top)
            parseInt(boundsMatch[3]), // x2 (right)
            parseInt(boundsMatch[4])  // y2 (bottom)
          ]
          // text, clickable, enabled are now optional and not included
        };
        elements.push(element);
      }
    }
    
    // Use more relaxed filtering - include elements with any meaningful content
    const filteredElements = elements.filter(el => 
      el.description || 
      el.resourceId || 
      el.className.includes('Button') ||
      el.className.includes('Text') ||
      el.className.includes('Edit') ||
      el.className.includes('View') ||
      el.className.includes('Image')
    );
    
    logger.info('📈 Simplified element processing complete', {
      totalElements: elements.length,
      filteredElements: filteredElements.length,
      elementsWithDescription: elements.filter(el => el.description).length,
      elementsWithResourceId: elements.filter(el => el.resourceId).length
    });
    
    // If still no elements after filtering, return all elements
    const finalElements = filteredElements.length > 0 ? filteredElements : elements;
    
    logger.info(`🎯 Returning ${finalElements.length} simplified elements`);
    
    return {
      width,
      height,
      elements: finalElements,
      currentApp
    };
  }

  async back(): Promise<void> {
    await this.pressKey('KEYCODE_BACK');
  }

  async home(): Promise<void> {
    await this.pressKey('KEYCODE_HOME');
  }

  async scroll(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
    try {
      const screenInfo = await this.getScreenInfo();
      const centerX = screenInfo.width / 2;
      const centerY = screenInfo.height / 2;
      
      let startX = centerX, startY = centerY;
      let endX = centerX, endY = centerY;
      
      switch (direction) {
        case 'up':
          startY = centerY + 200;
          endY = centerY - 200;
          break;
        case 'down':
          startY = centerY - 200;
          endY = centerY + 200;
          break;
        case 'left':
          startX = centerX + 200;
          endX = centerX - 200;
          break;
        case 'right':
          startX = centerX - 200;
          endX = centerX + 200;
          break;
      }
      
      await this.swipe(startX, startY, endX, endY);
    } catch (error) {
      throw new Error(`Failed to scroll ${direction}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async swipe(startX: number, startY: number, endX: number, endY: number, duration = 500): Promise<void> {
    try {
      // Try Python bridge first
      if (this.usePythonBridge && this.pythonBridge) {
        try {
          const result = await this.pythonBridge.swipe(startX, startY, endX, endY, duration / 1000); // Convert to seconds
          if (result.success) return;
          throw new Error(result.error || 'Python bridge swipe failed');
        } catch (error) {
          console.warn('Python bridge swipe failed, falling back to HTTP/ADB:', error);
        }
      }

      // Try uiautomator2 API first
      try {
        await axios.post(`${this.baseUrl}/swipe`, {
          fx: startX,
          fy: startY,
          tx: endX,
          ty: endY,
          duration: duration
        }, { timeout: 5000 });
        return;
      } catch (apiError) {
        // Fallback to ADB
        const deviceFlag = this.deviceSerial ? `-s ${this.deviceSerial}` : '';
        await execAsync(`adb ${deviceFlag} shell input swipe ${startX} ${startY} ${endX} ${endY} ${duration}`);
      }
    } catch (error) {
      throw new Error(`Failed to swipe: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async longTap(x: number, y: number, duration = 0.5): Promise<void> {
    try {
      // Try Python bridge first
      if (this.usePythonBridge && this.pythonBridge) {
        try {
          const result = await this.pythonBridge.longTap(x, y, duration);
          if (result.success) return;
          throw new Error(result.error || 'Python bridge long tap failed');
        } catch (error) {
          console.warn('Python bridge long tap failed, falling back to ADB:', error);
        }
      }

      // Fallback to ADB long click simulation
      const deviceFlag = this.deviceSerial ? `-s ${this.deviceSerial}` : '';
      const durationMs = Math.round(duration * 1000);
      await execAsync(`adb ${deviceFlag} shell input touchscreen swipe ${x} ${y} ${x} ${y} ${durationMs}`);
    } catch (error) {
      throw new Error(`Failed to long tap at (${x}, ${y}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async doubleTap(x: number, y: number, duration = 0.1): Promise<void> {
    try {
      // Try Python bridge first
      if (this.usePythonBridge && this.pythonBridge) {
        try {
          const result = await this.pythonBridge.doubleTap(x, y, duration);
          if (result.success) return;
          throw new Error(result.error || 'Python bridge double tap failed');
        } catch (error) {
          console.warn('Python bridge double tap failed, falling back to ADB:', error);
        }
      }

      // Fallback to two quick taps with reduced delay
      await this.tap(x, y);
      await new Promise(resolve => setTimeout(resolve, Math.max(50, duration * 1000))); // Min 50ms delay
      await this.tap(x, y);
    } catch (error) {
      throw new Error(`Failed to double tap at (${x}, ${y}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async pressKey(keyCode: string): Promise<void> {
    try {
      // Try Python bridge first
      if (this.usePythonBridge && this.pythonBridge) {
        try {
          const result = await this.pythonBridge.pressKey(keyCode);
          if (result.success) return;
          throw new Error(result.error || 'Python bridge press key failed');
        } catch (error) {
          console.warn('Python bridge press key failed, falling back to ADB:', error);
        }
      }

      // Fallback to ADB
      const deviceFlag = this.deviceSerial ? `-s ${this.deviceSerial}` : '';
      await execAsync(`adb ${deviceFlag} shell input keyevent ${keyCode}`);
    } catch (error) {
      throw new Error(`Failed to press key ${keyCode}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async compressImageToTarget(imageBuffer: Buffer, targetSizeKB = 128): Promise<Buffer> {
    const targetBytes = targetSizeKB * 1024;
    let quality = 85;
    let compressed = imageBuffer;
    
    // If already under target size, return as is
    if (imageBuffer.length <= targetBytes) {
      return imageBuffer;
    }
    
    // Try different quality levels to reach target size
    while (quality > 10 && compressed.length > targetBytes) {
      compressed = await sharp(imageBuffer)
        .jpeg({ quality })
        .toBuffer();
      
      if (compressed.length > targetBytes) {
        quality -= 15;
      }
    }
    
    // If still too large, try reducing dimensions
    if (compressed.length > targetBytes) {
      const metadata = await sharp(imageBuffer).metadata();
      let scale = 0.8;
      
      while (scale > 0.3 && compressed.length > targetBytes) {
        const newWidth = Math.round((metadata.width || 1080) * scale);
        const newHeight = Math.round((metadata.height || 1920) * scale);
        
        compressed = await sharp(imageBuffer)
          .resize(newWidth, newHeight)
          .jpeg({ quality: 70 })
          .toBuffer();
          
        scale -= 0.1;
      }
    }
    
    return compressed;
  }

  async takeScreenshot(filename?: string, format = 'pillow'): Promise<{base64Data: string, message?: string}> {
    try {
      // Try Python bridge first
      if (this.usePythonBridge && this.pythonBridge) {
        try {
          const result = await this.pythonBridge.takeScreenshot(filename, format);
          if (result.success) {
            if (filename) {
              // For Python bridge with filename, we need to also get the base64 data
              const noFileResult = await this.pythonBridge.takeScreenshot(undefined, format);
              const imageData = noFileResult.data?.image || '';
              const imageBuffer = Buffer.from(imageData, 'base64');
              const compressedBuffer = await this.compressImageToTarget(imageBuffer);
              return {
                base64Data: compressedBuffer.toString('base64'),
                message: result.message || `Screenshot saved to ${filename}`
              };
            } else {
              const imageData = result.data?.image || '';
              const imageBuffer = Buffer.from(imageData, 'base64');
              const compressedBuffer = await this.compressImageToTarget(imageBuffer);
              return {
                base64Data: compressedBuffer.toString('base64')
              };
            }
          }
          throw new Error(result.error || 'Python bridge screenshot failed');
        } catch (error) {
          console.warn('Python bridge screenshot failed, falling back to ADB:', error);
        }
      }

      // Fallback to ADB screencap
      const deviceFlag = this.deviceSerial ? `-s ${this.deviceSerial}` : '';
      // Always use a temp path on device, never use the filename directly on device
      const tempScreenshotPath = `/sdcard/screenshot_${Date.now()}.png`;
      
      // Delete any existing file with same name first
      try {
        await execAsync(`adb ${deviceFlag} shell rm ${tempScreenshotPath}`);
      } catch (error) {
        // Ignore error if file doesn't exist
      }
      
      await execAsync(`adb ${deviceFlag} shell screencap -p ${tempScreenshotPath}`);
      
      // Always pull screenshot to local temp file and convert to base64
      const tempLocalPath = `./temp_screenshot_${Date.now()}.png`;
      await execAsync(`adb ${deviceFlag} pull ${tempScreenshotPath} ${tempLocalPath}`);
      
      // Read file and convert to base64 using Node.js
      const fs = await import('fs');
      const imageBuffer = fs.readFileSync(tempLocalPath);
      const compressedBuffer = await this.compressImageToTarget(imageBuffer);
      const base64Data = compressedBuffer.toString('base64');
      
      // Clean up temp files
      await execAsync(`adb ${deviceFlag} shell rm ${tempScreenshotPath}`);
      
      if (filename) {
        // Save compressed image to desired filename
        fs.writeFileSync(filename, compressedBuffer);
        fs.unlinkSync(tempLocalPath);
        return {
          base64Data,
          message: `Screenshot saved to ${filename}`
        };
      } else {
        fs.unlinkSync(tempLocalPath);
        return {
          base64Data
        };
      }
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getInstalledApps(): Promise<{packageName: string, appName: string}[]> {
    try {
      // Try Python bridge first
      if (this.usePythonBridge && this.pythonBridge) {
        try {
          const result = await this.pythonBridge.getInstalledApps();
          if (result.success && result.data) {
            return result.data.apps || [];
          }
          throw new Error(result.error || 'Python bridge get apps failed');
        } catch (error) {
          console.warn('Python bridge get apps failed, falling back to ADB:', error);
        }
      }

      // Fallback to ADB package manager
      const deviceFlag = this.deviceSerial ? `-s ${this.deviceSerial}` : '';
      const { stdout } = await execAsync(`adb ${deviceFlag} shell pm list packages -3`);
      
      const packages = stdout.split('\n')
        .filter(line => line.startsWith('package:'))
        .map(line => line.replace('package:', '').trim())
        .filter(pkg => pkg.length > 0);

      // Get app names for packages (simplified approach)
      const apps: {packageName: string, appName: string}[] = [];
      
      for (const packageName of packages) {
        // Use simplified approach - just use package name as app name for now
        // This avoids complex parsing and is faster
        apps.push({ packageName, appName: packageName });
      }
      
      return apps;
    } catch (error) {
      throw new Error(`Failed to get installed apps: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

}