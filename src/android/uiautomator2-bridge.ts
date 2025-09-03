import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface UIAutomator2Command {
  action: string;
  args: Record<string, any>;
}

export interface UIAutomator2Response {
  success?: boolean;
  error?: string;
  data?: any;
  found?: boolean;
  element?: {
    text: string;
    description: string;
    resourceId: string;
    className: string;
    bounds: [number, number, number, number]; // [x1, y1, x2, y2] format to save tokens
    clickable: boolean;
    enabled: boolean;
  };
  message?: string;
}

export class UIAutomator2Bridge {
  private pythonProcess: ChildProcess | null = null;
  private isInitialized = false;
  private responseCallbacks = new Map<number, (response: UIAutomator2Response) => void>();
  private commandId = 0;
  private responseBuffer = '';

  constructor(private deviceSerial?: string) {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const pythonScript = join(__dirname, '..', '..', 'src', 'python', 'uiautomator2_bridge.py');
    
    return new Promise((resolve, reject) => {
      try {
        this.pythonProcess = spawn('python', [pythonScript], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        this.pythonProcess.stdout?.on('data', (data) => {
          this.responseBuffer += data.toString();
          
          // Try to extract complete JSON objects from the buffer
          let startIndex = 0;
          while (true) {
            const openBrace = this.responseBuffer.indexOf('{', startIndex);
            if (openBrace === -1) break;
            
            // Find the matching closing brace
            let braceCount = 0;
            let endIndex = -1;
            for (let i = openBrace; i < this.responseBuffer.length; i++) {
              if (this.responseBuffer[i] === '{') braceCount++;
              else if (this.responseBuffer[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                  endIndex = i;
                  break;
                }
              }
            }
            
            if (endIndex === -1) {
              // Incomplete JSON, wait for more data
              break;
            }
            
            // Extract complete JSON string
            const jsonStr = this.responseBuffer.substring(openBrace, endIndex + 1);
            try {
              const response = JSON.parse(jsonStr);
              this.handleResponse(response);
            } catch (err) {
              console.error('Failed to parse Python response:', jsonStr.substring(0, 200) + '...');
              console.error('Parse error:', err);
            }
            
            // Remove processed JSON from buffer
            this.responseBuffer = this.responseBuffer.substring(endIndex + 1);
            startIndex = 0;
          }
        });

        this.pythonProcess.stderr?.on('data', (data) => {
          console.error('Python stderr:', data.toString());
        });

        this.pythonProcess.on('error', (error) => {
          console.error('Python process error:', error);
          reject(error);
        });

        this.pythonProcess.on('exit', (code) => {
          console.log('Python process exited with code:', code);
          this.isInitialized = false;
        });

        // Test connection with timeout
        setTimeout(() => {
          this.sendCommand('get_device_info', this.deviceSerial ? { deviceSerial: this.deviceSerial } : {})
            .then(() => {
              this.isInitialized = true;
              resolve();
            })
            .catch(reject);
        }, 1000); // Wait 1 second for Python process to be ready

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleResponse(response: UIAutomator2Response): void {
    // For now, we'll use a simple approach without command IDs
    // In a more complex implementation, you'd track command IDs
    if (this.pendingResolve) {
      this.pendingResolve(response);
      this.pendingResolve = null;
    }
  }

  private pendingResolve: ((response: UIAutomator2Response) => void) | null = null;

  private async sendCommand(action: string, args: Record<string, any> = {}): Promise<UIAutomator2Response> {
    if (!this.pythonProcess) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const command: UIAutomator2Command = { action, args };
      const commandStr = JSON.stringify(command) + '\n';

      this.pendingResolve = resolve;

      this.pythonProcess?.stdin?.write(commandStr, (error) => {
        if (error) {
          this.pendingResolve = null;
          reject(error);
        }
      });

      // Timeout after 30 seconds for initialization, 10 seconds for regular commands
      const timeout = action === 'get_device_info' && !this.isInitialized ? 30000 : 10000;
      setTimeout(() => {
        if (this.pendingResolve === resolve) {
          this.pendingResolve = null;
          reject(new Error(`Command ${action} timeout after ${timeout}ms`));
        }
      }, timeout);
    });
  }

  async getDeviceInfo(): Promise<UIAutomator2Response> {
    return this.sendCommand('get_device_info');
  }

  async tap(x: number, y: number): Promise<UIAutomator2Response> {
    return this.sendCommand('tap', { x, y });
  }

  async inputText(text: string): Promise<UIAutomator2Response> {
    return this.sendCommand('input_text', { text });
  }

  async findElement(options: {
    text?: string;
    textContains?: string;
    description?: string;
    resourceId?: string;
    className?: string;
  }): Promise<UIAutomator2Response> {
    return this.sendCommand('find_element', options);
  }

  async getScreenDump(): Promise<UIAutomator2Response> {
    return this.sendCommand('get_screen_dump');
  }

  async openApp(packageName: string, stop = false, useMonkey = false, activity?: string): Promise<UIAutomator2Response> {
    return this.sendCommand('open_app', { packageName, stop, useMonkey, activity });
  }

  async pressKey(key: string): Promise<UIAutomator2Response> {
    return this.sendCommand('press_key', { key });
  }

  async swipe(fx: number, fy: number, tx: number, ty: number, duration: number = 0.5): Promise<UIAutomator2Response> {
    return this.sendCommand('swipe', { fx, fy, tx, ty, duration });
  }

  async longTap(x: number, y: number, duration = 0.5): Promise<UIAutomator2Response> {
    return this.sendCommand('long_tap', { x, y, duration });
  }

  async doubleTap(x: number, y: number, duration = 0.1): Promise<UIAutomator2Response> {
    return this.sendCommand('double_tap', { x, y, duration });
  }

  async takeScreenshot(filename?: string, format = 'pillow'): Promise<UIAutomator2Response> {
    return this.sendCommand('take_screenshot', { filename, format });
  }

  async xpathOperation(xpath: string, action: string = 'click', text?: string): Promise<UIAutomator2Response> {
    return this.sendCommand('xpath_operation', { xpath, action, text });
  }

  async getInstalledApps(): Promise<UIAutomator2Response> {
    return this.sendCommand('get_installed_apps');
  }

  async close(): Promise<void> {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
      this.isInitialized = false;
    }
  }
}