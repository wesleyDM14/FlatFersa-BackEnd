import { QrCodePix, QrCodePixParams } from "qrcode-pix";

export async function generateQrCodePix(data: QrCodePixParams) {
    try {
        const qrCodePix = QrCodePix({
            version: data.version,
            key: data.key,
            name: data.name,
            city: data.city,
            transactionId: data.transactionId,
            message: data.message,
            value: data.value,
            cep: data.cep,
            currency: data.currency,
            countryCode: data.countryCode,
        });

        let payload = qrCodePix.payload();
        let image = await qrCodePix.base64();

        return { payload: payload, base64: image };
    } catch (error) {
        console.error('Erro ao gerar codigo PIX: ' + error.message);
        throw new Error('Erro ao gerar codigo PIX: ' + error.message);
    }
}