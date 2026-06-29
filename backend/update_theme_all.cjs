const fs = require('fs');
const path = require('path');

const directories = [
    'resources/js/frontend/pages',
    'resources/js/frontend/components'
];

let filesToProcess = [];

directories.forEach(dir => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        if (file.startsWith('Seller') && file.endsWith('.jsx')) {
            filesToProcess.push(path.join(dir, file));
        }
    });
});

// Also include specific components
['resources/js/frontend/components/seller-workspace.jsx', 'resources/js/frontend/components/Sidebar.jsx'].forEach(file => {
    if (!filesToProcess.includes(file)) {
        filesToProcess.push(file);
    }
});

// Also include all *Drawer.jsx components which are seller-side
const componentsDir = 'resources/js/frontend/components';
const componentsFiles = fs.readdirSync(componentsDir).filter(f => f.endsWith('Drawer.jsx'));
componentsFiles.forEach(file => {
    const fullPath = path.join(componentsDir, file);
    if (!filesToProcess.includes(fullPath)) {
        filesToProcess.push(fullPath);
    }
});

filesToProcess.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Remove hard shadows
    content = content.replace(/shadow-\[\d+px_\d+px_0_#[a-fA-F0-9]+\]/g, 'shadow-sm');

    // Change borders
    content = content.replace(/border-2 border-neutral-950/g, 'border border-neutral-200');
    content = content.replace(/border-b-2 border-neutral-950/g, 'border-b border-neutral-200');
    content = content.replace(/border-t-2 border-neutral-950/g, 'border-t border-neutral-200');
    content = content.replace(/border-l-2 border-neutral-950/g, 'border-l border-neutral-200');
    content = content.replace(/border-r-2 border-neutral-950/g, 'border-r border-neutral-200');
    
    // Other border-2s (replace with border-1)
    content = content.replace(/border-2 /g, 'border ');
    content = content.replace(/border-b-2 /g, 'border-b ');
    content = content.replace(/border-t-2 /g, 'border-t ');
    content = content.replace(/border-l-2 /g, 'border-l ');
    content = content.replace(/border-r-2 /g, 'border-r ');
    
    // Specific color replacements for minimal theme
    content = content.replace(/bg-emerald-50/g, 'bg-white');
    content = content.replace(/bg-sky-50/g, 'bg-white');
    content = content.replace(/bg-violet-50/g, 'bg-white');
    content = content.replace(/bg-amber-50/g, 'bg-white');
    content = content.replace(/bg-rose-50/g, 'bg-white');
    
    // Make pills minimal
    content = content.replace(/border-emerald-200 bg-white text-emerald-700/g, 'border-neutral-200 bg-white text-neutral-700');
    content = content.replace(/border-amber-200 bg-white text-amber-700/g, 'border-neutral-200 bg-white text-neutral-700');
    content = content.replace(/border-rose-200 bg-white text-rose-700/g, 'border-neutral-200 bg-white text-neutral-700');
    content = content.replace(/border-sky-200 bg-white text-sky-700/g, 'border-neutral-200 bg-white text-neutral-700');
    content = content.replace(/border-neutral-950 bg-white text-neutral-700/g, 'border-neutral-200 bg-white text-neutral-700');

    // Remove hover colors that stand out
    content = content.replace(/hover:bg-rose-100/g, 'hover:bg-neutral-100');
    content = content.replace(/hover:bg-rose-50/g, 'hover:bg-neutral-50');

    fs.writeFileSync(file, content);
});

console.log('Processed ' + filesToProcess.length + ' files.');
