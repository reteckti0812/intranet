export interface Document {
  code: string;
  title: string;
  type: "pdf" | "word" | "excel" | "other";
  group: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  slug: string;
  documents: Document[];
}

export const departments: Department[] = [
  {
    id: "01", code: "01", name: "Alta Gestão", slug: "alta-gestao",
    documents: [
      { code: "RT-01-001", title: "Manual do Sistema de Gestão Integrada - Portuguese", type: "pdf", group: "Procedimentos" },
      { code: "RT-01-002", title: "Política do Sistema de Gestão Integrada - QEHS", type: "pdf", group: "Procedimentos" },
      { code: "RT-01-003", title: "Procedimento para Análise Crítica de SGI", type: "pdf", group: "Procedimentos" },
      { code: "RT-01-004", title: "Procedimento para Análise de Contexto Organizacional", type: "pdf", group: "Procedimentos" },
      { code: "RT-01-005", title: "Procedimento da Política de Gestão Integrada", type: "pdf", group: "Procedimentos" },
      { code: "RT-01-006", title: "Procedimento para Definição de Escopo de Certificação R2", type: "pdf", group: "Procedimentos" },
      { code: "F-RT-01-004-1", title: "Análise SWOT", type: "excel", group: "Formulários" },
      { code: "F-RT-01-004-2", title: "Mapa de Processo", type: "excel", group: "Formulários" },
      { code: "F-RT-01-004-3", title: "Formulário Análise de Riscos", type: "excel", group: "Formulários" },
      { code: "F-RT-01-004-4", title: "Formulário para Objetivos Estratégicos", type: "excel", group: "Formulários" },
      { code: "F-RT-01-004-5", title: "Plano de Ações", type: "excel", group: "Formulários" },
      { code: "F-RT-01-004-6", title: "Análise de Objetivos x Riscos x Oportunidade", type: "excel", group: "Formulários" },
    ],
  },
  {
    id: "02", code: "02", name: "TI", slug: "ti",
    documents: [
      { code: "RT-02-001", title: "Procedimento para Destruição de Dados", type: "pdf", group: "Procedimentos" },
      { code: "RT-02-002", title: "Procedimento para Criação e Exclusão de Conta de E-mail", type: "pdf", group: "Procedimentos" },
      { code: "RT-02-003", title: "Procedimento para Atividades de TI", type: "pdf", group: "Procedimentos" },
      { code: "RT-02-004", title: "Instrução para Uso de Equipamentos de TI", type: "pdf", group: "Procedimentos" },
      { code: "RT-02-005", title: "Procedimento de Validação Independente de Dados (QEHS)", type: "pdf", group: "Procedimentos" },
      { code: "RT-02-006", title: "Procedimento para Segurança de Dados para R2", type: "pdf", group: "Procedimentos" },
      { code: "RT-02-003-3", title: "Política de Gerenciamento de Classificação de Dados e Propriedade", type: "pdf", group: "SOP" },
      { code: "F-RT-02-001-1", title: "Formulário de Validação de Dados (DataWipe)", type: "excel", group: "Formulários" },
      { code: "F-RT-02-001-2", title: "Checklist de Controle de Qualidade Limpeza de Dados", type: "excel", group: "Formulários" },
      { code: "F-RT-02-006-1", title: "Formulário para Inspeção Segurança de Dados", type: "excel", group: "Formulários" },
    ],
  },
  { id: "03", code: "03", name: "Segurança Patrimonial", slug: "seguranca-patrimonial", documents: [] },
  { id: "04", code: "04", name: "EHS", slug: "ehs", documents: [] },
  { id: "05", code: "05", name: "Manutenção", slug: "manutencao", documents: [] },
  { id: "06", code: "06", name: "Processo", slug: "processo", documents: [] },
  { id: "07", code: "07", name: "Qualidade", slug: "qualidade", documents: [] },
  { id: "08", code: "08", name: "Logística", slug: "logistica", documents: [] },
  { id: "09", code: "09", name: "Compras", slug: "compras", documents: [] },
  { id: "10", code: "10", name: "Comercial", slug: "comercial", documents: [] },
  { id: "11", code: "11", name: "Business Development", slug: "business-development", documents: [] },
  {
    id: "12", code: "12", name: "Recursos Humanos", slug: "recursos-humanos",
    documents: [
      { code: "RT-12-001", title: "Procedimento para Concessão de Férias", type: "pdf", group: "Procedimentos" },
      { code: "RT-12-002", title: "Procedimento para Reembolso de Despesas", type: "pdf", group: "Procedimentos" },
      { code: "RT-12-003", title: "Procedimento para Plano de Proteção da Saúde", type: "pdf", group: "Procedimentos" },
      { code: "RT-12-004", title: "Procedimento de Integração Novos Colaboradores", type: "pdf", group: "Procedimentos" },
      { code: "RT-12-005", title: "Procedimento para Recrutamento, Seleção, Admissão, Desligamento e Movimentação de Pessoas", type: "pdf", group: "Procedimentos" },
      { code: "RT-12-006", title: "Procedimento para Descrição de Cargos", type: "pdf", group: "Procedimentos" },
      { code: "RT-12-007", title: "Procedimento para Comunicação Interna e Externa", type: "pdf", group: "Procedimentos" },
      { code: "RT-12-008", title: "Procedimento para Sistema de Premiações", type: "pdf", group: "Procedimentos" },
      { code: "RT-12-009", title: "Procedimento para Programa de Treinamento", type: "pdf", group: "Procedimentos" },
      { code: "RT-12-010", title: "Procedimento para Padronização de Assinaturas de E-mail", type: "pdf", group: "Procedimentos" },
      { code: "RT-12-011", title: "Procedimento para Contas de E-mail", type: "pdf", group: "Procedimentos" },
      { code: "RT-12-012", title: "Procedimento de Plano de Saúde e Odontológico", type: "pdf", group: "Procedimentos" },
      { code: "RT-12-013", title: "Procedimento de Gestão do Código de Vestimentas", type: "pdf", group: "Procedimentos" },
      { code: "F-RT-12-001-1", title: "Agendamento de Férias", type: "excel", group: "Formulários" },
      { code: "F-RT-12-002-1", title: "Reembolso", type: "excel", group: "Formulários" },
      { code: "F-RT-12-004-1", title: "Comprovante de Treinamento de Integração", type: "excel", group: "Formulários" },
      { code: "F-RT-12-005-1", title: "Abertura de Vaga", type: "excel", group: "Formulários" },
      { code: "F-RT-12-005-2", title: "Relação de Documentos para Admissão", type: "excel", group: "Formulários" },
      { code: "F-RT-12-005-3", title: "Ficha Admissional Re-Teck", type: "excel", group: "Formulários" },
      { code: "F-RT-12-007", title: "Matriz de Comunicação", type: "excel", group: "Formulários" },
    ],
  },
  { id: "13", code: "13", name: "Finanças", slug: "financas", documents: [] },
];
