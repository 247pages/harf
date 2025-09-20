let corpusData = '';
let heuristics = {
    importantWords: [],
    commonPatterns: []
};

const logsDiv = document.getElementById('logs');
const outputDiv = document.getElementById('output');

// Log utility
function log(msg) {
    const p = document.createElement('div');
    p.textContent = msg;
    logsDiv.appendChild(p);
    logsDiv.scrollTop = logsDiv.scrollHeight;
}

// Load corpus dynamically
async function loadCorpus() {
    const category = 'literature';
    const files = [
        'Frankenstein.js',
        'MobyDick.js',
        'PrideAndPrejudice.js',
        'TheAdventuresOfSherlockHolmes.js',
        'WarAndPeace.js'
    ];

    for (let f of files) {
        try {
            log(`Loading ${f}...`);
            const module = await import(`./corpus/${category}/${f}`);
            const varName = f.replace('.js', '');
            corpusData += module[varName] + '\n';
            log(`${f} loaded.`);
        } catch(e) {
            log(`Failed to load ${f}: ${e}`);
        }
    }

    // Start Web Worker for analysis
    log('Starting corpus analysis in worker...');
    const worker = new Worker('worker.js');
    worker.postMessage(corpusData);

    worker.onmessage = function(e) {
        if (e.data.type === 'log') {
            log(e.data.msg);
        } else if (e.data.type === 'done') {
            heuristics = {
                importantWords: e.data.importantWords,
                commonPatterns: e.data.commonPatterns
            };
            log('Heuristics loaded. Ready for shrinking or generating text.');
        }
    };
}

// Tokenizers
function tokenizeSentences(text) { return text.split(/(?<=[.!?])\s+/); }
function tokenizeWords(sentence) { return sentence.match(/\b[\w']+\b/g) || []; }

// Shrink input
function shrinkText(input) {
    const sentences = tokenizeSentences(input);
    const scored = sentences.map(s => {
        const words = tokenizeWords(s);
        let score = 0;
        words.forEach(w => {
            if (heuristics.importantWords.includes(w.toLowerCase())) score++;
        });
        return { sentence: s, score };
    });
    const topN = Math.ceil(scored.length * 0.3);
    return scored.sort((a,b) => b.score - a.score).slice(0, topN).map(s => s.sentence).join(' ');
}

// Generate new text
function generateText(length = 3) {
    const patterns = heuristics.commonPatterns;
    const words = heuristics.importantWords;
    const generated = [];

    for (let i=0; i<length; i++){
        const pattern = patterns[Math.floor(Math.random()*patterns.length)].split(' ');
        const sentence = pattern.map(t => words[Math.floor(Math.random()*words.length)] || 'word').join(' ');
        generated.push(sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.');
    }
    return generated.join(' ');
}

// Button handlers
function shrinkInput() {
    log('Shrinking input...');
    const input = document.getElementById('inputText').value;
    const output = shrinkText(input);
    outputDiv.innerText = output;
    log('Shrink complete.');
}

function generateTextOutput() {
    log('Generating text...');
    const output = generateText(5);
    outputDiv.innerText = output;
    log('Generation complete.');
}

// Initialize
loadCorpus();