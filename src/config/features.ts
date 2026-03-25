export const APP_CONFIG = {
  unidadeId: "matriz-01",
  nomeUnidade: "Barber Pro - Unidade Centro",
  
  // Módulos que o dono pode ligar/desligar
  features: {
    limpezaPele: true,
    sobrancelha: true,
    fidelidadeAtiva: true, // Regra dos 20 cortes
    notificacaoWhatsapp: true, 
  },

  // Regras de Negócio
  regras: {
    tempoMedioCorte: 30, // base para o calendário inteligente
    intervaloLimpeza: 5,  // minutos entre um cliente e outro
    cortesParaPremio: 20,
    percentualDesconto: 50, // 50% de desconto no 20º corte
  }
};