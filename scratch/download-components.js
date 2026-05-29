const fs = require('fs');
const path = require('path');

const components = [
  { url: 'https://cult-ui.com/r/intro-disclosure.json', name: 'intro-disclosure.tsx' },
  { url: 'https://cult-ui.com/r/onboarding.json', name: 'onboarding.tsx' },
  { url: 'https://cult-ui.com/r/shift-card.json', name: 'shift-card.tsx' },
  { url: 'https://cult-ui.com/r/expandable.json', name: 'expandable.tsx' },
  { url: 'https://cult-ui.com/r/expandable-screen.json', name: 'expandable-screen.tsx' },
  { url: 'https://cult-ui.com/r/terminal-animation.json', name: 'terminal-animation.tsx' },
  { url: 'https://cult-ui.com/r/sortable-list.json', name: 'sortable-list.tsx' }
];

const targetDir = path.join(__dirname, '../src/components/ui');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function run() {
  for (const comp of components) {
    try {
      console.log(`Fetching ${comp.url}...`);
      const response = await fetch(comp.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const registryItem = await response.json();
      
      if (!registryItem.files || registryItem.files.length === 0) {
        console.error(`No files in registry item for ${comp.name}`);
        continue;
      }
      
      for (const file of registryItem.files) {
        let content = file.content;
        
        // Replace framer-motion imports with motion/react
        content = content.replace(/['"]framer-motion['"]/g, "'motion/react'");
        
        const destPath = path.join(targetDir, comp.name);
        fs.writeFileSync(destPath, content, 'utf8');
        console.log(`Saved to ${destPath}`);
      }
    } catch (err) {
      console.error(`Failed to download ${comp.name}:`, err.message);
    }
  }
}

run();
