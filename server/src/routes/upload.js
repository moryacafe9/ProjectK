const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const unzipper = require('unzipper');
const { detectFormsInDirectoryAsync } = require('../utils/formDetector');
const { connectAuto, getDbKind } = require('../db/auto');
const mysqlModel = require('../models/mysql');
const mongoModel = require('../models/mongo');

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) cb(null, true);
    else cb(new Error('Only .zip files allowed'));
  }
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const zipPath = req.file.path;
    const extractDir = path.join(uploadDir, path.basename(zipPath, '.zip'));
    await fs.promises.mkdir(extractDir, { recursive: true });
    await new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .on('close', resolve)
        .on('error', reject);
    });
    fs.unlink(zipPath, () => {});

    const forms = await detectFormsInDirectoryAsync(extractDir);
    await connectAuto(forms.length ? forms : [{ type: 'login' }]);

    // Ensure schemas based on forms
    const kind = getDbKind();
    if (kind === 'mysql') {
      await mysqlModel.ensureUserTable();
      if (forms.some(f => f.type === 'contact')) await mysqlModel.ensureContactTable();
    } else {
      await mongoModel.ensureIndexes();
    }

    const dbUrl = kind === 'mysql'
      ? `mysql://${process.env.MYSQL_USER || 'root'}@${process.env.MYSQL_HOST || 'localhost'}:${process.env.MYSQL_PORT || 3306}/${process.env.MYSQL_DATABASE || 'classico'}`
      : (process.env.MONGO_URI || 'mongodb://localhost:27017/classico');

    res.json({ ok: true, detected_forms: forms, db_kind: kind, db_url: dbUrl });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

