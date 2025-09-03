// Test to manually parse the Python bridge response that's failing
import fs from 'fs';

const rawPythonResponse = `{"success": true, "data": {"xml": "<?xml version='1.0' encoding='UTF-8'?>\\n<hierarchy rotation=\\"0\\">\\n  <node index=\\"0\\" text=\\"\\" resource-id=\\"\\" class=\\"android.widget.FrameLayout\\" package=\\"com.android.systemui\\" content-desc=\\"\\" checkable=\\"false\\" checked=\\"false\\" clickable=\\"false\\" enabled=\\"true\\" focusable=\\"false\\" focused=\\"false\\" scrollable=\\"false\\" long-clickable=\\"false\\" password=\\"false\\" selected=\\"false\\" visible-to-user=\\"true\\" bounds=\\"[0,0][1080,72]\\" drawing-order=\\"0\\" hint=\\"\\">\\n    <node index=\\"0\\" text=\\"\\" resource-id=\\"com.android.systemui:id/scrim_in_front\\" class=\\"android.view.View\\" package=\\"com.android.systemui\\" content-desc=\\"\\" checkable=\\"false\\" checked=\\"false\\" clickable=\\"false\\" enabled=\\"true\\" focusable=\\"true\\" focused=\\"false\\" scrollable=\\"false\\" long-clickable=\\"false\\" password=\\"false\\" selected=\\"false\\" visible-to-user=\\"true\\" bounds=\\"[0,0][1080,72]\\" drawing-order=\\"7\\" hint=\\"\\"/>\\n    <node index=\\"1\\" text=\\"\\" resource-id=\\"com.android.systemui:id/scrim_behind\\" class=\\"android.view.View\\" package=\\"com.android.systemui\\" content-desc=\\"\\" checkable=\\"false\\" checked=\\"false\\" clickable=\\"false\\" enabled=\\"true\\" focusable=\\"true\\" focused=\\"false\\" scrollable=\\"false\\" long-clickable=\\"false\\" password=\\"false\\" selected=\\"false\\" visible-to-user=\\"true\\" bounds=\\"[0,0][1080,72]\\" drawing-order=\\"2\\" hint=\\"\\"/>\\n    <node index=\\"2\\" text=\\"\\" resource-id=\\"com.android.systemui:id/status_bar_container\\" class=\\"android.widget.FrameLayout\\" package=\\"com.android.systemui\\" content-desc=\\"\\" checkable=\\"false\\" checked=\\"false\\" clickable=\\"false\\" enabled=\\"true\\" focusable=\\"false\\" focused=\\"false\\" scrollable=\\"false\\" long-clickable=\\"false\\" password=\\"false\\" selected=\\"false\\" visible-to-user=\\"true\\" bounds=\\"[0,0][1080,72]\\" drawing-order=\\"3\\" hint=\\"\\">\\n      <node index=\\"0\\" text=\\"\\" resource-id=\\"com.android.systemui:id/status_bar\\" class=\\"android.widget.FrameLayout\\" package=\\"com.android.systemui\\" content-desc=\\"\\" checkable=\\"false\\" checked=\\"false\\" clickable=\\"false\\" enabled=\\"true\\" focusable=\\"false\\" focused=\\"false\\" scrollable=\\"false\\" long-clickable=\\"false\\" password=\\"false\\" selected=\\"false\\" visible-to-user=\\"true\\" bounds=\\"[0,0][1080,72]\\" drawing-order=\\"1\\" hint=\\"\\">\\n        <node index=\\"0\\" text=\\"\\" resource-id=\\"com.android.systemui:id/status_bar_contents\\" class=\\"android.widget.LinearLayout\\" package=\\"com.android.systemui\\" content-desc=\\"\\" checkable=\\"false\\" checked=\\"false\\" clickable=\\"false\\" enabled=\\"true\\" focusable=\\"false\\" focused=\\"false\\" scrollable=\\"false\\" long-clickable=\\"false\\" password=\\"false\\" selected=\\"false\\" visible-to-user=\\"true\\" bounds=\\"[0,0][1080,72]\\" drawing-order=\\"2\\" hint=\\"\\">\\n          <node index=\\"0\\" text=\\"\\" resource-id=\\"\\" class=\\"android.widget.FrameLayout\\" package=\\"com.android.systemui\\" content-desc=\\"\\" checkable=\\"false\\" checked=\\"false\\" clickable=\\"false\\" enabled=\\"true\\" focusable=\\"false\\" focused=\\"false\\" scrollable=\\"false\\" long-clickable=\\"false\\" password=\\"false\\" selected=\\"false\\" visible-to-user=\\"true\\" bounds=\\"[18,0][540,72]\\" drawing-order=\\"2\\" hint=\\"\\">\\n            <node index=\\"0\\" text=\\"\\" resource-id=\\"com.android.systemui:id/status_bar_left_side\\" class=\\"android.widget.LinearLayout\\" package=\\"com.android.systemui\\" content-desc=\\"\\" checkable=\\"false\\" checked=\\"false\\" clickable=\\"false\\" enabled=\\"true\\" focusable=\\"false\\" focused=\\"false\\" scrollable=\\"false\\" long-clickable=\\"false\\" password=\\"false\\" selected=\\"false\\" visible-to-user=\\"true\\" bounds=\\"[18,0][540,72]\\" drawing-order=\\"2\\" hint=\\"\\">\\n              <node index=\\"0\\" text=\\"10:46\\" resource-id=\\"com.android.systemui:id/clock\\" class=\\"android.widget.TextView\\" package=\\"com.android.systemui\\" content-desc=\\"10:46 PM\\" checkable=\\"false\\" checked=\\"false\\" clickable=\\"false\\" enabled=\\"true\\" focusable=\\"false\\" focused=\\"false\\" scrollable=\\"false\\" long-clickable=\\"false\\" password=\\"false\\" selected=\\"false\\" visible-to-user=\\"true\\" bounds=\\"[18,0][146,72]\\" drawing-order=\\"1\\" hint=\\"\\"/>\\n              <node index=\\"1\\" text=\\"\\" resource-id=\\"com.android.systemui:id/notification_icon_area\\" class=\\"android.widget.FrameLayout\\" package=\\"com.android.systemui\\" content-desc=\\"\\" checkable=\\"false\\" checked=\\"false\\" clickable=\\"false\\" enabled=\\"true\\" focusable=\\"false\\" focused=\\"false\\" scrollable=\\"false\\" long-clickable=\\"false\\" password=\\"false\\" selected=\\"false\\" visible-to-user=\\"true\\" bounds=\\"[146,0][540,72]\\" drawing-order=\\"2\\" hint=\\"\\">\\n                <node"}}`;

console.log('🧪 Testing Python response parsing...');

try {
  console.log('Raw response length:', rawPythonResponse.length);
  console.log('Raw response preview:', rawPythonResponse.substring(0, 200));
  
  // Try to parse the JSON
  const parsed = JSON.parse(rawPythonResponse);
  console.log('✅ JSON parsing successful!');
  console.log('Response structure:', {
    success: parsed.success,
    hasData: !!parsed.data,
    hasXml: !!parsed.data?.xml,
    xmlLength: parsed.data?.xml?.length
  });
  
  if (parsed.data?.xml) {
    const xml = parsed.data.xml;
    console.log('\\n📄 XML content analysis:');
    console.log('XML length:', xml.length);
    console.log('Has hierarchy tag:', xml.includes('<hierarchy'));
    console.log('Has node tags:', xml.includes('<node'));
    
    // Count nodes
    const nodeMatches = xml.match(/<node[^>]*>/g) || [];
    console.log('Node count:', nodeMatches.length);
    
    // Look for text elements
    const textMatches = xml.match(/text="([^"]+)"/g) || [];
    console.log('Text elements found:', textMatches.length);
    console.log('Text samples:', textMatches.slice(0, 5));
    
    // Look for resource IDs
    const resourceMatches = xml.match(/resource-id="([^"]+)"/g) || [];
    console.log('Resource ID elements found:', resourceMatches.length);
    console.log('Resource ID samples:', resourceMatches.slice(0, 5));
    
    // Save the XML for analysis
    fs.writeFileSync('python_bridge_xml_dump.xml', xml);
    console.log('✅ Saved XML to python_bridge_xml_dump.xml');
    
    // Save the complete parsed response
    fs.writeFileSync('python_bridge_response.json', JSON.stringify(parsed, null, 2));
    console.log('✅ Saved parsed response to python_bridge_response.json');
  }
  
} catch (error) {
  console.error('❌ Failed to parse Python response:', error);
  console.error('Error details:', error.message);
}