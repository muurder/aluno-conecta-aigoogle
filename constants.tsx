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
    // FIX: Imported ChartBarIcon to resolve 'Cannot find name' error.
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

// Maps course names to specific Heroicons for a more personalized UI
export const COURSE_ICONS: Record<string, React.ReactNode> = {
    "Default": <AcademicCapIcon className="w-6 h-6" />,
    "Administração": <BriefcaseIcon className="w-6 h-6" />,
    "Análise e Desenvolvimento de Sistemas": <CodeBracketIcon className="w-6 h-6" />,
    "Arquitetura e Urbanismo": <HomeModernIcon className="w-6 h-6" />,
    "Biblioteconomia": <BuildingLibraryIcon className="w-6 h-6" />,
    "Biomedicina": <BeakerIcon className="w-6 h-6" />,
    "Ciência de Dados": <ChartBarIcon className="w-6 h-6" />,
    "Ciências Contábeis": <CalculatorIcon className="w-6 h-6" />,
    "Ciências da Computação": <ComputerDesktopIcon className="w-6 h-6" />,
    "Comunicação Social": <ChatBubbleLeftRightIcon className="w-6 h-6" />,
    "Design": <PaintBrushIcon className="w-6 h-6" />,
    "Direito": <ScaleIcon className="w-6 h-6" />,
    "Educação Física": <TrophyIcon className="w-6 h-6" />,
    "Enfermagem": <HeartIcon className="w-6 h-6" />,
    "Engenharia Civil": <BuildingOffice2Icon className="w-6 h-6" />,
    "Engenharia de Computação": <ComputerDesktopIcon className="w-6 h-6" />,
    "Engenharia de Produção": <AdjustmentsHorizontalIcon className="w-6 h-6" />,
    "Engenharia Elétrica": <LightBulbIcon className="w-6 h-6" />,
    "Engenharia Mecânica": <WrenchScrewdriverIcon className="w-6 h-6" />,
    "Farmácia": <BeakerIcon className="w-6 h-6" />,
    "Fisioterapia": <HeartIcon className="w-6 h-6" />,
    "Fonoaudiologia": <MicrophoneIcon className="w-6 h-6" />,
    "Gastronomia": <BeakerIcon className="w-6 h-6" />, // No direct icon, using a related one
    "Geografia": <MapIcon className="w-6 h-6" />,
    "História": <ArchiveBoxIcon className="w-6 h-6" />,
    "Jornalismo": <DocumentTextIcon className="w-6 h-6" />,
    "Logística": <ArchiveBoxIcon className="w-6 h-6" />,
    "Marketing": <CurrencyDollarIcon className="w-6 h-6" />,
    "Medicina Veterinária": <HeartIcon className="w-6 h-6" />,
    "Nutrição": <HeartIcon className="w-6 h-6" />,
    "Odontologia": <UsersIcon className="w-6 h-6" />,
    "Pedagogia": <AcademicCapIcon className="w-6 h-6" />,
    "Psicologia": <UsersIcon className="w-6 h-6" />,
    "Publicidade e Propaganda": <ChatBubbleLeftRightIcon className="w-6 h-6" />,
    "Relações Internacionais": <GlobeAltIcon className="w-6 h-6" />,
    "Serviço Social": <UsersIcon className="w-6 h-6" />,
    "Sistemas de Informação": <ComputerDesktopIcon className="w-6 h-6" />,
    "Turismo": <MapIcon className="w-6 h-6" />,
};
