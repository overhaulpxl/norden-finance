const fs = require('fs');
const path = require('path');

const oldPath = path.resolve(__dirname, '../app/admin');
const newPath = path.resolve(__dirname, '../app/norden-control-center');

if (fs.existsSync(oldPath)) {
  fs.renameSync(oldPath, newPath);
  console.log('✅ Folder app/admin berhasil diubah nama menjadi app/norden-control-center!');
} else {
  console.log('❌ Folder app/admin tidak ditemukan atau sudah diubah namanya.');
}
