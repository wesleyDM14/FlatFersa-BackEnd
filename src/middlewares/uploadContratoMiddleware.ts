import multer from "multer";
import storage from "../functions/storageProvider";

const upload = multer({ storage });

const uploadContratoAssinado = upload.single('contrato');

export default uploadContratoAssinado;