import multer from "multer";
import storage from "../functions/storageProvider";

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype) {
            return cb(null, true);
        } else {
            cb(new Error("Arquivo deve ser uma imagem ou PDF"));
        }
    }
});

const uploadComprovante = upload.single('comprovante');

export default uploadComprovante;