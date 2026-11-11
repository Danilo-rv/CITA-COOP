// Itens do menu, agrupados. `perfis` define quem enxerga cada item (demonstração de menu por perfil).
export const PERFIS = [
  { id: 'publico', nome: 'Visitante (público)' },
  { id: 'gestor', nome: 'Gestor público' },
  { id: 'cooperativa', nome: 'Dirigente de cooperativa' },
  { id: 'ater', nome: 'Técnico de ATER' },
  { id: 'nucleo', nome: 'Analista do Núcleo (PPGADM)' },
  { id: 'pesquisador', nome: 'Pesquisador' },
  { id: 'centro', nome: 'Equipe do Centro' },
]
const T = ['publico', 'gestor', 'cooperativa', 'ater', 'nucleo', 'pesquisador', 'centro']

export const MENU = [
  { grupo: 'Território', itens: [
    { rota: '/', nome: 'Início', icone: 'inicio', perfis: T, resumo: 'Visão geral da plataforma e dos dados.' },
    { rota: '/geoportal', nome: 'Geoportal', icone: 'mapa', perfis: T, resumo: 'Mapa nacional das cooperativas, com busca e fichas.' },
    { rota: '/sala-de-situacao', nome: 'Sala de Situação', icone: 'radar', perfis: ['gestor', 'ater', 'centro', 'cooperativa'], resumo: 'Alertas de clima, vegetação e solo por território.' },
    { rota: '/risco-territorial', nome: 'Risco Territorial', icone: 'alerta', perfis: T, resumo: 'Desastres, vulnerabilidade, água, solo e população cruzados com as cooperativas.' },
    { rota: '/politicas-publicas', nome: 'Políticas Públicas', icone: 'politicas', perfis: ['publico', 'gestor', 'pesquisador', 'centro', 'nucleo'], resumo: 'Presença cooperativa, vazios de atendimento e ICPP.' },
  ] },
  { grupo: 'Serviços', itens: [
    { rota: '/demandas', nome: 'Demandas', icone: 'demandas', perfis: ['gestor', 'cooperativa', 'ater', 'centro'], resumo: 'Registro, classificação e encaminhamento de demandas.' },
    { rota: '/ater-virtual', nome: 'ATER Virtual', icone: 'ater', perfis: ['cooperativa', 'ater', 'centro'], resumo: 'Assistente de orientação e fila para o técnico.' },
    { rota: '/mercados', nome: 'Mercados', icone: 'mercados', perfis: ['gestor', 'cooperativa', 'centro'], resumo: 'Chamadas públicas e cooperativas próximas.' },
    { rota: '/gestao', nome: 'Gestão Cooperativa', icone: 'gestao', perfis: ['cooperativa', 'nucleo', 'centro'], resumo: 'Diagnóstico IMGC, conformidade e finanças.' },
    { rota: '/formacao', nome: 'Formação', icone: 'formacao', perfis: ['cooperativa', 'ater', 'nucleo', 'centro'], resumo: 'Trilhas de capacitação para dirigentes.' },
  ] },
  { grupo: 'Conhecimento', itens: [
    { rota: '/observatorio', nome: 'Observatório', icone: 'observatorio', perfis: T, resumo: 'Demografia das cooperativas, dados abertos e catálogo.' },
    { rota: '/resultados', nome: 'Resultados', icone: 'resultados', perfis: ['gestor', 'pesquisador', 'centro', 'nucleo'], resumo: 'Indicadores de resultado do projeto.' },
    { rota: '/administracao', nome: 'Administração', icone: 'admin', perfis: ['centro'], resumo: 'Fontes de dados, perfis e governança.' },
    { rota: '/ajuda', nome: 'Ajuda e acessibilidade', icone: 'ajuda', perfis: T, resumo: 'Manual de uso e recursos de acessibilidade.' },
  ] },
]
export const TODOS_ITENS = MENU.flatMap((g) => g.itens)
