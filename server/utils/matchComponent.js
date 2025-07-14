"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchComponents = matchComponents;
const componentsMap_1 = require("../data/componentsMap");
function matchComponents(query, maxResults = 5) {
    if (!query)
        return [];
    const queryLower = query.toLowerCase();
    const queryTokens = queryLower.split(/\W+/).filter(Boolean);
    // score each component by counting keyword matches
    const scored = componentsMap_1.componentsMap.map((component) => {
        let score = 0;
        component.keywords.forEach((kw) => {
            const kwLower = kw.toLowerCase();
            if (queryTokens.includes(kwLower) || queryLower.includes(kwLower)) {
                score += 1;
            }
        });
        return Object.assign(Object.assign({}, component), { score });
    });
    // sort by score descending, filter zero scores, return top results
    const matched = scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
    return matched.map(({ name, description, source }) => ({ name, description, source }));
}
