const fs = require('fs');
const files = [
    'resources/js/frontend/components/seller-workspace.jsx',
    'resources/js/frontend/components/Sidebar.jsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Remove hard shadows
    content = content.replace(/shadow-\[\d+px_\d+px_0_#[a-fA-F0-9]+\]/g, 'shadow-sm');

    // Change borders
    content = content.replace(/border-2 border-neutral-950/g, 'border border-neutral-200');
    content = content.replace(/border-b-2 border-neutral-950/g, 'border-b border-neutral-200');
    content = content.replace(/border-t-2 border-neutral-950/g, 'border-t border-neutral-200');
    content = content.replace(/border-l-2 border-neutral-950/g, 'border-l border-neutral-200');
    content = content.replace(/border-r-2 border-neutral-950/g, 'border-r border-neutral-200');
    
    // Other border-2s
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
    
    // Convert bg-neutral-50 to bg-white for a cleaner look, but keep the outer shell slightly off-white if needed.
    // The user said "reduce catchie UI color", bg-neutral-50 is already grey, but let's replace it in cards.
    // I'll just change the pills and colored text.
    
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

console.log('Done replacing theme!');
