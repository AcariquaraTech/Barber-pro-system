export interface Barbeiro {
  id: string;
  matricula: string;
  nome: string;
  foto: string;
  // Escala 6x1: [Dom, Seg, Ter, Qua, Qui, Sex, Sab]
  // 1 = Trabalha, 0 = Folga
  escala: [number, number, number, number, number, number, number];
  unidadeId: string; // Para interligar as 20 unidades
  servicosHabilitados: string[]; // Ex: ["corte", "barba"]
}