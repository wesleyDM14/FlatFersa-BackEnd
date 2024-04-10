import PDFDocument from 'pdfkit';
import fs from 'fs';

import prismaClient from '../prisma';

export async function gerarContratoPDF(/*contratoId: string*/dataCallback, endCallback) {

    /*const contractExisting = await prismaClient.contrato.findFirst({ where: { id: contratoId } });

    if (!contractExisting) {
        throw new Error('Contrato não encontrado no banco de dados.');
    }*/

    const doc = new PDFDocument();

    doc.on('data', dataCallback);
    doc.on('end', endCallback);

    //Escrever conteudo no PDF
    doc.font('Times-Bold').fontSize(12).text('Contrato de Locação Residencial', { align: 'center' });
    doc.moveDown();
    doc.font('Times-Italic').fontSize(12).text('O modelo de contrato de locação residencial apresentado visa facilitar a relação entre o inquilino e o proprietário, possibilitando um entendimento básico dos dispositivos presentes na Lei do Inquilinato (Lei 12.112/09).', { align: 'justify' });
    doc.moveDown();
    doc.font('Times-Bold').fontSize(12).text('Contrato de Locação de Imóvel', { align: 'center' });
    doc.moveDown();
    doc.font('Times-Roman').fontSize(12).text('LOCADOR: Anael Antonio Nunes da Costa', { align: 'justify', continued: true, });
    doc.font('Times-Roman').fontSize(12).text('CPF: 850.941.374-68', { align: 'justify' });
    doc.font('Times-Roman').fontSize(12).text('LOCATARIO: {usuario.name}', { continued: true, align: 'justify' });
    doc.font('Times-Roman').fontSize(12).text('TELEFONE: {usuario.phone}', { align: 'justify' });
    doc.font('Times-Roman').fontSize(12).text('CPF: {usuario.cpf}', { continued: true, align: 'justify' });
    doc.font('Times-Roman').fontSize(12).text('RG: {usuario.rg}', { align: 'justify' });
    doc.font('Times-Roman').fontSize(12).text('IMÓVEL: Residencial, localizado na Rua Gamaliel Martins Bezerra, Nº 470, apt. {apartamento.numero} – Alto da Alegria, no município de Angicos /RN. ', { align: 'justify' });
    doc.font('Times-Roman').fontSize(12).text('FINALIDADE: Residencial', { align: 'justify' });
    doc.font('Times-Roman').fontSize(12).text('ATIVIDADE: Residência', { align: 'justify' });
    doc.font('Times-Roman').fontSize(12).text('PRAZO DA LOCAÇÃO: {contrato.duracao}', { align: 'justify' });
    doc.font('Times-Roman').fontSize(12).text('INÍCIO: {contrato.dataIninio}', { align: 'justify' });
    doc.font('Times-Roman').fontSize(12).text('TÉRMINO: {contrato.dataFim}', { align: 'justify' });
    doc.font('Times-Roman').fontSize(12).text('VENCIMENTO: DIA {contrato.DiaVencimento} DE CADA MÊS.', { align: 'justify' });
    doc.font('Times-Roman').fontSize(12).text('VALOR MENSAL DA LOCAÇÃO: R${contrato.valor} ', { align: 'justify' });
    doc.font('Times-Roman').fontSize(12).text('PERIODICIDADE DO REAJUSTE: {periocidade do reajuste}', { align: 'justify' });
    doc.moveDown();
    doc.fillColor('red').text('CLÁUSULA PRIMEIRA');
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('Constitui objeto do presente Contrato a locação do imóvel residencial localizado no município de Angicos/RN, na Rua Gamaliel Martins Bezerra, Nº 470, flat {apartamento.numero}, cujo locador é o legítimo dono do imóvel, dando-o em locação ao locatário para fins exclusivamente residencial a ser utilizado na forma de Residência.', { align: 'justify' });
    doc.moveDown();
    doc.fillColor('red').text('CLÁUSULA SEGUNDA');
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('O prazo de locação é de {contrato.duracao} meses, com termo inicial em {contrato.dataInicio} e termo final em {contrato.dataFinal}, data em que o locatário se obriga a restituir o imóvel livre e desocupado, em condições idênticas à que recebeu, ressalvando o desgaste natural do imóvel.', { align: 'justify' });
    doc.fillColor('red').text('PARÁGRAFO PRIMEIRO ', { continued: true });
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('- Findo o prazo estipulado no caput desta Cláusula, operar-se-á o término da avença somente através de notificação por escrito do locador, sendo que, na falta de tal notificação, ocorrerá à renovação automática do contrato, conforme dispõe legislação específica (Lei 12.112/09). ', { align: 'justify' });
    doc.fillColor('red').text('PARÁGRAFO SEGUNDO ', { continued: true });
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('- O locatário não cumprindo o prazo de locação que consta no contrato, não se abstém do direito do uso do calção.', { align: 'justify' });
    doc.moveDown();
    doc.fillColor('red').text('CLÁUSULA TERCEIRA');
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('O aluguel mensal fica estipulado em R$ {contrtato.valor}, sendo pago no {contrato.diaVencimento} dia útil do mês subsequente ao vencido, por meio de pagamento pessoal ao locador ou através de boleto bancário, depósito, transferência ou PIX (84 999381079), em qualquer uma das contas: do Banco do Brasil: Agência 214-3 Conta Corrente 38949-8/ Caixa Econômica Federal: Agência 0756, operação 013, Conta Poupança 0008044577557-0. Com apresentação do comprovante através dos números de Whatsapp (84) 99938-1079 ou (84) 99938-0174.', { align: 'justify' });
    doc.fillColor('red').text('PARÁGRAFO PRIMEIRO ', { continued: true });
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('- O valor locativo será reajustado anualmente, se houver necessidade, de acordo com a variação acumulada. Na ausência deste índice será eleito outro legalmente previsto, conforme prévia convenção das partes.', { align: 'justify' });
    doc.fillColor('red').text('PARÁGRAFO SEGUNDO ', { continued: true });
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('- Após a data de vencimento, terá um prazo de 5 dias úteis para pagar sem alteração no valor. Após o respectivo vencimento, não havendo pagamento incidirá multa moratória de 2% (dois por cento) ao mês.', { align: 'justify' });
    doc.fillColor('red').text('PARÁGRAFO TERCEIRO ', { continued: true });
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('- se após o prazo de 5 dias úteis não havendo o pagamento do aluguel do imóvel, a água destinada ao flat em débito será cortada.', { align: 'justify' });
    doc.moveDown();
    doc.fillColor('red').text('CLÁUSULA QUARTA');
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('Fica vedada a sub-locação do imóvel ou a cessão dos direitos decorrentes deste instrumento a terceiros, mesmo que parcial ou temporária, seja a que título for, por parte do LOCATÓRIO, sem a anuência, por escrito, do LOCADOR.', { align: 'justify' });
    doc.moveDown();
    doc.fillColor('red').text('CLÁUSULA QUINTA');
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('Além do aluguel mensal, incumbirá ao LOCATÁRIO o pagamento de todas as despesas e tributos incidentes sobre o imóvel, como, por exemplo, taxas de energia elétrica (com pedido de religação), internet e telefone fixo. Com exceção de água, pois, está inclusa juntamente com o imóvel.', { align: 'justify' });
    doc.fillColor('red').text('PARÁGRAFO PRIMEIRO ', { continued: true });
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('- É de inteira responsabilidade do LOCATÁRIO fazer o cancelamento da energia elétrica do flat alugado. Deve dirigir-se as agências da COSERN ou ligar para o número 116, além do mais, verificar as contas disponíveis no sistema para efetuar o pagamento e não deixar dívidas no imóvel. ', { align: 'justify' });
    doc.fillColor('red').text('PARÁGRAFO SEGUNDO ', { continued: true });
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('- Os encargos da locação, especificados no caput desta cláusula, são de inteira responsabilidade do LOCATÁRIO, que se obriga a pagá-los em seus respectivos vencimentos, devendo comprová-los ao LOCADOR sempre que solicitado, e, em especial, quando do encerramento do Contrato.', { align: 'justify' });
    doc.fillColor('red').text('PARÁGRAFO TERCEIRO ', { continued: true });
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('- O LOCATÁRIO obriga-se a manter as dependências locadas em boas condições de higiene e limpeza, dentro das normas legais pertinentes.', { align: 'justify' });
    doc.fillColor('red').text('PARÁGRAFO QUARTO ', { continued: true });
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('- Se caso houver alguma danificação ao imóvel, é responsabilidade do LOCATÁRIO repor o dano causado.', { align: 'justify' });
    doc.fillColor('red').text('PARÁGRAFO QUINTO ', { continued: true });
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('- Fica inibida sob este contrato a perfuração, rabiscos, pinturas e manchas na parede. O locatário deve manter o imóvel assim como recebeu.', { align: 'justify' });
    doc.moveDown();
    doc.fillColor('red').text('CLÁUSULA SEXTA');
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('O LOCATÁRIO terá direito à indenização por benfeitorias necessárias e úteis, valendo-se, sobre tais benfeitorias, o direito de retenção, desde que as benfeitorias úteis tenham sido consentidas e autorizadas pelo LOCADOR.', { align: 'justify' });
    doc.moveDown();
    doc.fillColor('red').text('CLÁUSULA SÉTIMA');
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('A parte que infringir qualquer cláusula deste Contrato pagará à outra multa pecuniária correspondente ao valor de dois aluguéis vigentes na data da infração. A multa será sempre paga por inteiro, atualizada, independentemente do tempo decorrido do Contrato.', { align: 'justify' });
    doc.moveDown();
    doc.fillColor('red').text('CLÁUSULA OITAVA');
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('O LOCADOR fica autorizado a vistoriar o imóvel, objeto da locação, desde que agende antecipadamente tal visita com o LOCATÁRIO, de forma a não causar constrangimentos ou perturbações a este', { align: 'justify' });
    doc.moveDown();
    doc.fillColor('red').text('CLÁUSULA NONA');
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('Fica eleito o Foro da comarca de Angicos/RN para dirimir eventuais controvérsias oriundas deste Contrato, com renúncia a qualquer outro, por mais privilegiado que seja. E por estarem, assim, justas e contratadas, as partes assinam o presente instrumento particular em duas vias de igual teor, na presença de duas testemunhas, a tudo presente e que de tudo dão fé. ', { align: 'justify' });
    doc.moveDown();
    doc.fillColor('red').text('CLÁUSULA DÉCIMA');
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('Caso o LOCATÁRIO realize festas ou qualquer outra atividade que inclui a presença de várias pessoas no imóvel, ele deve responsabilizar-se em NÃO atrapalhar os demais flats visinhos, e manterá ordem e a paz no ambiente.', { align: 'justify' });
    doc.fillColor('red').text('PARÁGRAFO PRIMEIRO ', { continued: true });
    doc.fillColor('black').font('Times-Roman').fontSize(12).text('- No descumprimento desta cláusula o LOCATÁRIO pagará multa de 30%.', { align: 'justify' });

    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    // Posiciona as linhas para os campos de assinatura
    const signatureY = doc.y;
    doc.moveTo(100, signatureY).lineTo(250, signatureY).stroke(); // Linha para Assinatura do Locatário
    doc.moveTo(350, signatureY).lineTo(500, signatureY).stroke(); // Linha para Assinatura do Locador

    // Escreve os nomes "Locatário" e "Locador" abaixo das linhas
    doc.text('Locatário', 100, signatureY + 10); // Posição X = 100 (alinhado com a linha do Locatário), Posição Y = signatureY + 10 (para posicionamento abaixo da linha)
    doc.text('Locador', 350, signatureY + 10); // Posição X = 350 (alinhado com a linha do Locador), Posição Y = signatureY + 10 (para posicionamento abaixo da linha)

    // Move para baixo para deixar espaço para a data
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();

    // Adiciona a data local
    const dateText = 'Angicos/RN, Data: ___/___/_______';
    const dateTextWidth = doc.widthOfString(dateText); // Calcula a largura do texto da data
    const centerX = (doc.page.width - dateTextWidth) / 2; // Calcula a posição X central
    doc.text(dateText, centerX); // Escreve a data centralizada

    doc.end();
}
