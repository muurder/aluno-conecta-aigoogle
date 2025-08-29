

import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, BookOpenIcon, UserIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { COURSE_ICONS } from '../constants';

// Simple seeded pseudo-random generator for consistent daily data
const seededRandom = (seed: number) => {
  let s = Math.sin(seed) * 10000;
  return s - Math.floor(s);
};

// Function to generate unique random data based on course name and date
const generateCourseData = (courseName: string) => {
    const today = new Date();
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    // Create a seed from the course name characters
    const courseSeed = courseName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const finalSeed = daySeed + courseSeed;

    const professors = ["Dr. Carlos Silva", "Dra. Ana Pereira", "Prof. Bruno Costa", "Profa. Juliana Martins", "Dr. Ricardo Almeida", "Dra. Fernanda Lima"];
    const descriptions = [
        "Um curso abrangente que explora os fundamentos e as aplicações avançadas da área.",
        "Projetado para desenvolver habilidades práticas e conhecimento teórico profundo.",
        "Focado nas últimas tendências e tecnologias do mercado, preparando você para o futuro.",
        "Uma jornada de aprendizado que combina teoria, prática e estudos de caso reais.",
        "Ideal para quem busca se especializar e se destacar em um campo competitivo."
    ];
    const topics = [
        "Introdução à Disciplina", "Conceitos Fundamentais", "Metodologias e Ferramentas", "Estudo de Caso Prático",
        "Tópicos Avançados I", "Legislação e Ética", "Projeto Aplicado", "Avaliação Final", "Seminários e Apresentações",
        "Análise de Dados", "Inovação e Empreendedorismo", "Gestão de Projetos"
    ];
    
    const shuffle = (array: string[], seed: number) => {
        let currentIndex = array.length, temporaryValue, randomIndex;
        let localSeed = seed;

        while (0 !== currentIndex) {
            localSeed = (localSeed * 9301 + 49297) % 233280;
            randomIndex = Math.floor(localSeed / 233280 * currentIndex);
            currentIndex -= 1;

            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    const professor = professors[Math.floor(seededRandom(finalSeed * 1.1) * professors.length)];
    const description = descriptions[Math.floor(seededRandom(finalSeed * 1.2) * descriptions.length)];
    const shuffledTopics = shuffle([...topics], finalSeed);
    const ementa = shuffledTopics.slice(0, 5 + Math.floor(seededRandom(finalSeed * 1.3) * 4)); // Between 5 and 8 topics

    return { professor, description, ementa };
};


const CourseDetail: React.FC = () => {
    const navigate = useNavigate();
    const { courseName } = useParams<{ courseName: string }>();

    const decodedCourseName = courseName ? decodeURIComponent(courseName) : 'Curso';

    const courseData = useMemo(() => generateCourseData(decodedCourseName), [decodedCourseName]);
    
    const courseIcon = (decodedCourseName && COURSE_ICONS[decodedCourseName]) || COURSE_ICONS["Default"];

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="p-4 flex items-center text-gray-800 bg-white shadow-sm sticky top-0 z-10 border-b">
                <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg truncate">{decodedCourseName}</h1>
            </header>

            <main className="flex-grow p-4 overflow-y-auto space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 mb-4">
                        {/* FIX: Cast icon to a ReactElement that accepts a className prop to resolve TypeScript error. */}
                        {React.cloneElement(courseIcon as React.ReactElement<{ className: string }>, { className: "w-8 h-8" })}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">{decodedCourseName}</h2>
                    <div className="mt-2 flex items-center justify-center gap-2 text-gray-500">
                        <UserIcon className="w-5 h-5" />
                        <span>{courseData.professor}</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                     <div className="flex items-center gap-3 mb-4">
                        <BookOpenIcon className="w-6 h-6 text-blue-500" />
                        <h3 className="text-xl font-bold text-gray-700">Descrição</h3>
                    </div>
                    <p className="text-gray-600">{courseData.description}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                     <div className="flex items-center gap-3 mb-4">
                        <DocumentTextIcon className="w-6 h-6 text-blue-500" />
                        <h3 className="text-xl font-bold text-gray-700">Ementa do Curso</h3>
                    </div>
                    <ul className="space-y-3">
                        {courseData.ementa.map((topic, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <CheckCircleIcon className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                <span className="text-gray-700">{topic}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
            
            <footer className="p-4 bg-white border-t">
                 <button className="w-full bg-[var(--primary)] text-[var(--on-primary)] font-bold p-3 rounded-lg hover:opacity-90 transition-transform transform hover:scale-[1.02]">
                    Matricular-se neste curso
                </button>
            </footer>
        </div>
    );
};

export default CourseDetail;
