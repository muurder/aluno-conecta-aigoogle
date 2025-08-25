import React from 'react';
import type { UniversityName } from './types';

export const UNIVERSITY_LOGOS: Record<UniversityName, string> = {
    "Anhanguera": "/logos/anhanguera.png",
    "Anhembi Morumbi": "/logos/anhembimorumbi.png",
    "Estacio": "/logos/estacio.png",
    "Fiesp": "/logos/fiesp.png",
    "FMU": "/logos/fmu.png",
    "São Judas": "/logos/saojudas.png",
    "Unicid": "/logos/unicid.png",
    "Unicsul": "/logos/unicsul.png",
    "Unifesp": "/logos/unifesp.png",
    "USP": "/logos/usp.jpg"
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