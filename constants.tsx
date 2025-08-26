import React from 'react';
import type { UniversityName } from './types';

export const UNIVERSITY_LOGOS: Record<UniversityName, string> = {
    "Anhanguera": "/logos/anhanguera.svg",
    "Anhembi Morumbi": "/logos/anhenbimorumbi.svg",
    "Estacio": "/logos/estacio.svg",
    "Fiesp": "/logos/fiesp.svg",
    "FMU": "/logos/fmu.svg",
    "São Judas": "/logos/saojudas.svg",
    "Unicid": "/logos/unicid.svg",
    "Unicsul": "/logos/unicsul.svg",
    "Unifesp": "/logos/unifesp.svg",
    "USP": "/logos/usp.svg"
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