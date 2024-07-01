import multer from "multer";
import storage from "../functions/storageProvider";

const upload = multer({ storage });

const uploadContratoAssinado = upload.single('contratoAssinado');

export default uploadContratoAssinado;