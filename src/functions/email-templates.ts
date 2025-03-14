const baseTemplate = (
    content: string,
    greeting: string = 'Olá, ',
    footerText: string = 'Equipe FlatFersa'
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Email Template</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <header style="
        display: flex; 
        justify-content: center; 
        align-items: center; 
        padding: 20px; 
        background-color: #fff; 
        border-radius: 8px 8px 0 0;
        ">
        <img src="https://flatfersa.com.br/wp-content/uploads/2024/07/icone-no-fundo.png" 
            alt="Logo da Empresa" 
            style="max-width: 200px; height: auto;">
    </header>

    <!-- Content -->
    <div style="padding: 30px 25px;">
      <h2 style="color: #2d3748; margin-top: 0;">${greeting}</h2>
      ${content}
    </div>

    <!-- Footer -->
    <footer style="padding: 20px; background-color: #f7fafc; border-radius: 0 0 8px 8px; text-align: center;">
      <p style="color: #718096; margin: 0; font-size: 14px;">
        ${footerText}<br>
        <a href="https://app.flatfersa.com.br" 
           style="color: #4299e1; text-decoration: none;">Acessar Plataforma</a> | 
        <a href="mailto:contato@flatfersa.com.br" 
           style="color: #4299e1; text-decoration: none;">Suporte</a>
      </p>
    </footer>
    
  </div>
</body>
</html>
`;

export const EmailTemplates = {
    SOLICITACAO_RECEBIDA: (clientName: string) =>
        baseTemplate(
            `<div style="color: #4a5568; line-height: 1.6;">
                <p>Sua solicitação de acesso foi recebida com sucesso!</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0;">
                        Status atual: 
                        <strong style="color: #2b6cb0;">Em análise documental</strong>
                    </p>
                </div>
        
                <p>Nossa equipe está verificando seus documentos e entraremos em contato em até:</p>
                <ul style="margin: 15px 0; padding-left: 20px;">
                    <li>48 horas úteis para solicitações de acesso</li>
                    <li>5 dias úteis para análise de contratos</li>
                </ul>
            </div>`,
            `Olá, ${clientName}!`,
            "Atenciosamente, Equipe de Cadastro"
        ),
    ACESSO_LIBERADO: (clientName: string, email: string, loginLink: string) =>
        baseTemplate(
            `<div style="color: #4a5568;">
                <p>Seu acesso foi liberado! Utilize os seguintes dados para entrar na plataforma:</p>
                
                <div style="background-color: #ebf4ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <p style="margin: 5px 0;">
                        📧 Login: <strong>${email}</strong>
                    </p>
                    <p style="margin: 5px 0;">
                        🔑 Senha inicial: <strong>Seu CPF</strong>
                    </p>
                </div>

                <a href="${loginLink}" 
                    style="display: inline-block; background-color: #48bb78; color: white; 
                            padding: 12px 30px; border-radius: 6px; text-decoration: none; 
                            margin: 15px 0;">
                    Primeiro Acesso
                </a>

                <p style="color: #718096; font-size: 14px;">
                    Recomendamos alterar sua senha após o primeiro login.
                </p>
            </div>`,
            `Bemvindo, ${clientName}!`,
            "Atenciosamente, Equipe de Suporte"
        ),
    NOVA_SOLICITACAO_ADMIN: (clientName: string) =>
        baseTemplate(
            `<div style="color: #4a5568;">
                <p style="margin-top: 0;">Nova solicitação requer análise:</p>
                
                <div style="border-left: 4px solid #4299e1; padding-left: 15px; margin: 20px 0;">
                  <p style="margin: 5px 0;">
                    👤 Cliente: <strong>${clientName}</strong>
                  </p>
                  <p style="margin: 5px 0;">
                    📅 Data: ${new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
        
                <a href="https://app.flatfersa.com.br/clientes" 
                   style="display: inline-block; background-color: #4299e1; color: white; 
                          padding: 10px 25px; border-radius: 6px; text-decoration: none;">
                  Ver Solicitação
                </a>
              </div>`,
            "Nova Solicitação no Sistema!",
            "Notificação Automática - Sistema de Aprovações"
        ),
    ADMIN_NOVO_CONTRATO: (clientName: string) =>
        baseTemplate(
            `<div style="color: #4a5568;">
                <p style="margin-top: 0;">Nova solicitação de contrato requer análise:</p>
                
                <div style="border-left: 4px solid #4299e1; padding-left: 15px; margin: 20px 0;">
                  <p style="margin: 5px 0;">
                    👤 Cliente: <strong>${clientName}</strong>
                  </p>
                  <p style="margin: 5px 0;">
                    📅 Data Solicitação: ${new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
        
                <a href="https://app.flatfersa.com.br/contratos" 
                   style="display: inline-block; background-color: #4299e1; color: white; 
                          padding: 10px 25px; border-radius: 6px; text-decoration: none;
                          margin-bottom: 15px;">
                  Analisar Contrato
                </a>
        
                <p style="color: #718096; font-size: 14px;">
                  Prazo máximo para análise: 72 horas úteis
                </p>
              </div>`,
            "Nova Solicitação de Contrato!",
            "Notificação Automática - Sistema de Contratos"
        ),
    CLIENTE_AGUARDANDO_APROVACAO: (clientName: string) =>
        baseTemplate(
            `<div style="color: #4a5568;">
                <p>Olá <strong>${clientName}</strong>,</p>
                
                <p>Recebemos sua solicitação de contrato e ela está em análise.</p>
        
                <div style="background-color: #fffaf0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0; color: #dd6b20;">
                    ⏳ Status Atual: <strong>Em Análise Documental</strong>
                  </p>
                  <p style="margin: 5px 0; color: #718096;">
                    Prazo estimado: 3 dias úteis
                  </p>
                </div>
        
                <p>Você receberá atualizações por email sobre:</p>
                <ul style="margin: 15px 0; padding-left: 20px; color: #718096;">
                  <li>Aprovação do contrato</li>
                  <li>Necessidade de documentos adicionais</li>
                  <li>Próximos passos</li>
                </ul>
              </div>`,
            `Solicitação Recebida, ${clientName}!`,
            "Atenciosamente, Equipe de Contratos"
        ),
    CLIENTE_CONTRATO_APROVADO: (clientName: string) =>
        baseTemplate(
            `<div style="color: #4a5568;">
                <div style="text-align: center; margin: 25px 0;">
                  <div style="display: inline-block; background-color: #48bb78; color: white; 
                       padding: 10px 20px; border-radius: 20px; font-size: 14px;">
                    Contrato Aprovado ✅
                  </div>
                </div>
        
                <p>Prezado(a) <strong>${clientName}</strong>,</p>
                
                <p>Seu contrato foi aprovado e está pronto para assinatura digital:</p>
        
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://app.flatfersa.com.br/contratos" 
                     style="display: inline-block; background-color: #2d3748; color: white; 
                            padding: 15px 40px; border-radius: 8px; text-decoration: none;
                            font-weight: bold;">
                    Assinar Contrato
                  </a>
                </div>
              </div>`,
            `Parabéns, ${clientName}!`,
            "Atenciosamente, Departamento Jurídico"
        ),
};