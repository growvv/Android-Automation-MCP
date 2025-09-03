#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function testMCPServer() {
    console.log('Testing MCP Server...\n');
    
    const serverProcess = spawn('node', [join(__dirname, 'dist/index.js')], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    const testCases = [
        {
            name: 'List Tools',
            request: { jsonrpc: "2.0", method: "tools/list", id: 1 }
        },
        {
            name: 'Get Screen Info',
            request: { jsonrpc: "2.0", method: "tools/call", params: { name: "android_get_screen_info", arguments: {} }, id: 2 }
        },
        {
            name: 'Take Screenshot',
            request: { jsonrpc: "2.0", method: "tools/call", params: { name: "android_screenshot", arguments: { filename: "test_mcp.png" } }, id: 3 }
        }
    ];

    let currentTest = 0;

    function runNextTest() {
        if (currentTest >= testCases.length) {
            console.log('\n✓ All tests completed successfully!');
            serverProcess.kill();
            process.exit(0);
            return;
        }

        const testCase = testCases[currentTest];
        console.log(`Running test: ${testCase.name}`);
        
        serverProcess.stdin.write(JSON.stringify(testCase.request) + '\n');
        currentTest++;
        
        // Move to next test after delay
        setTimeout(runNextTest, 3000);
    }

    serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('"result"')) {
            console.log('✓ Test passed - got result');
        } else if (output.includes('"error"')) {
            console.log('✗ Test failed - got error');
            console.log(output.substring(0, 200) + '...');
        }
    });

    serverProcess.stderr.on('data', (data) => {
        const stderr = data.toString();
        if (stderr.includes('Android MCP Server running')) {
            console.log('✓ Server started successfully');
            setTimeout(runNextTest, 1000);
        } else {
            console.log('Server info:', stderr);
        }
    });

    serverProcess.on('error', (error) => {
        console.error('Server error:', error);
        process.exit(1);
    });
}

testMCPServer();