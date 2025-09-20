importScripts('https://unpkg.com/compromise');

// Listen for messages from main thread
self.onmessage = async function(e) {
  const corpusData = e.data;
  const log = msg => self.postMessage({ type: 'log', msg });
  
  log('Starting corpus analysis...');
  
  const sentences = corpusData.split(/(?<=[.!?])\s+/);
  const wordFreq = {};
  const patterns = {};
  
  const chunkSize = 50; // process 50 sentences per batch
  for (let i = 0; i < sentences.length; i += chunkSize) {
    const chunk = sentences.slice(i, i + chunkSize);
    chunk.forEach(sentence => {
      const words = sentence.match(/\b[\w']+\b/g) || [];
      words.forEach(w => {
        const word = w.toLowerCase();
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
      
      const doc = nlp(sentence);
      const posPattern = doc.out('tags').map(t => Object.keys(t)[0]).join(' ');
      patterns[posPattern] = (patterns[posPattern] || 0) + 1;
    });
    
    // Yield control to keep worker responsive
    await new Promise(res => setTimeout(res, 0));
    log(`Processed ${Math.min(i + chunkSize, sentences.length)} / ${sentences.length} sentences...`);
  }
  
  const importantWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(e => e[0]);
  
  const commonPatterns = Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(e => e[0]);
  
  log('Corpus analysis complete.');
  
  self.postMessage({ type: 'done', importantWords, commonPatterns });
};