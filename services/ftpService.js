// src/services/ftpService.js
const ftp = require('basic-ftp');

const ftpHost = process.env.FTP_HOST;
const ftpUser = process.env.FTP_USER;
const ftpPass = process.env.FTP_PASS;
const ftpDir  = process.env.FTP_DIR;

async function uploadToFtp(rutaLocal, nombreRemoto, accion, idEvento) {
  const client = new ftp.Client();

  try {
    await client.access({
      host: ftpHost,
      user: ftpUser,
      password: ftpPass,
    });

    if (accion === 'PDF') {
      await client.cd(`${ftpDir}boletos/evento_${idEvento}`);
    } else if (accion === 'IMG') {
      await client.cd(`${ftpDir}img`);
    }

    await client.uploadFrom(rutaLocal, nombreRemoto);
    console.log(`📤 Archivo ${nombreRemoto} subido al FTP`);
  } catch (error) {
    console.error('❌ Error FTP:', error);
    throw error;
  } finally {
    client.close();
  }
}

module.exports = { uploadToFtp };
