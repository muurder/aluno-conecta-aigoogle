
import React from 'react';
import type { UniversityName } from './types';

export const UNIVERSITY_LOGOS: Record<UniversityName, string> = {
    "Anhanguera": "https://i.imgur.com/Kz8pL5d.png",
    "Anhembi Morumbi": "https://i.imgur.com/bldo73T.png",
    "Estacio": "https://i.imgur.com/W2q2i5w.png",
    "Fiesp": "https://i.imgur.com/O6y6GgJ.png",
    "FMU": "https://i.imgur.com/Jd0O4U2.png",
    "São Judas": "https://i.imgur.com/zW3E2sQ.png",
    "Unicid": "https://i.imgur.com/uN8Gzpr.png",
    "Unicsul": "https://i.imgur.com/Fw8h4pP.png",
    "Unifesp": "https://i.imgur.com/fGv7u1c.png",
    "USP": "https://i.imgur.com/o1bX2tY.png"
};

export const UNIVERSITY_DETAILS: Record<UniversityName, { domain: string; campuses: string[] }> = {
    "Anhanguera": { domain: "anhanguera.edu.br", campuses: ["Santana", "Taboão", "Guarulhos", "Osasco"] },
    "Anhembi Morumbi": { domain: "anhembi.br", campuses: ["Mooca", "Vila Olímpia", "Santo Amaro", "Paulista"] },
    "Estacio": { domain: "estacio.br", campuses: ["Conceição", "Jabaquara", "Barra Funda", "Tatuapé"] },
    "Fiesp": { domain: "fiesp.com.br", campuses: ["Paulista"] },
    "FMU": { domain: "fmu.br", campuses: ["Santo Amaro", "Liberdade", "Vila Mariana"] },
    "São Judas": { domain: "saojudas.br", campuses: ["Mooca", "Paulista", "Butantã"] },
    "Unicid": { domain: "cs.unicid.edu.br", campuses: ["Tatuapé", "Pinheiros", "Vila Maria", "Santo Amaro"] },
    "Unicsul": { domain: "unicsul.br", campuses: ["Liberdade", "Santo Amaro", "São Miguel Paulista", "Paulista"] },
    "Unifesp": { domain: "unifesp.br", campuses: ["Diadema", "Guarulhos", "São José dos Campos"] },
    "USP": { domain: "usp.br", campuses: ["Butantã", "Leste", "São Francisco"] }
};

export const COURSE_LIST: string[] = [
    "Administração", "Análise e Desenvolvimento de Sistemas", "Arquitetura e Urbanismo", 
    "Biblioteconomia", "Biomedicina", "Ciência de Dados", "Ciências Contábeis", 
    "Ciências da Computação", "Comunicação Social", "Design", "Direito", "Educação Física", 
    "Enfermagem", "Engenharia Civil", "Engenharia de Computação", "Engenharia de Produção", 
    "Engenharia Elétrica", "Engenharia Mecânica", "Farmácia", "Fisioterapia", "Fonoaudiologia", 
    "Gastronomia", "Geografia", "História", "Jornalismo", "Logística", "Marketing", 
    "Medicina Veterinária", "Nutrição", "Odontologia", "Pedagogia", "Psicologia", 
    "Publicidade e Propaganda", "Relações Internacionais", "Serviço Social", 
    "Sistemas de Informação", "Turismo"
];
