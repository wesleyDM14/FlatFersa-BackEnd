import { StatusPagamento } from "@prisma/client";

import prismaClient from "../prisma";
import { generateQrCodePix } from "../functions/generatePix";
import getToken from "../functions/getToken";
import axios from "axios";
import fs from 'fs';
import { verificaPrestacoesEmAtraso } from "../functions/verificaPrestacaoService";

class PrestacaoService {

    async createPrestacao(mesReferencia: number, valor: number, dataVencimento: Date, contratoId: string) {
        try {
            const contractAlreadyExisting = await prismaClient.contrato.findFirst({ where: { id: contratoId } });

            if (!contractAlreadyExisting) {
                throw new Error('Contrato não encontrado na base de dados.');
            }

            const newPrestacao = await prismaClient.prestacaoAluguel.create({
                data: {
                    contractId: contratoId,
                    dataVencimento: dataVencimento,
                    valor: valor,
                    mesReferencia: mesReferencia,
                }
            });

            return newPrestacao;
        } catch (error) {
            throw new Error('Erro ao cadastrar parcela do aluguel: ' + error.message);
        }
    }

    async getAllPrestacoes() {
        const prestacoes = await prismaClient.prestacaoAluguel.findMany({
            orderBy: { dataVencimento: "asc" }
        });
        return prestacoes;
    }

    async getAllPrestacoesWithInfos() {
        const prestacoes = await prismaClient.prestacaoAluguel.findMany({
            orderBy: { dataVencimento: "asc" }
        });

        const response = [];

        for (let index = 0; index < prestacoes.length; index++) {
            const prestacao = prestacoes[index];
            const contract = await prismaClient.contrato.findFirst({ where: { id: prestacao.contractId } });
            const client = await prismaClient.cliente.findFirst({ where: { id: contract.clientId } });
            let aux = { prestacao: prestacao, contrato: contract, cliente: client }
            response.push(aux);
        }

        return response;
    }

    async getPrestacaoById(prestacaoId: string, userId: string, isAdmin: boolean) {

        const prestacao = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

        if (!prestacao) {
            throw new Error('Prestacao nao encontrada no banco de dados.');
        }

        const contractByPrestacaoID = await prismaClient.contrato.findFirst({ where: { id: prestacao.contractId } });

        const userLoggedIn = await prismaClient.user.findFirst({ where: { id: userId } });

        if (contractByPrestacaoID.clientId !== userLoggedIn.clientId && !isAdmin) {
            throw new Error('Sem permissão para acessar a prestação.');
        }

        return prestacao;
    }

    async getPrestacaoByIdWithInfos(prestacaoId: string, userId: string, isAdmin: boolean) {

        const prestacao = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

        if (!prestacao) {
            throw new Error('Prestacao nao encontrada no banco de dados.');
        }

        const contractByPrestacaoID = await prismaClient.contrato.findFirst({ where: { id: prestacao.contractId } });

        const apartmentByContractId = await prismaClient.apartamento.findFirst({ where: { id: contractByPrestacaoID.aptId } });

        const clientByContractId = await prismaClient.cliente.findFirst({ where: { id: contractByPrestacaoID.clientId } });

        const userLoggedIn = await prismaClient.user.findFirst({ where: { id: userId } });

        if (contractByPrestacaoID.clientId !== userLoggedIn.clientId && !isAdmin) {
            throw new Error('Sem permissão para acessar a prestação.');
        }

        let aux = { cliente: clientByContractId, contrato: contractByPrestacaoID, apartamento: apartmentByContractId, prestacao: prestacao };

        return aux;
    }

    async getPrestacoesByContratoId(contratoId: string, userId: string, isAdmin: boolean) {
        const contractAlreadyExisting = await prismaClient.contrato.findFirst({ where: { id: contratoId } });

        if (!contractAlreadyExisting) {
            throw new Error('Contrato não encontrado no Banco de Dados.');
        }

        const userLoggedIn = await prismaClient.user.findFirst({ where: { id: userId } });

        if (contractAlreadyExisting.clientId !== userLoggedIn.clientId && !isAdmin) {
            throw new Error('Você não tem permissão para acessar este contrato.');
        }

        const prestacoes = await prismaClient.prestacaoAluguel.findMany({
            where: { contractId: contratoId },
            orderBy: { dataVencimento: "asc" }
        });

        return prestacoes;
    }

    async getPrestacaoByUserId(userId: string) {
        const userLoggedIn = await prismaClient.user.findFirst({ where: { id: userId } });

        const clientAlreadyExisting = await prismaClient.cliente.findFirst({ where: { id: userLoggedIn.clientId } });

        if (!clientAlreadyExisting) {
            throw new Error('Cliente não encontrado no Banco de Dados.');
        }

        const contracts = await prismaClient.contrato.findMany({ where: { clientId: clientAlreadyExisting.id } });

        let prestacoes = [];

        await Promise.all(
            contracts.map(async (contract) => {
                let prestacaoByContrato = await prismaClient.prestacaoAluguel.findMany({
                    where: { contractId: contract.id },
                    orderBy: { dataVencimento: "asc" }
                });
                prestacoes.push(prestacaoByContrato);
            })
        );

        return prestacoes;
    }

    async getPrestacoesByMounth(mesReferencia: number) {
        const prestacoes = await prismaClient.prestacaoAluguel.findMany({
            where: { mesReferencia: mesReferencia },
            orderBy: { dataVencimento: "asc" }
        });
        return prestacoes;
    }

    async updatePrestacao(prestacaoId: string, novaLeitura: number) {
        try {
            const prestacaoExisting = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

            if (!prestacaoExisting) {
                throw new Error('Prestação de aluguel não encontrada no banco de dados.');
            }

            const contratoByPrestacao = await prismaClient.contrato.findFirst({ where: { id: prestacaoExisting.contractId } });

            const apartamentoContract = await prismaClient.apartamento.findFirst({ where: { id: contratoByPrestacao.aptId } });

            const predioApt = await prismaClient.predio.findFirst({ where: { id: apartamentoContract.id_predio } });

            //logica do banco de kWh

            let leituraAtual = contratoByPrestacao.leituraAtual;
            let consumoKWh = novaLeitura - leituraAtual;
            let valorAdicional = consumoKWh * predioApt.kwhPrice;

            try {
                await prismaClient.$transaction(async (prisma) => {
                    await prisma.prestacaoAluguel.update({
                        where: { id: prestacaoExisting.id },
                        data: {
                            consumoKWh: consumoKWh,
                            valorExcedenteKWh: valorAdicional,
                        }
                    });

                    await prisma.contrato.update({
                        where: { id: contratoByPrestacao.id },
                        data: {
                            leituraAtual: novaLeitura,
                        }
                    });
                });
            } catch (error) {
                throw new Error('Erro ao atualizar dados da prestação no banco de dados.');
            }

            return;

        } catch (error) {
            console.error(error);
            throw new Error('Erro ao atualizar prestação');
        }
    }

    async registrarPagamento(prestacaoId: string, comprovante: Express.Multer.File) {
        const prestacaoExisting = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

        if (!prestacaoExisting) {
            throw new Error('Prestação de aluguel nao encontrada no banco de dados.');
        }

        if (prestacaoExisting.statusPagamento === StatusPagamento.PAGO || prestacaoExisting.statusPagamento === StatusPagamento.CANCELADO) {
            throw new Error('Prestação já se encontra fechada no sistema.');
        }

        let uploadedFileUrl = '';

        if (comprovante) {
            const token = await getToken();

            try {
                //upload comprovante
                const response = await axios.post(
                    `${process.env.WORDPRESS_URL}/wp-json/wp/v2/media`,
                    fs.createReadStream(comprovante.path),
                    {
                        headers: {
                            'Content-Disposition': `attachment; filename="${comprovante.originalname}"`,
                            'Content-Type': comprovante.mimetype,
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                fs.unlinkSync(comprovante.path);
                uploadedFileUrl = response.data.source_url;

            } catch (err) {
                throw new Error('Error uploading files to WordPress. ' + err.message);
            }
        }

        await prismaClient.prestacaoAluguel.update({
            where: {
                id: prestacaoId
            },
            data: {
                statusPagamento: StatusPagamento.AGUARDANDO,
                linkComprovante: uploadedFileUrl,
            }
        });

        return;
    }

    async aprovaPagamento(prestacaoId: string) {
        const prestacaoExisting = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

        if (!prestacaoExisting) {
            throw new Error('Prestação de aluguel nao encontrada no banco de dados.');
        }

        if (prestacaoExisting.statusPagamento === StatusPagamento.PAGO || prestacaoExisting.statusPagamento === StatusPagamento.CANCELADO) {
            throw new Error('Prestação já se encontra fechada no sistema.');
        }

        if (prestacaoExisting.statusPagamento === StatusPagamento.AGUARDANDO) {
            await prismaClient.prestacaoAluguel.update({
                where: {
                    id: prestacaoId
                },
                data: {
                    statusPagamento: StatusPagamento.PAGO
                }
            });
        } else {
            throw new Error('Prestação de aluguel não consta como paga.');
        }

        return;
    }

    async reprovarPagamento(prestacaoId: string) {
        const prestacaoExisting = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

        if (!prestacaoExisting) {
            throw new Error('Prestação de aluguel nao encontrada no banco de dados.');
        }

        if (prestacaoExisting.statusPagamento !== StatusPagamento.AGUARDANDO) {
            throw new Error('Sem nescessidade dessa operação.');
        }

        await prismaClient.prestacaoAluguel.update({
            where: {
                id: prestacaoId
            },
            data: {
                statusPagamento: StatusPagamento.PENDENTE,
                linkComprovante: null
            }
        });

        verificaPrestacoesEmAtraso();

        return;
    }

    async deletePrestacao(prestacaoId: string) {
        const existingPretacao = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

        if (!existingPretacao) {
            throw new Error('Prestação de aluguel não encontrado no banco de dados.');
        }

        await prismaClient.prestacaoAluguel.delete({ where: { id: prestacaoId } });

        return;
    }

    async generateQrCodePixPagamento(prestacaoId: string) {
        try {
            const prestacaoExisting = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

            if (!prestacaoExisting) {
                throw new Error('Prestação de aluguel nao encontrada no banco de dados.');
            }

            if (prestacaoExisting.statusPagamento === StatusPagamento.PAGO) {
                return { status: 'PAGO', message: 'Prestação já se encontra fechada no sistema.' };
            }

            if (prestacaoExisting.statusPagamento === StatusPagamento.CANCELADO) {
                return { status: 'CANCELADO', message: 'Prestação já se encontra fechada no sistema.' };
            }

            if (prestacaoExisting.statusPagamento === StatusPagamento.AGUARDANDO) {
                return { status: 'AGUARDANDO', message: 'Prestação se encontra em análise de comprovante.' };
            }

            let valorTotal = prestacaoExisting.valor + prestacaoExisting.multa + prestacaoExisting.valorExcedenteKWh;

            let dataPagamento = {
                version: '01',
                key: '+5584999381079',
                name: 'FLATFERSA',
                city: 'ANGICOS',
                cep: '59515000',
                value: valorTotal
            }

            const response = await generateQrCodePix(dataPagamento);

            return response;
        } catch (error) {
            throw new Error('Erro ao gerar QrCodePix: ' + error.message);
        }
    }

    async marcarPago(prestacaoId: string) {
        try {
            const prestacaoExisting = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

            if (!prestacaoExisting) {
                throw new Error('Prestação de aluguel nao encontrada no banco de dados.');
            }

            await prismaClient.prestacaoAluguel.update({
                where: { id: prestacaoId },
                data: {
                    statusPagamento: StatusPagamento.PAGO
                }
            });

            return;
        } catch (error) {
            throw new Error('Erro marcar prestação como paga:  ' + error.message);
        }
    }

    async marcarPendente(prestacaoId: string) {
        try {
            const prestacaoExisting = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

            if (!prestacaoExisting) {
                throw new Error('Prestação de aluguel nao encontrada no banco de dados.');
            }

            await prismaClient.prestacaoAluguel.update({
                where: { id: prestacaoId },
                data: {
                    statusPagamento: StatusPagamento.PENDENTE
                }
            });

            verificaPrestacoesEmAtraso();

            return;
        } catch (error) {
            throw new Error('Erro marcar prestação como paga:  ' + error.message);
        }
    }
}

export default PrestacaoService;