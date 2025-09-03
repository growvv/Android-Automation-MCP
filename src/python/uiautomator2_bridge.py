#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
uiautomator2 Python Bridge for Node.js
Provides a comprehensive JSON-based interface to control uiautomator2 functions
"""

import json
import sys
import traceback
import base64
import uiautomator2 as u2
from typing import Dict, Any, Optional


class UIAutomator2Bridge:
    def __init__(self, device_serial: Optional[str] = None):
        """Initialize the bridge with optional device serial"""
        try:
            self.device = u2.connect(device_serial) if device_serial else u2.connect()
            # Set reasonable wait timeouts to reduce delays between operations
            self.device.implicitly_wait(5.0)  # Reduced from default 20s to 5s
            self.device.settings['wait_timeout'] = 5.0
            self.connected = True
        except Exception as e:
            self.device = None
            self.connected = False
            self.error = str(e)

    def get_device_info(self) -> Dict[str, Any]:
        """Get device information"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            info = self.device.info
            device_info = self.device.device_info
            return {
                "success": True,
                "data": {
                    "displayWidth": info.get("displayWidth", 0),
                    "displayHeight": info.get("displayHeight", 0),
                    "currentPackageName": info.get("currentPackageName", ""),
                    "productName": info.get("productName", ""),
                    "brand": device_info.get("brand", ""),
                    "model": device_info.get("model", ""),
                    "sdkInt": info.get("sdkInt", 0),
                    "screenOn": info.get("screenOn", True),
                    "serial": device_info.get("serial", ""),
                    "version": device_info.get("version", ""),
                    "wlanIp": self.device.wlan_ip
                }
            }
        except Exception as e:
            return {"error": str(e)}

    def get_window_size(self) -> Dict[str, Any]:
        """Get window size"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            width, height = self.device.window_size()
            return {
                "success": True,
                "data": {
                    "width": width,
                    "height": height
                }
            }
        except Exception as e:
            return {"error": str(e)}

    def get_current_app(self) -> Dict[str, Any]:
        """Get current app info"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            app_info = self.device.app_current()
            return {
                "success": True,
                "data": app_info
            }
        except Exception as e:
            return {"error": str(e)}

    def tap(self, x: int, y: int) -> Dict[str, Any]:
        """Tap at coordinates"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            self.device.click(x, y)
            return {"success": True, "message": f"Tapped at ({x}, {y})"}
        except Exception as e:
            return {"error": str(e)}

    def double_tap(self, x: int, y: int, duration: float = 0.1) -> Dict[str, Any]:
        """Double tap at coordinates"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            self.device.double_click(x, y, duration)
            return {"success": True, "message": f"Double tapped at ({x}, {y})"}
        except Exception as e:
            return {"error": str(e)}

    def long_tap(self, x: int, y: int, duration: float = 0.5) -> Dict[str, Any]:
        """Long tap at coordinates"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            self.device.long_click(x, y, duration)
            return {"success": True, "message": f"Long tapped at ({x}, {y})"}
        except Exception as e:
            return {"error": str(e)}

    def input_text(self, text: str, clear: bool = False) -> Dict[str, Any]:
        """Input text using uiautomator2 send_keys"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            self.device.send_keys(text, clear=clear)
            return {"success": True, "message": f"Input text: {text}"}
        except Exception as e:
            return {"error": str(e)}

    def clear_text(self) -> Dict[str, Any]:
        """Clear text in current input field"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            self.device.clear_text()
            return {"success": True, "message": "Text cleared"}
        except Exception as e:
            return {"error": str(e)}

    def find_element(self, **kwargs) -> Dict[str, Any]:
        """Find element using various selectors"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            # Build selector
            selector_args = {}
            if "text" in kwargs:
                selector_args["text"] = kwargs["text"]
            if "textContains" in kwargs:
                selector_args["textContains"] = kwargs["textContains"]
            if "textMatches" in kwargs:
                selector_args["textMatches"] = kwargs["textMatches"]
            if "textStartsWith" in kwargs:
                selector_args["textStartsWith"] = kwargs["textStartsWith"]
            if "description" in kwargs:
                selector_args["description"] = kwargs["description"]
            if "descriptionContains" in kwargs:
                selector_args["descriptionContains"] = kwargs["descriptionContains"]
            if "resourceId" in kwargs:
                selector_args["resourceId"] = kwargs["resourceId"]
            if "className" in kwargs:
                selector_args["className"] = kwargs["className"]
            if "packageName" in kwargs:
                selector_args["packageName"] = kwargs["packageName"]
            if "clickable" in kwargs:
                selector_args["clickable"] = kwargs["clickable"]
            if "enabled" in kwargs:
                selector_args["enabled"] = kwargs["enabled"]
            if "focusable" in kwargs:
                selector_args["focusable"] = kwargs["focusable"]
            if "scrollable" in kwargs:
                selector_args["scrollable"] = kwargs["scrollable"]
            if "checkable" in kwargs:
                selector_args["checkable"] = kwargs["checkable"]
            if "checked" in kwargs:
                selector_args["checked"] = kwargs["checked"]
            if "selected" in kwargs:
                selector_args["selected"] = kwargs["selected"]
            if "index" in kwargs:
                selector_args["index"] = kwargs["index"]
            if "instance" in kwargs:
                selector_args["instance"] = kwargs["instance"]
            
            element = self.device(**selector_args)
            
            if element.exists:
                info = element.info
                bounds = info.get("bounds", {})
                # Convert bounds from object format to array format [x1, y1, x2, y2] to save tokens
                if isinstance(bounds, dict) and "left" in bounds:
                    bounds_array = [
                        bounds.get("left", 0),
                        bounds.get("top", 0), 
                        bounds.get("right", 0),
                        bounds.get("bottom", 0)
                    ]
                else:
                    bounds_array = [0, 0, 0, 0]
                
                return {
                    "success": True,
                    "found": True,
                    "element": {
                        "text": info.get("text", ""),
                        "description": info.get("contentDescription", ""),
                        "resourceId": info.get("resourceName", ""),
                        "className": info.get("className", ""),
                        "packageName": info.get("packageName", ""),
                        "bounds": bounds_array,
                        "clickable": info.get("clickable", False),
                        "enabled": info.get("enabled", True),
                        "focusable": info.get("focusable", False),
                        "focused": info.get("focused", False),
                        "scrollable": info.get("scrollable", False),
                        "selected": info.get("selected", False),
                        "checkable": info.get("checkable", False),
                        "checked": info.get("checked", False)
                    }
                }
            else:
                return {"success": True, "found": False}
                
        except Exception as e:
            return {"error": str(e)}

    def element_click(self, timeout: float = 10.0, **kwargs) -> Dict[str, Any]:
        """Click element using selectors"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            element = self.device(**kwargs)
            element.click(timeout=timeout)
            return {"success": True, "message": f"Clicked element with selector: {kwargs}"}
        except Exception as e:
            return {"error": str(e)}

    def element_long_click(self, duration: float = 0.5, **kwargs) -> Dict[str, Any]:
        """Long click element using selectors"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            element = self.device(**kwargs)
            element.long_click(duration=duration)
            return {"success": True, "message": f"Long clicked element with selector: {kwargs}"}
        except Exception as e:
            return {"error": str(e)}

    def get_screen_dump(self) -> Dict[str, Any]:
        """Get screen UI hierarchy using dump_hierarchy"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            # Use dump_hierarchy instead of deprecated methods
            xml = self.device.dump_hierarchy(compressed=False, pretty=True)
            info = self.device.info
            
            return {
                "success": True,
                "data": {
                    "xml": xml,
                    "displayWidth": info.get("displayWidth", 0),
                    "displayHeight": info.get("displayHeight", 0),
                    "currentPackageName": info.get("currentPackageName", "")
                }
            }
        except Exception as e:
            return {"error": str(e)}

    def take_screenshot(self, filename: Optional[str] = None, format: str = "pillow") -> Dict[str, Any]:
        """Take screenshot using d.screenshot()"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            if filename:
                # Save to file
                self.device.screenshot(filename)
                return {"success": True, "message": f"Screenshot saved to {filename}"}
            else:
                # Return base64 encoded image data
                if format == "raw":
                    image_data = self.device.screenshot(format='raw')
                    image_base64 = base64.b64encode(image_data).decode('utf-8')
                    return {
                        "success": True, 
                        "data": {
                            "format": "jpeg",
                            "image": image_base64
                        }
                    }
                elif format == "pillow":
                    import io
                    image = self.device.screenshot(format='pillow')
                    buffer = io.BytesIO()
                    image.save(buffer, format='PNG')
                    image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    return {
                        "success": True,
                        "data": {
                            "format": "png", 
                            "image": image_base64
                        }
                    }
                else:
                    return {"error": f"Unsupported format: {format}"}
                    
        except Exception as e:
            return {"error": str(e)}

    def open_app(self, package_name: str, stop: bool = False, use_monkey: bool = False, activity: Optional[str] = None) -> Dict[str, Any]:
        """Open app by package name using app_start"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            if activity:
                self.device.app_start(package_name, activity, stop=stop, use_monkey=use_monkey)
            else:
                self.device.app_start(package_name, stop=stop, use_monkey=use_monkey)
            return {"success": True, "message": f"Opened app: {package_name}"}
        except Exception as e:
            return {"error": str(e)}

    def xpath_operation(self, xpath: str, action: str = "click", text: Optional[str] = None) -> Dict[str, Any]:
        """Perform operation on element using XPath"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            element = self.device.xpath(xpath)
            
            if action == "click":
                element.click()
                return {"success": True, "message": f"Clicked element with xpath: {xpath}"}
            elif action == "input_text":
                if text is None:
                    return {"error": "Text parameter required for input_text action"}
                element.click()  # Focus the element first
                element.set_text(text)
                return {"success": True, "message": f"Input text '{text}' to element with xpath: {xpath}"}
            elif action == "get_text":
                result_text = element.text
                return {"success": True, "data": {"text": result_text}}
            elif action == "get_attribute":
                attrs = element.info
                return {"success": True, "data": {"attributes": attrs}}
            else:
                return {"error": f"Unsupported action: {action}"}
                
        except Exception as e:
            return {"error": f"XPath operation failed: {str(e)}"}

    def stop_app(self, package_name: str) -> Dict[str, Any]:
        """Stop app using app_stop"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            self.device.app_stop(package_name)
            return {"success": True, "message": f"Stopped app: {package_name}"}
        except Exception as e:
            return {"error": str(e)}

    def press_key(self, key: str) -> Dict[str, Any]:
        """Press key using press()"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            self.device.press(key)
            return {"success": True, "message": f"Pressed key: {key}"}
        except Exception as e:
            return {"error": str(e)}

    def swipe(self, fx: int, fy: int, tx: int, ty: int, duration: float = 0.5) -> Dict[str, Any]:
        """Swipe from one point to another"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            self.device.swipe(fx, fy, tx, ty, duration)
            return {"success": True, "message": f"Swiped from ({fx}, {fy}) to ({tx}, {ty})"}
        except Exception as e:
            return {"error": str(e)}

    def swipe_ext(self, direction: str, scale: float = 0.9, box: Optional[tuple] = None) -> Dict[str, Any]:
        """Extended swipe functionality"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            if box:
                self.device.swipe_ext(direction, scale=scale, box=box)
            else:
                self.device.swipe_ext(direction, scale=scale)
            return {"success": True, "message": f"Swiped {direction}"}
        except Exception as e:
            return {"error": str(e)}

    def drag(self, sx: int, sy: int, ex: int, ey: int, duration: float = 0.5) -> Dict[str, Any]:
        """Drag from one point to another"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            self.device.drag(sx, sy, ex, ey, duration)
            return {"success": True, "message": f"Dragged from ({sx}, {sy}) to ({ex}, {ey})"}
        except Exception as e:
            return {"error": str(e)}

    def screen_on(self) -> Dict[str, Any]:
        """Turn on screen"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            self.device.screen_on()
            return {"success": True, "message": "Screen turned on"}
        except Exception as e:
            return {"error": str(e)}

    def screen_off(self) -> Dict[str, Any]:
        """Turn off screen"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            self.device.screen_off()
            return {"success": True, "message": "Screen turned off"}
        except Exception as e:
            return {"error": str(e)}

    def unlock(self) -> Dict[str, Any]:
        """Unlock device"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            self.device.unlock()
            return {"success": True, "message": "Device unlocked"}
        except Exception as e:
            return {"error": str(e)}

    def get_installed_apps(self) -> Dict[str, Any]:
        """Get list of installed user applications"""
        if not self.connected:
            return {"error": "Device not connected"}
        
        try:
            # Get installed user apps (3rd party apps)
            apps = self.device.app_list_user()
            app_list = []
            
            for package_name in apps:
                # Get app name if possible, fallback to package name
                try:
                    app_info = self.device.app_info(package_name)
                    app_name = app_info.get("app_name", package_name)
                except:
                    app_name = package_name
                
                app_list.append({
                    "packageName": package_name,
                    "appName": app_name
                })
            
            return {
                "success": True,
                "data": {
                    "apps": app_list
                }
            }
        except Exception as e:
            return {"error": str(e)}


def main():
    """Main function to handle JSON commands from stdin"""
    bridge = None
    
    try:
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
                
            try:
                command = json.loads(line)
                action = command.get("action")
                args = command.get("args", {})
                
                # Initialize bridge if needed
                if bridge is None:
                    device_serial = args.get("deviceSerial")
                    bridge = UIAutomator2Bridge(device_serial)
                
                # Execute command
                result = {"error": "Unknown action"}
                
                if action == "get_device_info":
                    result = bridge.get_device_info()
                elif action == "get_window_size":
                    result = bridge.get_window_size()
                elif action == "get_current_app":
                    result = bridge.get_current_app()
                elif action == "tap":
                    result = bridge.tap(args["x"], args["y"])
                elif action == "double_tap":
                    result = bridge.double_tap(args["x"], args["y"], args.get("duration", 0.1))
                elif action == "long_tap":
                    result = bridge.long_tap(args["x"], args["y"], args.get("duration", 0.5))
                elif action == "input_text":
                    result = bridge.input_text(args["text"], args.get("clear", False))
                elif action == "clear_text":
                    result = bridge.clear_text()
                elif action == "find_element":
                    result = bridge.find_element(**args)
                elif action == "element_click":
                    timeout = args.pop("timeout", 10.0)
                    result = bridge.element_click(timeout=timeout, **args)
                elif action == "element_long_click":
                    duration = args.pop("duration", 0.5)
                    result = bridge.element_long_click(duration=duration, **args)
                elif action == "get_screen_dump":
                    result = bridge.get_screen_dump()
                elif action == "take_screenshot":
                    result = bridge.take_screenshot(args.get("filename"), args.get("format", "pillow"))
                elif action == "open_app":
                    result = bridge.open_app(args["packageName"], args.get("stop", False), args.get("useMonkey", False), args.get("activity"))
                elif action == "stop_app":
                    result = bridge.stop_app(args["packageName"])
                elif action == "press_key":
                    result = bridge.press_key(args["key"])
                elif action == "swipe":
                    result = bridge.swipe(args["fx"], args["fy"], args["tx"], args["ty"], args.get("duration", 0.5))
                elif action == "xpath_operation":
                    result = bridge.xpath_operation(args["xpath"], args.get("action", "click"), args.get("text"))
                elif action == "swipe_ext":
                    result = bridge.swipe_ext(args["direction"], args.get("scale", 0.9), args.get("box"))
                elif action == "drag":
                    result = bridge.drag(args["sx"], args["sy"], args["ex"], args["ey"], args.get("duration", 0.5))
                elif action == "screen_on":
                    result = bridge.screen_on()
                elif action == "screen_off":
                    result = bridge.screen_off()
                elif action == "unlock":
                    result = bridge.unlock()
                elif action == "get_installed_apps":
                    result = bridge.get_installed_apps()
                
                # Send result
                print(json.dumps(result), flush=True)
                
            except json.JSONDecodeError as e:
                error_result = {"error": f"Invalid JSON: {str(e)}"}
                print(json.dumps(error_result), flush=True)
            except Exception as e:
                error_result = {"error": f"Command error: {str(e)}", "traceback": traceback.format_exc()}
                print(json.dumps(error_result), flush=True)
                
    except KeyboardInterrupt:
        pass
    except Exception as e:
        error_result = {"error": f"Bridge error: {str(e)}"}
        print(json.dumps(error_result), flush=True)


if __name__ == "__main__":
    main()