import React from 'react';
import type { UniversityName } from './types';
import {
    AcademicCapIcon,
    AdjustmentsHorizontalIcon,
    ArchiveBoxIcon,
    BeakerIcon,
    BriefcaseIcon,
    BuildingLibraryIcon,
    BuildingOffice2Icon,
    CalculatorIcon,
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
    CodeBracketIcon,
    ComputerDesktopIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    GlobeAltIcon,
    HeartIcon,
    HomeModernIcon,
    LightBulbIcon,
    MapIcon,
    MicrophoneIcon,
    PaintBrushIcon,
    ScaleIcon,
    TrophyIcon,
    UsersIcon,
    WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

export const UNIVERSITY_LOGOS: Record<UniversityName, string> = {
    "Anhanguera": "/logos/anhanguera.svg",
    "Anhembi Morumbi": "/logos/anhembimorumbi.svg",
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
    "Unicsul": { domain: "unicsul.br", campuses: ["Liberdade", "São Miguel", "Anália Franco"] },
    "Unifesp": { domain: "unifesp.br", campuses: ["Guarulhos", "São Paulo", "Osasco"] },
    "USP": { domain: "usp.br", campuses: ["Cidade Universitária", "Largo São Francisco", "Leste"] }
};

export const COURSE_LIST = [
    // Graduação
    "Administração", "Análise e Desenvolvimento de Sistemas", "Arquitetura e Urbanismo",
    "Biblioteconomia", "Biomedicina", "Ciência de Dados", "Ciências Contábeis",
    "Ciências da Computação", "Comunicação Social", "Design", "Design de Interiores", 
    "Direito", "Educação Física", "Enfermagem", "Engenharia Civil", "Engenharia de Computação",
    "Engenharia de Produção", "Engenharia Elétrica", "Engenharia Mecânica",
    "Farmácia", "Fisioterapia", "Fonoaudiologia", "Gastronomia", "Geografia",
    "História", "Jornalismo", "Logística", "Marketing", "Medicina Veterinária",
    "Nutrição", "Odontologia", "Paisagismo", "Pedagogia", "Psicologia",
    "Publicidade e Propaganda", "Relações Internacionais", "Serviço Social", "Sistemas de Informação", "Turismo",
    // Pós-graduação
    "MBA em Gestão de Projetos", "MBA em Data Science & Analytics", "MBA em Engenharia de Software",
    "MBA em UX/UI & Product Design", "MBA em Marketing Digital & Growth", "MBA em Finanças, Controladoria e Auditoria",
    "MBA em Logística & Supply Chain", "MBA em Gestão de Pessoas & Liderança",
    "Especialização em Direito Digital e LGPD", "Especialização em Direito Tributário",
    "Especialização em Docência no Ensino Superior", "Especialização em Psicologia Organizacional",
    "Especialização em Enfermagem em UTI", "Especialização em Fisioterapia Traumato-Ortopédica",
    "Especialização em Arquitetura da Paisagem", "Especialização em Design de Interiores",
    "Especialização em Nutrição Clínica", "Especialização em Implantodontia (Odontologia)"
];

// Mapeamento de cursos para ícones do Heroicons
export const COURSE_ICONS: { [key: string]: React.ReactElement } = {
    "Default": <AcademicCapIcon className="w-8 h-8" />,
    "Administração": <BriefcaseIcon className="w-8 h-8" />,
    "Análise e Desenvolvimento de Sistemas": <CodeBracketIcon className="w-8 h-8" />,
    "Arquitetura e Urbanismo": <BuildingOffice2Icon className="w-8 h-8" />,
    "Biblioteconomia": <BuildingLibraryIcon className="w-8 h-8" />,
    "Biomedicina": <BeakerIcon className="w-8 h-8" />,
    "Ciência de Dados": <ChartBarIcon className="w-8 h-8" />,
    "Ciências Contábeis": <CalculatorIcon className="w-8 h-8" />,
    "Ciências da Computação": <ComputerDesktopIcon className="w-8 h-8" />,
    "Comunicação Social": <ChatBubbleLeftRightIcon className="w-8 h-8" />,
    "Design": <PaintBrushIcon className="w-8 h-8" />,
    "Design de Interiores": <HomeModernIcon className="w-8 h-8" />,
    "Direito": <ScaleIcon className="w-8 h-8" />,
    "Educação Física": <TrophyIcon className="w-8 h-8" />,
    "Enfermagem": <HeartIcon className="w-8 h-8" />,
    "Engenharia Civil": <WrenchScrewdriverIcon className="w-8 h-8" />,
    "Engenharia de Computação": <ComputerDesktopIcon className="w-8 h-8" />,
    "Engenharia de Produção": <AdjustmentsHorizontalIcon className="w-8 h-8" />,
    "Engenharia Elétrica": <LightBulbIcon className="w-8 h-8"