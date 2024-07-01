import multer from 'multer';
import storage from '../functions/storageProvider';

const upload = multer({ storage });

const uploadFieldsClient = upload.fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack', maxCount: 1 }
]);

export default uploadFieldsClient;