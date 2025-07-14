import { componentsMap } from '../data/componentsMap.ts';

interface Component {
    name: string;
    description: string;
    source: string;
    keywords: string[];
}


export function matchComponents(
    query: string,
    maxResults: number = 5
): Array<{ name: string; description: string }> {
    if (!query) return [];

    const queryLower = query.toLowerCase();
    const queryTokens = queryLower.split(/\W+/).filter(Boolean);

    // score each component by counting keyword matches
    const scored = componentsMap.map((component: Component) => {
        let score = 0;
        component.keywords.forEach((kw) => {
            const kwLower = kw.toLowerCase();
            if (queryTokens.includes(kwLower) || queryLower.includes(kwLower)) {
                score += 1;
            }
        });
        return { ...component, score};
    });

    // sort by score descending, filter zero scores, return top results
    const matched = scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

    return matched.map(({ name, description, source }) => ({ name, description, source }));
}
