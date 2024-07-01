import multer from "multer";
import storage from "../functions/storageProvider";

const upload = multer({ storage });

const uploadComprovante = upload.single('comprovante');

export default uploadComprovante;