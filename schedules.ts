export interface Schedule {
  disciplina: string; // This field holds the course name from the provided data
  professor: string;
  dia_semana: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado';
  inicio: string;
  fim: string;
  sala: string;
  bloco: string;
  campus: string;
  observacoes: string; // This field will be used as the subject name
}

// Fictional class schedule data.
// In a real application, this would come from an API.
export const schedulesData: Schedule[] = [
  { disciplina: "Administração", professor: "Ana Souza", dia_semana: "Segunda", inicio: "19:00", fim: "21:00", sala: "A-101", bloco: "Bloco A", campus: "Campus Sede", observacoes: "Teoria das Organizações" },
  { disciplina: "Análise e Desenvolvimento de Sistemas", professor: "Bruno Lima", dia_semana: "Terça", inicio: "19:00", fim: "21:00", sala: "Tec-201", bloco: "Bloco Tec", campus: "Campus Sede", observacoes: "Laboratório 2" },
  { disciplina: "Arquitetura e Urbanismo", professor: "Carla Ribeiro", dia_semana: "Quarta", inicio: "14:00", fim: "16:00", sala: "B-305", bloco: "Bloco B", campus: "Campus Centro", observacoes: "Ateliê de Projeto" },
  { disciplina: "Biblioteconomia", professor: "Daniela Alves", dia_semana: "Quinta", inicio: "10:00", fim: "12:00", sala: "Bibl-1", bloco: "Bloco C", campus: "Campus Sede", observacoes: "Catalogação" },
  { disciplina: "Biomedicina", professor: "Eduardo Martins", dia_semana: "Sexta", inicio: "08:00", fim: "10:00", sala: "Lab-3", bloco: "Bloco Saúde", campus: "Campus Sede", observacoes: "Lab de Microscopia" },
  { disciplina: "Ciência de Dados", professor: "Fernanda Costa", dia_semana: "Sábado", inicio: "09:00", fim: "11:00", sala: "C-210", bloco: "Bloco C", campus: "Campus Sede", observacoes: "Análise Exploratória" },
  { disciplina: "Ciências Contábeis", professor: "Gustavo Pereira", dia_semana: "Segunda", inicio: "19:00", fim: "21:00", sala: "A-202", bloco: "Bloco A", campus: "Campus Sede", observacoes: "Contabilidade Introdutória" },
  { disciplina: "Ciências da Computação", professor: "Helena Rocha", dia_semana: "Terça", inicio: "19:00", fim: "21:00", sala: "Tec-101", bloco: "Bloco Tec", campus: "Campus Sede", observacoes: "Algoritmos" },
  { disciplina: "Comunicação Social", professor: "Igor Santos", dia_semana: "Quarta", inicio: "16:00", fim: "18:00", sala: "Est-1", bloco: "Bloco Comunicação", campus: "Campus Centro", observacoes: "Estúdio de Rádio" },
  { disciplina: "Design", professor: "Juliana Freitas", dia_semana: "Quinta", inicio: "19:00", fim: "21:00", sala: "D-110", bloco: "Bloco Design", campus: "Campus Sede", observacoes: "Fundamentos do Design" },
  { disciplina: "Direito", professor: "Karina Duarte", dia_semana: "Sexta", inicio: "19:00", fim: "21:00", sala: "A-305", bloco: "Bloco Direito", campus: "Campus Centro", observacoes: "Direito Civil" },
  { disciplina: "Educação Física", professor: "Leonardo Mendes", dia_semana: "Sábado", inicio: "08:00", fim: "10:00", sala: "Ginásio", bloco: "Bloco Esportes", campus: "Campus Sede", observacoes: "Prática - Quadra" },
  { disciplina: "Enfermagem", professor: "Mariana Pires", dia_semana: "Segunda", inicio: "14:00", fim: "16:00", sala: "Saúde-205", bloco: "Bloco Saúde", campus: "Campus Sede", observacoes: "Procedimentos de Enfermagem" },
  { disciplina: "Engenharia Civil", professor: "Nelson Carvalho", dia_semana: "Terça", inicio: "08:00", fim: "10:00", sala: "Eng-101", bloco: "Bloco Eng", campus: "Campus Sede", observacoes: "Resistência dos Materiais" },
  { disciplina: "Engenharia de Computação", professor: "Olivia Nogueira", dia_semana: "Quarta", inicio: "19:00", fim: "21:00", sala: "Tec-202", bloco: "Bloco Tec", campus: "Campus Sede", observacoes: "Sistemas Digitais" },
  { disciplina: "Engenharia de Produção", professor: "Paulo Azevedo", dia_semana: "Quinta", inicio: "16:00", fim: "18:00", sala: "Eng-305", bloco: "Bloco Eng", campus: "Campus Sede", observacoes: "Pesquisa Operacional" },
  { disciplina: "Engenharia Elétrica", professor: "Queila Barros", dia_semana: "Sexta", inicio: "10:00", fim: "12:00", sala: "Eng-210", bloco: "Bloco Eng", campus: "Campus Sede", observacoes: "Circuitos Elétricos" },
  { disciplina: "Engenharia Mecânica", professor: "Rafael Teixeira", dia_semana: "Sábado", inicio: "11:00", fim: "13:00", sala: "Eng-408", bloco: "Bloco Eng", campus: "Campus Sede", observacoes: "Termodinâmica" },
  { disciplina: "Farmácia", professor: "Sabrina Monteiro", dia_semana: "Segunda", inicio: "08:00", fim: "10:00", sala: "Saúde-102", bloco: "Bloco Saúde", campus: "Campus Sede", observacoes: "Química Geral" },
  { disciplina: "Fisioterapia", professor: "Thiago Moreira", dia_semana: "Terça", inicio: "16:00", fim: "18:00", sala: "Saúde-303", bloco: "Bloco Saúde", campus: "Campus Centro", observacoes: "Recursos Terapêuticos" },
  { disciplina: "Fonoaudiologia", professor: "Ursula Figueiredo", dia_semana: "Quarta", inicio: "10:00", fim: "12:00", sala: "Saúde-402", bloco: "Bloco Saúde", campus: "Campus Sede", observacoes: "Audiologia" },
  { disciplina: "Gastronomia", professor: "Victor Andrade", dia_semana: "Quinta", inicio: "14:00", fim: "16:00", sala: "Gastro-Lab", bloco: "Bloco Gastronomia", campus: "Campus Sede", observacoes: "Cozinha Experimental" },
  { disciplina: "Geografia", professor: "Wellington Paiva", dia_semana: "Sexta", inicio: "16:00", fim: "18:00", sala: "H-201", bloco: "Bloco Humanas", campus: "Campus Sede", observacoes: "Cartografia" },
  { disciplina: "História", professor: "Ximena Lopes", dia_semana: "Sábado", inicio: "10:00", fim: "12:00", sala: "H-305", bloco: "Bloco Humanas", campus: "Campus Sede", observacoes: "Brasil Colonial" },
  { disciplina: "Jornalismo", professor: "Yara Fernandes", dia_semana: "Segunda", inicio: "19:00", fim: "21:00", sala: "Com-204", bloco: "Bloco Comunicação", campus: "Campus Centro", observacoes: "Redação Jornalística" },
  { disciplina: "Logística", professor: "Zeca Almeida", dia_semana: "Terça", inicio: "14:00", fim: "16:00", sala: "Log-110", bloco: "Bloco Logística", campus: "Campus Sede", observacoes: "Gestão de Estoques" },
  { disciplina: "Marketing", professor: "Andréa Navarro", dia_semana: "Quarta", inicio: "19:00", fim: "21:00", sala: "MKT-101", bloco: "Bloco Negócios", campus: "Campus Sede", observacoes: "Comportamento do Consumidor" },
  { disciplina: "Medicina Veterinária", professor: "Beto Queiroz", dia_semana: "Quinta", inicio: "08:00", fim: "10:00", sala: "Vet-201", bloco: "Bloco Saúde", campus: "Campus Sede", observacoes: "Anatomia Animal" },
  { disciplina: "Nutrição", professor: "Cíntia Prado", dia_semana: "Sexta", inicio: "14:00", fim: "16:00", sala: "Nutri-Lab", bloco: "Bloco Saúde", campus: "Campus Sede", observacoes: "Bromatologia" },
  { disciplina: "Odontologia", professor: "Diego Amaral", dia_semana: "Sábado", inicio: "09:00", fim: "11:00", sala: "Odonto-Clin", bloco: "Bloco Saúde", campus: "Campus Sede", observacoes: "Clínica Odontológica" },
  { disciplina: "Pedagogia", professor: "Elisa Tavares", dia_semana: "Segunda", inicio: "10:00", fim: "12:00", sala: "Ped-101", bloco: "Bloco Educação", campus: "Campus Sede", observacoes: "Didática" },
  { disciplina: "Psicologia", professor: "Felipe Nunes", dia_semana: "Terça", inicio: "19:00", fim: "21:00", sala: "Psi-204", bloco: "Bloco Saúde", campus: "Campus Centro", observacoes: "Psicologia Social" },
  { disciplina: "Publicidade e Propaganda", professor: "Gabriela Torres", dia_semana: "Quarta", inicio: "14:00", fim: "16:00", sala: "Pub-101", bloco: "Bloco Comunicação", campus: "Campus Sede", observacoes: "Criação Publicitária" },
  { disciplina: "Relações Internacionais", professor: "Hugo Barcellos", dia_semana: "Quinta", inicio: "19:00", fim: "21:00", sala: "RI-301", bloco: "Bloco Humanas", campus: "Campus Centro", observacoes: "Teoria das RI" },
  { disciplina: "Serviço Social", professor: "Isabela Campos", dia_semana: "Sexta", inicio: "08:00", fim: "10:00", sala: "SS-110", bloco: "Bloco Humanas", campus: "Campus Sede", observacoes: "Políticas Públicas" },
  { disciplina: "Sistemas de Informação", professor: "João Vilela", dia_semana: "Sábado", inicio: "14:00", fim: "16:00", sala: "Tec-303", bloco: "Bloco Tec", campus: "Campus Sede", observacoes: "Banco de Dados" },
  { disciplina: "Turismo", professor: "Kelly Matos", dia_semana: "Segunda", inicio: "16:00", fim: "18:00", sala: "Tur-201", bloco: "Bloco Turismo", campus: "Campus Sede", observacoes: "Planejamento Turístico" },
];
