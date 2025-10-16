/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from "@google/genai";

// --- Element Selectors ---
const mainContainer = document.getElementById('main-container');
const sentenceInput = document.getElementById('sentence-input') as HTMLTextAreaElement;
const analyzeButton = document.getElementById('analyze-button') as HTMLButtonElement;
const resultWrapper = document.getElementById('result-wrapper');
const resultContainer = document.getElementById('result-container');
const buttonText = document.getElementById('button-text');
const buttonIcon = document.getElementById('button-icon');
const themeSwitcher = document.getElementById('theme-switcher');
const themeButtons = document.querySelectorAll('.theme-button');

// --- Initial Page Load Animation ---
if (mainContainer) {
    // Make the main container visible with a fade-in effect once the script loads
    mainContainer.classList.remove('opacity-0');
}

// --- Theme Switcher Logic ---
themeSwitcher?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const themeButton = target.closest('.theme-button');
    if (themeButton) {
        const theme = themeButton.getAttribute('data-theme');
        if (theme) {
            document.documentElement.setAttribute('data-theme', theme);

            // Update active button style
            themeButtons.forEach(btn => {
                btn.classList.remove('ring-2', 'ring-offset-2', 'ring-offset-slate-900', 'ring-white');
            });
            themeButton.classList.add('ring-2', 'ring-offset-2', 'ring-offset-slate-900', 'ring-white');
        }
    }
});


// --- Core AI Instruction ---
const systemInstruction = `
Eres un experto lingüista y un analizador sintáctico avanzado especializado en español.
Tu tarea es analizar la oración proporcionada por el usuario y devolver el resultado en un formato estricto de DOS PARTES.

---
**PARTE A: Análisis Textual Estructurado (TODO en ESPAÑOL)**
El análisis debe seguir estrictamente la siguiente lista de 5 puntos.

*   **REGLA A.1 (IDIOMA):** TODA la respuesta debe ser generada ÚNICA y EXCLUSIVAMENTE en ESPAÑOL.
*   **REGLA A.2 (FORMATO):** Adhiérete estrictamente al formato de lista numerada de 5 puntos.
*   **REGLA A.3 (TERMINOLOGÍA):** Usa siempre el término **Oración (O1, O2)** en lugar de Proposición.
*   **REGLA A.4 (FUNCIÓN + SINTAGMA):** La función sintáctica debe ir seguida del tipo de sintagma (Ej: **CD / SNominal**, **CRég / SPreposicional**, **Sujeto / Oración Subordinada**).

    *   **1. Clasificación de la Oración (Naturaleza):** (Estructura, Modalidad, Voz, Naturaleza del Predicado usando O1, O2).
    *   **2. Identificación de Estructuras Mayores:** (Oración(es), Sujeto (SNominal), Predicado (SVerbal/SNominal)).
    *   **3. Análisis Detallado del Sujeto (SNominal):** (Núcleo, modificadores, complementos).
    *   **4. Análisis Detallado del Predicado (SVerbal / SNominal):** (Núcleo, complementos con tipo de sintagma y tipo de CC).
    *   **5. Resumen Final:** (Relación entre Oraciones, función de la subordinada).

---
**PARTE B: Diagrama Estructural en ASCII**
Debes generar un esquema/árbol estructural simplificado de la oración usando solo texto.

*   **REGLA B.1 (CARACTERES):** Utiliza SOLAMENTE los siguientes caracteres para la diagramación: \`| _ - \\ / ( )\` y espacios.
*   **REGLA B.2 (PRECISIÓN):** El diagrama debe representar la jerarquía sintáctica de la oración (Sujeto, Predicado, Núcleos, Complementos).
*   **REGLA B.3 (SEPARACIÓN):** Esta sección debe estar claramente separada y etiquetada como "Diagrama Estructural en ASCII".
`;

// --- Main Analysis Logic ---
analyzeButton.addEventListener('click', async () => {
    const inputValue = sentenceInput.value.trim();
    if (!inputValue) {
        resultContainer.innerHTML = '<p>Por favor, introduce una oración para analizar.</p>';
        resultWrapper.classList.remove('hidden');
        return;
    }

    // --- UI State: Loading ---
    analyzeButton.disabled = true;
    buttonText.textContent = 'Analizando...';
    buttonIcon.innerHTML = `<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>`;
    resultWrapper.classList.remove('hidden');
    resultContainer.textContent = '';


    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: inputValue,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        let fullText = '';
        for await (const chunk of response) {
            fullText += chunk.text;
            resultContainer.textContent = fullText; // Stream raw text for immediate feedback
        }

        // --- Post-processing for rich formatting ---
        resultContainer.innerHTML = ''; // Clear raw text content

        const separatorText = 'Diagrama Estructural en ASCII';
        const separatorIndex = fullText.toLowerCase().indexOf(separatorText.toLowerCase());

        const analysisText = (separatorIndex !== -1) ? fullText.substring(0, separatorIndex) : fullText;
        const asciiText = (separatorIndex !== -1) ? fullText.substring(separatorIndex + separatorText.length) : '';

        // Part 1: Structured Text Analysis
        const analysisDiv = document.createElement('div');
        analysisDiv.className = 'analysis-text';
        // Format text: bold markdown, bold list headers, and preserve line breaks
        let formattedAnalysis = analysisText
            .trim()
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-accent font-semibold">$1</strong>')
            .replace(/^(\s*\d+\.\s+[^:]+:)/gm, '<strong class="text-slate-300">$1</strong>')
            .replace(/\n/g, '<br />');
        analysisDiv.innerHTML = formattedAnalysis;
        resultContainer.appendChild(analysisDiv);

        // Part 2: ASCII Diagram
        if (asciiText.trim()) {
            const asciiDiv = document.createElement('div');
            asciiDiv.className = 'ascii-diagram mt-6 pt-6 border-t border-slate-700';
            asciiDiv.innerHTML = `
                <h3 class="text-lg font-bold text-slate-300 mb-3">${separatorText}</h3>
                <pre class="bg-slate-950 font-mono p-4 rounded-lg text-slate-400 overflow-x-auto whitespace-pre">${asciiText.trim()}</pre>
            `;
            resultContainer.appendChild(asciiDiv);
        }


    } catch (error) {
        console.error('Error during API call:', error);
        resultContainer.textContent = 'Ha ocurrido un error al contactar con el servicio de análisis. Por favor, inténtalo de nuevo más tarde.';
    } finally {
        // --- UI State: Idle ---
        analyzeButton.disabled = false;
        buttonText.textContent = 'Analizar';
        buttonIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-play-circle"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>`;
    }
});