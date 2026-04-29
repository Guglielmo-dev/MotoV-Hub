const fs = require('fs');
const path = require('path');

const sourceDir = 'C:\\Users\\gugli\\.gemini\\antigravity\\brain\\8222622b-6f85-4e8f-8aa2-34087d69ef5a';
const targetDir = path.join(__dirname, 'client', 'public', 'images');

const filesToCopy = [
  { src: 'welcome_hero_1777498300450.png', dest: 'welcome_hero.png' },
  { src: 'book_cover_1777498319404.png', dest: 'book_cover.png' }
];

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

filesToCopy.forEach(file => {
  const srcPath = path.join(sourceDir, file.src);
  const destPath = path.join(targetDir, file.dest);
  
  try {
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Successo: ${file.dest} creato correttamente!`);
    } else {
      console.error(`❌ Errore: File sorgente non trovato: ${file.src}`);
    }
  } catch (err) {
    console.error(`❌ Errore durante la copia di ${file.dest}:`, err.message);
  }
});
