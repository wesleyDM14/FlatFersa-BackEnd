import { notifyAdminPrestacao, notifyClientPrestacao } from "./checkUpdatesAndReminders";
import { verificaApartamentoStatus } from "./verificaApartamento";
import { verificaContratos } from "./verificaContratos";
import { aplicarMulta, verificaPrestacoesEmAtraso } from "./verificaPrestacaoService";

if (require.main === module) {
    (async () => {
        await notifyAdminPrestacao();
        await notifyClientPrestacao();
        await verificaContratos();
        await verificaPrestacoesEmAtraso();
        await aplicarMulta();
        await verificaApartamentoStatus();
        process.exit(0);
    })().catch(err => {
        console.error('Error ao executar o script: ', err);
        process.exit(1);
    });
}