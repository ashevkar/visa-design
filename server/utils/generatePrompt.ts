interface Component {
    name: string;
    description: string;
    source: string;
}

export function generatePrompt(query: string, components: Component[]): { role: string; content: string }[] {
    const componentInfo = components
        .map((c, idx) => `${idx + 1}. ${c.name}: ${c.description} ${c.source}`)
        .join('\n');

    // template for AI prompt
    const prompt = [
        {
            "role": "system",
            "content": `You are an experienced UI developer and a Code-copilot familiar with the Visa Product Design System, WCAG (Web Content Accessibility Guidelines) [https://www.w3.org/WAI/standards-guidelines/wcag/] and VGAR (Visa Global Accessibility Requirements) [https://developer.visa.com/pages/accessibility].

                Using the user's intent and the components given, provide example code snippet on how can those components be used together in the requested UI.

                Responsibilities:
                1. Analyze the developer's request and make use of the components given from the @visa/nova-react library.
                2. Generate a single, complete, and runnable React functional component using these components.
                3. The generated code must include the necessary import statements from '@visa/nova-react'.
                4. Use plain CSS for styling & create a modern, clean layout.
                5. The generated code should be a single string.

                CONSTRAINTS:
                1. DO NOT include any external components or libraries.
                2. Use only the components identified by the user from the @visa/nova-react library.
                3. Keep the use of comments limited in the code snippets.
                4. DO NOT hallucinate. Only provide code snippets of the components you know.`
        },
        {
            "role": "user",
            "content": `The user asked: "${query}".
                Relevant components identified: ${componentInfo}`
        }
    ];

    return prompt;
}
